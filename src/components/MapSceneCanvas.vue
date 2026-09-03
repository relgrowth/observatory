<script setup>
import { Application, Assets, Container, Graphics, Matrix, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cellHash, CHUNK_SIZE, connectedWallSprite, LABEL_FONTS, LABEL_SIZES, LINE_STYLES, OBJECTS, resolveLabelColor, TERRAIN } from '../constants.js'
import { roomShapePoints, simplifyPoints, strokeBounds, strokeFalloffLayers, strokeSoftness } from '../services/mapGeometry.js'
import { loadTerrainMaterialSources } from '../services/terrainRenderer.js'

const props=defineProps({
  bundle:{type:Object,required:true},legacyTerrain:{type:Array,default:()=>[]},
  cameraX:{type:Number,default:0},cameraY:{type:Number,default:0},scale:{type:Number,default:40},showGrid:{type:Boolean,default:true},
  activeStroke:{type:Object,default:null},roomPreview:{type:Object,default:null},wallPreview:{type:Object,default:null},hoverPoint:{type:Object,default:null},
  activeTool:{type:String,default:'select'},selectedTerrain:{type:String,default:'stone'},selectedObject:{type:String,default:'door'},brushRadius:{type:Number,default:.5},
  selection:{type:Object,default:null},liveObject:{type:Object,default:null},liveRoom:{type:Object,default:null},liveLabel:{type:Object,default:null},editingLabelId:{type:String,default:null},theme:{type:String,default:'basic'},
})
const host=ref(null)
let app,resizeObserver,renderFrame,ready=false,materials={},materialSources={},wallFrames=[],lineFrames={},objectFrames=[]
let cachedStrokeRecords=[],terrainCacheTick=0,disposed=false
const pendingMaterials=new Set()
const terrainChunkCache=new Map()
const roots={},TERRAIN_CACHE_BUDGET=96*1024*1024
const CANVAS_THEMES={basic:{background:0xe3ddd2,grid:0x544d43,gridAlpha:.17,selection:0x2f2922,cursor:0x2f2922},charcoal:{background:0x20231e,grid:0xece7da,gridAlpha:.12,selection:0xfffaee,cursor:0xfff8e9}}
const canvasTheme=()=>CANVAS_THEMES[props.theme]||CANVAS_THEMES.basic
const BACKGROUND=canvasTheme().background
const terrainById=Object.fromEntries(TERRAIN.map((item)=>[item.id,item])),objectById=Object.fromEntries(OBJECTS.map((item)=>[item.id,item]))
const layerVisible=(kind)=>props.bundle.layers?.find((layer)=>layer.kind===kind)?.visible!==false

function requestRender(){if(!ready||renderFrame)return;renderFrame=requestAnimationFrame(()=>{renderFrame=0;app.renderer.render(app.stage)})}
function requiredMaterialIds(){const ids=new Set([props.selectedTerrain,'dungeon']);for(const cell of props.legacyTerrain||[])ids.add(cell.terrain);for(const stroke of props.bundle.terrainStrokes||[])if(!stroke.deletedAt&&stroke.terrain)ids.add(stroke.terrain);for(const structure of props.bundle.structures||[])if(!structure.deletedAt){if(structure.floorTerrain)ids.add(structure.floorTerrain);if(structure.wallTerrain)ids.add(structure.wallTerrain)}return[...ids].filter(Boolean)}
async function ensureMaterials(ids=requiredMaterialIds()){
  const missing=ids.filter((id)=>!materials[id]&&!pendingMaterials.has(id));if(!missing.length)return
  missing.forEach((id)=>pendingMaterials.add(id))
  try{const sources=await loadTerrainMaterialSources(missing);if(!app||disposed)return;for(const[id,source]of Object.entries(sources)){materialSources[id]=source;const texture=Texture.from(source);texture.source.style.addressMode='repeat';materials[id]=texture}if(ready){resetTerrainCache();syncModel()}}
  finally{missing.forEach((id)=>pendingMaterials.delete(id))}
}
function destroyOwnedTextures(root){for(const child of root?.children||[])destroyOwnedTextures(child);root?.__ownedTexture?.destroy(true)}
function clear(root){for(const child of root.removeChildren()){destroyOwnedTextures(child);child.destroy?.({children:true})}}
function textureStyle(id,textureSpace='global'){const terrain=terrainById[id]||TERRAIN[0],texture=materials[id]||Texture.WHITE,period=terrain.texturePeriod||16;return{texture,textureSpace,matrix:new Matrix().scale(period/Math.max(1,texture.width),period/Math.max(1,texture.height))}}
function path(graphics,points,closed=false){if(!points?.length)return graphics;graphics.moveTo(points[0].x,points[0].y);for(let index=1;index<points.length;index++)graphics.lineTo(points[index].x,points[index].y);if(closed)graphics.closePath();return graphics}
function organicStamp(graphics,point,radius,seed){graphics.circle(point.x,point.y,radius);const lobes=radius>.3?3:1;for(let index=0;index<lobes;index++){const angle=(cellHash(Math.round(point.x*31)+index,Math.round(point.y*37)-index)%6283)/1000,distance=radius*(.48+(cellHash(index+seed,seed-index)%18)/100),size=radius*(.34+(cellHash(seed-index,index+7)%15)/100);graphics.circle(point.x+Math.cos(angle)*distance,point.y+Math.sin(angle)*distance,size)}}
function strokeShape(graphics,stroke,radius,style,seedOffset=0){
  const points=stroke.points
  if(stroke.discrete){for(let index=0;index<points.length;index++){if(stroke.edge==='crisp')graphics.rect(points[index].x-radius,points[index].y-radius,radius*2,radius*2);else organicStamp(graphics,points[index],radius,index+(stroke.terrain?.length||1)+seedOffset)}return'fill'}
  if(points.length===1){graphics.circle(points[0].x,points[0].y,radius);return'fill'}
  // One round path per falloff contour keeps continuous strokes smooth without
  // generating hundreds of overlapping circle meshes along every segment.
  path(graphics,points).stroke({...style,width:radius*2,cap:'round',join:'round'})
  return'done'
}
function maskedStroke(stroke,parent,style,softness,alpha,{maxDimension=1600}={}){
  const radius=Math.max(.08,stroke.radius||.5),sourceBounds=stroke.bounds||{minX:Math.min(...stroke.points.map(p=>p.x))-radius,minY:Math.min(...stroke.points.map(p=>p.y))-radius,maxX:Math.max(...stroke.points.map(p=>p.x))+radius,maxY:Math.max(...stroke.points.map(p=>p.y))+radius}
  const padding=Math.max(.15,radius*.08),bounds={minX:sourceBounds.minX-padding,minY:sourceBounds.minY-padding,maxX:sourceBounds.maxX+padding,maxY:sourceBounds.maxY+padding},width=bounds.maxX-bounds.minX,height=bounds.maxY-bounds.minY
  // Cap both dimensions rather than imposing a minimum sample density. A very
  // long stroke should become a lower-resolution mask at a distant zoom, not a
  // multi-thousand-pixel allocation on every pointer move.
  const samples=Math.min(14,maxDimension/Math.max(width,height)),canvas=document.createElement('canvas');canvas.width=Math.max(2,Math.ceil(width*samples));canvas.height=Math.max(2,Math.ceil(height*samples))
  const context=canvas.getContext('2d');context.scale(samples,samples);context.translate(-bounds.minX,-bounds.minY);context.lineCap='round';context.lineJoin='round'
  const draw=(layerRadius,layerAlpha)=>{context.beginPath();if(stroke.points.length===1){context.arc(stroke.points[0].x,stroke.points[0].y,layerRadius,0,Math.PI*2);context.fillStyle=`rgba(255,255,255,${layerAlpha})`;context.fill()}else{context.moveTo(stroke.points[0].x,stroke.points[0].y);for(const point of stroke.points.slice(1))context.lineTo(point.x,point.y);context.lineWidth=layerRadius*2;context.strokeStyle=`rgba(255,255,255,${layerAlpha})`;context.stroke()}}
  for(const layer of strokeFalloffLayers(radius,softness))draw(layer.radius,layer.alpha)
  const texture=Texture.from(canvas),mask=new Sprite(texture),paint=new Graphics().rect(bounds.minX,bounds.minY,width,height).fill(style),group=new Container();mask.position.set(bounds.minX,bounds.minY);mask.width=width;mask.height=height;mask.__ownedTexture=texture;paint.mask=mask;paint.alpha=alpha;group.addChild(paint,mask);parent.addChild(group);return group
}
function drawStroke(stroke,parent,{alpha=1,cursor=false,fast=false}={}){
  if(!stroke?.points?.length)return null
  const radius=Math.max(.08,stroke.radius||.5),erase=stroke.mode==='erase',style=erase?{color:0xffffff}:textureStyle(stroke.terrain)
  const softness=strokeSoftness(stroke)
  // The brush cursor describes the footprint without contributing any painted
  // material. A translucent fill here makes the leading edge look wider while
  // dragging and then appear to shrink as soon as the pointer is released.
  if(cursor){const point=stroke.points.at(-1),outline=new Graphics().circle(point.x,point.y,radius).stroke({color:canvasTheme().cursor,width:Math.max(.035,1.5/props.scale),alpha:.95});outline.alpha=alpha;parent.addChild(outline);return outline}
  const renderStroke=fast&&!stroke.discrete?{...stroke,points:simplifyPoints(stroke.points,Math.max(.025,1.25/Math.max(1,props.scale)))}:stroke
  if(softness<=.02){const solid=new Graphics(),mode=strokeShape(solid,renderStroke,radius,style);if(mode==='fill')solid.fill(style);solid.alpha=alpha;if(erase)solid.blendMode='erase';parent.addChild(solid);return solid}
  // Continuous soft strokes use one renderer before and after pointer-up.
  // The live mask has a tighter allocation cap, but identical geometry and
  // falloff, so committing cannot make the brush footprint contract.
  if(!stroke.discrete){const rendered=maskedStroke(renderStroke,parent,style,softness,alpha,{maxDimension:fast?1024:1600});if(erase)rendered.blendMode='erase';return rendered}
  // Paint a deterministic alpha ramp from the outside inward. Each successive
  // union is smaller and slightly stronger, creating a genuinely soft edge
  // without blurring the material texture itself.
  const layers=new Container()
  for(const falloff of strokeFalloffLayers(radius,softness)){
    const layer=new Graphics(),mode=strokeShape(layer,renderStroke,falloff.radius,style);if(mode==='fill')layer.fill(style)
    layer.alpha=falloff.alpha;layers.addChild(layer)
  }
  layers.alpha=alpha;if(erase)layers.blendMode='erase';parent.addChild(layers);return layers
}
function drawLegacyTerrain(){clear(roots.legacy);if(!layerVisible('terrain'))return;for(const terrain of TERRAIN){const cells=props.legacyTerrain.filter((cell)=>cell.terrain===terrain.id);if(!cells.length)continue;const graphics=new Graphics();for(const cell of cells){if(cell.edge==='crisp')graphics.rect(cell.x,cell.y,1,1);else organicStamp(graphics,{x:cell.x+.5,y:cell.y+.5},cell.edge==='wild'?.84:.72,cellHash(cell.x,cell.y))}graphics.fill(textureStyle(terrain.id));roots.legacy.addChild(graphics)}}
const modulo=(value,divisor)=>((value%divisor)+divisor)%divisor
const intersects=(first,second)=>first.maxX>second.minX&&first.minX<second.maxX&&first.maxY>second.minY&&first.minY<second.maxY
const boundsForStroke=(stroke)=>stroke.bounds||strokeBounds(stroke.points||[],stroke.radius||.5)
const strokeRecord=(stroke)=>({id:stroke.id,signature:[stroke.terrain,stroke.mode,stroke.radius,stroke.edge,stroke.softness,stroke.order,stroke.updatedAt,stroke.deletedAt,stroke.points?.length].join('|'),bounds:{...boundsForStroke(stroke)}})
function destroyTerrainEntry(entry){entry.sprite.parent?.removeChild(entry.sprite);entry.sprite.destroy();entry.texture.destroy(true)}
function resetTerrainCache(){roots.strokes?.removeChildren();for(const entry of terrainChunkCache.values())destroyTerrainEntry(entry);terrainChunkCache.clear();cachedStrokeRecords=[]}
function invalidateTerrainBounds(bounds){for(const[key,entry]of terrainChunkCache)if(intersects(entry.bounds,bounds)){destroyTerrainEntry(entry);terrainChunkCache.delete(key)}}
function reconcileTerrainChanges(strokes){
  const next=strokes.map(strokeRecord),previous=new Map(cachedStrokeRecords.map((record)=>[record.id,record])),current=new Map(next.map((record)=>[record.id,record])),dirty=[]
  for(const record of cachedStrokeRecords){const match=current.get(record.id);if(!match||match.signature!==record.signature)dirty.push(record.bounds)}
  for(const record of next){const match=previous.get(record.id);if(!match||match.signature!==record.signature)dirty.push(record.bounds)}
  if(dirty.length>16)resetTerrainCache();else for(const bounds of dirty)invalidateTerrainBounds(bounds)
  cachedStrokeRecords=next
}
function cacheDensity(){const target=props.scale*(devicePixelRatio||1);return target<=12?8:target<=24?16:target<=48?32:64}
function visibleWorldBounds(margin=1){const width=host.value?.clientWidth||0,height=host.value?.clientHeight||0;return{minX:props.cameraX-width/(2*props.scale)-margin,minY:props.cameraY-height/(2*props.scale)-margin,maxX:props.cameraX+width/(2*props.scale)+margin,maxY:props.cameraY+height/(2*props.scale)+margin}}
function canvasOrganicStamp(context,point,radius,seed){context.arc(point.x,point.y,radius,0,Math.PI*2);const lobes=radius>.3?3:1;for(let index=0;index<lobes;index++){const angle=(cellHash(Math.round(point.x*31)+index,Math.round(point.y*37)-index)%6283)/1000,distance=radius*(.48+(cellHash(index+seed,seed-index)%18)/100),size=radius*(.34+(cellHash(seed-index,index+7)%15)/100),x=point.x+Math.cos(angle)*distance,y=point.y+Math.sin(angle)*distance;context.moveTo(x+size,y);context.arc(x,y,size,0,Math.PI*2)}}
function traceMaskLayer(context,stroke,radius,alpha){
  context.beginPath()
  if(stroke.discrete){for(let index=0;index<stroke.points.length;index++){const point=stroke.points[index];if(stroke.edge==='crisp')context.rect(point.x-radius,point.y-radius,radius*2,radius*2);else canvasOrganicStamp(context,point,radius,index+(stroke.terrain?.length||1))}context.fillStyle=`rgba(255,255,255,${alpha})`;context.fill();return}
  if(stroke.points.length===1){context.arc(stroke.points[0].x,stroke.points[0].y,radius,0,Math.PI*2);context.fillStyle=`rgba(255,255,255,${alpha})`;context.fill();return}
  context.moveTo(stroke.points[0].x,stroke.points[0].y);for(const point of stroke.points.slice(1))context.lineTo(point.x,point.y);context.lineWidth=radius*2;context.strokeStyle=`rgba(255,255,255,${alpha})`;context.stroke()
}
function paintCachedStroke(context,stroke,originX,originY,density,size){
  context.clearRect(0,0,size,size);context.save();context.scale(density,density);context.translate(-originX,-originY);context.lineCap='round';context.lineJoin='round'
  const radius=Math.max(.08,stroke.radius||.5),softness=strokeSoftness(stroke)
  if(softness<=.02)traceMaskLayer(context,stroke,radius,1)
  else for(const layer of strokeFalloffLayers(radius,softness))traceMaskLayer(context,stroke,layer.radius,layer.alpha)
  context.restore();context.globalCompositeOperation='source-in'
  if(stroke.mode==='erase')context.fillStyle='#ffffff'
  else{const source=materialSources[stroke.terrain],terrain=terrainById[stroke.terrain]||TERRAIN[0],period=(terrain.texturePeriod||16)*density;if(source){const pattern=context.createPattern(source,'repeat'),phaseX=modulo(originX*density,period),phaseY=modulo(originY*density,period);pattern?.setTransform?.(new DOMMatrix().translate(-phaseX,-phaseY).scale(period/Math.max(1,source.width),period/Math.max(1,source.height)));context.fillStyle=pattern||'#ffffff'}else context.fillStyle='#ffffff'}
  context.fillRect(0,0,size,size);context.globalCompositeOperation='source-over'
}
function renderTerrainChunk(chunkX,chunkY,density,strokes){
  const originX=chunkX*CHUNK_SIZE,originY=chunkY*CHUNK_SIZE,size=CHUNK_SIZE*density,canvas=document.createElement('canvas'),scratch=document.createElement('canvas');canvas.width=canvas.height=scratch.width=scratch.height=size
  const context=canvas.getContext('2d'),scratchContext=scratch.getContext('2d'),bounds={minX:originX,minY:originY,maxX:originX+CHUNK_SIZE,maxY:originY+CHUNK_SIZE}
  for(const stroke of strokes)if(intersects(boundsForStroke(stroke),bounds)){paintCachedStroke(scratchContext,stroke,originX,originY,density,size);context.globalCompositeOperation=stroke.mode==='erase'?'destination-out':'source-over';context.drawImage(scratch,0,0)}
  context.globalCompositeOperation='source-over'
  const texture=Texture.from(canvas),sprite=new Sprite(texture);texture.source.style.scaleMode='linear';sprite.position.set(originX,originY);sprite.width=sprite.height=CHUNK_SIZE
  return{texture,sprite,bounds,bytes:size*size*4,lastUsed:++terrainCacheTick}
}
function trimTerrainCache(visibleKeys){let bytes=[...terrainChunkCache.values()].reduce((sum,entry)=>sum+entry.bytes,0);if(bytes<=TERRAIN_CACHE_BUDGET)return;const candidates=[...terrainChunkCache.entries()].filter(([key])=>!visibleKeys.has(key)).sort((a,b)=>a[1].lastUsed-b[1].lastUsed);for(const[key,entry]of candidates){destroyTerrainEntry(entry);terrainChunkCache.delete(key);bytes-=entry.bytes;if(bytes<=TERRAIN_CACHE_BUDGET)break}}
function drawTerrainStrokes(){
  roots.strokes.removeChildren();const strokes=layerVisible('terrain')?(props.bundle.terrainStrokes||[]).filter((stroke)=>!stroke.deletedAt):[];reconcileTerrainChanges(strokes);if(!strokes.length)return
  const viewport=visibleWorldBounds(2),density=cacheDensity(),minimumX=Math.floor(viewport.minX/CHUNK_SIZE),maximumX=Math.floor(viewport.maxX/CHUNK_SIZE),minimumY=Math.floor(viewport.minY/CHUNK_SIZE),maximumY=Math.floor(viewport.maxY/CHUNK_SIZE),visibleKeys=new Set()
  for(let chunkY=minimumY;chunkY<=maximumY;chunkY++)for(let chunkX=minimumX;chunkX<=maximumX;chunkX++){const bounds={minX:chunkX*CHUNK_SIZE,minY:chunkY*CHUNK_SIZE,maxX:(chunkX+1)*CHUNK_SIZE,maxY:(chunkY+1)*CHUNK_SIZE};if(!strokes.some((stroke)=>intersects(boundsForStroke(stroke),bounds)))continue;const key=`${density}:${chunkX}:${chunkY}`;visibleKeys.add(key);let entry=terrainChunkCache.get(key);if(!entry){entry=renderTerrainChunk(chunkX,chunkY,density,strokes);terrainChunkCache.set(key,entry)}entry.lastUsed=++terrainCacheTick;roots.strokes.addChild(entry.sprite)}
  trimTerrainCache(visibleKeys)
}
function samplePath(points,spacing,visit){let carry=0;for(let index=1;index<points.length;index++){const from=points[index-1],to=points[index],dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(!length)continue;for(let distance=spacing-carry;distance<=length;distance+=spacing){const amount=distance/length;visit({x:from.x+dx*amount,y:from.y+dy*amount},dx/length,dy/length)}carry=(carry+length)%spacing}}
function drawWallPath(item,parent=roots.structures,alpha=1,_localTexture=false){
  if(!item.points?.length)return
  const style=item.lineStyle||'stone-wall',width=item.wallWidth||.52,frames=lineFrames[style]||lineFrames['stone-wall']||[],points=item.closed?[...item.points,item.points[0]]:item.points,group=new Container(),spacing=Math.max(.12,width*.34),stamp=(point,dx=1,dy=0)=>{if(!frames.length)return;const frameIndex=cellHash(Math.round(point.x*19),Math.round(point.y*23))%frames.length,sprite=new Sprite(frames[frameIndex]);sprite.anchor.set(.5);sprite.position.set(point.x,point.y);sprite.width=spacing*1.32;sprite.height=width;sprite.rotation=Math.atan2(dy,dx);group.addChild(sprite)}
  if(points.length===1)stamp(points[0]);else{const first=points[0],second=points[1];stamp(first,second.x-first.x,second.y-first.y);samplePath(points,spacing,stamp);const last=points.at(-1),previous=points.at(-2);stamp(last,last.x-previous.x,last.y-previous.y)}
  group.alpha=alpha;group.zIndex=item.zIndex||0;parent.addChild(group)
}
function drawRoom(item,parent=roots.structures,alpha=1){const worldPoints=roomShapePoints(item),originX=Number(item.x)||0,originY=Number(item.y)||0,points=worldPoints.map((point)=>({x:point.x-originX,y:point.y-originY})),group=new Container(),floor=new Graphics();group.position.set(originX,originY);group.zIndex=item.zIndex||0;path(floor,points,true).fill(textureStyle(item.floorTerrain||'stone'));floor.alpha=alpha;group.addChild(floor);drawWallPath({...item,points,closed:true,zIndex:1},group,alpha,true);parent.addChild(group)}
function drawStructures(){clear(roots.structures);if(!layerVisible('structure'))return;roots.structures.sortableChildren=true;const legacy=props.bundle.structures?.filter((item)=>!item.deletedAt&&item.kind==='wall')||[];for(const item of legacy){const frame=wallFrames[connectedWallSprite(legacy,item)];if(!frame)continue;const sprite=new Sprite(frame);sprite.position.set(item.x,item.y);sprite.width=1;sprite.height=1;sprite.zIndex=item.zIndex||0;roots.structures.addChild(sprite)}for(const saved of props.bundle.structures||[]){const item=props.liveRoom?.id===saved.id?props.liveRoom:saved;if(!item.deletedAt&&item.kind==='room')drawRoom(item);else if(!item.deletedAt&&item.kind==='wall-path')drawWallPath(item)}roots.structures.sortChildren()}
function drawObjects(){clear(roots.objects);if(!layerVisible('objects'))return;for(const savedItem of props.bundle.objects||[]){const item=props.liveObject?.id===savedItem.id?props.liveObject:savedItem;if(item.deletedAt)continue;const asset=objectById[item.assetId],frame=objectFrames[asset?.sprite];if(!asset||!frame)continue;const sprite=new Sprite(frame),size=Math.max(asset.width,asset.height),scale=item.scale||1;sprite.anchor.set(.5);sprite.position.set((item.x??0)+.5,(item.y??0)+.5);sprite.width=size*scale;sprite.height=size*scale;sprite.rotation=(item.rotation||0)*Math.PI/180;sprite.zIndex=item.zIndex||0;roots.objects.addChild(sprite)}roots.objects.sortableChildren=true;roots.objects.sortChildren()}
function drawLabels(){clear(roots.labels);if(!layerVisible('labels'))return;const screenScale=Math.max(.001,props.scale);for(const savedItem of props.bundle.labels||[]){const item=props.liveLabel?.id===savedItem.id?props.liveLabel:savedItem;if(item.deletedAt||item.id===props.editingLabelId)continue;const size=LABEL_SIZES.find(({id})=>id===item.size)||LABEL_SIZES[1],font=LABEL_FONTS.find(({id})=>id===item.font)||LABEL_FONTS[0],color=resolveLabelColor(item.color),boxed=Number.isFinite(item.boxWidth),fontSize=(item.fontSize||Math.max(size.sceneSize,16/screenScale))*screenScale,label=new Text({text:item.text,resolution:Math.min(2,devicePixelRatio||1),style:{fontFamily:font.family,fontSize,fill:color.value,fontWeight:item.bold||item.size==='large'?'700':'600',align:'center',wordWrap:boxed,wordWrapWidth:boxed?item.boxWidth*screenScale:100*screenScale,breakWords:true,lineHeight:fontSize*1.2}});label.scale.set(1/screenScale);if(boxed){const frame=new Container();frame.position.set((item.x??0)+item.boxWidth/2,(item.y??0)+(item.boxHeight||1)/2);frame.rotation=(item.rotation||0)*Math.PI/180;label.anchor.set(.5,0);label.position.set(0,-(item.boxHeight||1)/2);frame.addChild(label);roots.labels.addChild(frame)}else{label.anchor.set(.5);label.position.set((item.x??0)+.5,(item.y??0)+.5);label.rotation=(item.rotation||0)*Math.PI/180;roots.labels.addChild(label)}}}
function drawGrid(){clear(roots.grid);if(!props.showGrid||!host.value)return;const width=host.value.clientWidth,height=host.value.clientHeight,left=props.cameraX-width/(2*props.scale)-1,right=props.cameraX+width/(2*props.scale)+1,top=props.cameraY-height/(2*props.scale)-1,bottom=props.cameraY+height/(2*props.scale)+1,grid=new Graphics(),theme=canvasTheme();for(let x=Math.floor(left);x<=Math.ceil(right);x++)grid.moveTo(x,top).lineTo(x,bottom);for(let y=Math.floor(top);y<=Math.ceil(bottom);y++)grid.moveTo(left,y).lineTo(right,y);grid.stroke({color:theme.grid,width:Math.max(.015,1/props.scale),alpha:theme.gridAlpha});roots.grid.addChild(grid)}
function drawSelection(){clear(roots.selection);if(props.selection?.kind!=='object')return;const item=props.liveObject||props.bundle.objects?.find((entry)=>entry.id===props.selection.id);if(!item||item.deletedAt)return;const asset=objectById[item.assetId]||{width:1,height:1},size=Math.max(asset.width,asset.height)*(item.scale||1),box=new Graphics().rect(item.x+.5-size/2,item.y+.5-size/2,size,size).stroke({color:canvasTheme().selection,width:Math.max(.035,2/props.scale),alpha:.96});roots.selection.addChild(box)}
function drawTransient(){
  clear(roots.terrainPreview);clear(roots.structurePreview);clear(roots.overlayPreview)
  const activeAlreadyCommitted=props.activeStroke?.id&&(props.bundle.terrainStrokes||[]).some((stroke)=>stroke.id===props.activeStroke.id)
  // Transient drawing lives at the same semantic depth as its committed form.
  // Objects therefore stay above paint, rooms, and walls throughout a gesture.
  if(props.activeStroke&&!activeAlreadyCommitted)drawStroke(props.activeStroke,roots.terrainPreview,{alpha:1,fast:true})
  if(props.roomPreview)drawRoom(props.roomPreview,roots.structurePreview,.82)
  if(props.wallPreview)drawWallPath(props.wallPreview,roots.structurePreview,.82)
  if(props.activeTool==='terrain'&&props.hoverPoint)drawStroke({terrain:props.selectedTerrain,mode:'paint',radius:props.brushRadius,edge:props.activeStroke?.edge||'natural',softness:props.activeStroke?.softness??1,points:[props.hoverPoint],discrete:true},roots.overlayPreview,{alpha:.9,cursor:true})
  if(props.activeTool==='erase'&&props.hoverPoint){const cursor=new Graphics().circle(props.hoverPoint.x,props.hoverPoint.y,props.brushRadius).fill({color:0xe0685b,alpha:.12}).stroke({color:canvasTheme().cursor,width:Math.max(.035,1.5/props.scale),alpha:.95});roots.overlayPreview.addChild(cursor)}
  if(props.activeTool==='object'&&props.hoverPoint){const asset=objectById[props.selectedObject],frame=objectFrames[asset?.sprite];if(asset&&frame){const sprite=new Sprite(frame),size=Math.max(asset.width,asset.height);sprite.anchor.set(.5);sprite.position.set(props.hoverPoint.x,props.hoverPoint.y);sprite.width=size;sprite.height=size;sprite.alpha=.72;roots.overlayPreview.addChild(sprite)}}
}
function syncModel(){if(!ready)return;drawLegacyTerrain();drawTerrainStrokes();drawStructures();drawObjects();drawLabels();drawSelection();drawTransient();requestRender()}
function updateCamera(){if(!ready||!host.value)return;roots.world.position.set(host.value.clientWidth/2-props.cameraX*props.scale,host.value.clientHeight/2-props.cameraY*props.scale);roots.world.scale.set(props.scale);drawTerrainStrokes();drawLabels();drawGrid();drawSelection();drawTransient();requestRender()}
async function setup(){app=new Application();await app.init({resizeTo:host.value,background:BACKGROUND,antialias:true,autoDensity:true,resolution:Math.min(2,devicePixelRatio||1),preference:'webgl'});if(disposed)return;app.ticker.stop();app.canvas.className='map-scene-canvas';host.value.appendChild(app.canvas);roots.world=new Container();for(const name of ['legacy','strokes','terrainPreview','grid','structures','structurePreview','objects','labels','selection','overlayPreview'])roots[name]=new Container();roots.world.addChild(roots.legacy,roots.strokes,roots.terrainPreview,roots.grid,roots.structures,roots.structurePreview,roots.objects,roots.labels,roots.selection,roots.overlayPreview);app.stage.addChild(roots.world);await Promise.all(LABEL_FONTS.filter((font)=>!font.legacy).map((font)=>document.fonts.load(`16px "${font.family}"`)));const[sources,wallAtlas,objectAtlas,...lineAtlases]=await Promise.all([loadTerrainMaterialSources(requiredMaterialIds()),Assets.load('/assets/terrain/connected-walls-atlas.webp'),Assets.load('/assets/objects/story-shack-object-atlas.webp'),...LINE_STYLES.map((style)=>Assets.load(style.asset))]);if(disposed)return;materialSources=sources;materials=Object.fromEntries(Object.entries(sources).map(([id,source])=>{const texture=Texture.from(source);texture.source.style.addressMode='repeat';return[id,texture]}));const frames=(atlas)=>{const width=atlas.width/4,height=atlas.height/4;return Array.from({length:16},(_,index)=>new Texture({source:atlas.source,frame:new Rectangle((index%4)*width,Math.floor(index/4)*height,width,height)}))},stripFrames=(atlas)=>{const count=12,width=atlas.width/count;return Array.from({length:count},(_,index)=>new Texture({source:atlas.source,frame:new Rectangle(index*width,0,width,atlas.height)}))};wallFrames=frames(wallAtlas);objectFrames=frames(objectAtlas);lineFrames=Object.fromEntries(LINE_STYLES.map((style,index)=>[style.id,stripFrames(lineAtlases[index])]));ready=true;syncModel();updateCamera();resizeObserver=new ResizeObserver(()=>{app.renderer.resize(host.value.clientWidth,host.value.clientHeight);updateCamera()});resizeObserver.observe(host.value)}
onMounted(setup)
watch(()=>props.bundle?.project?.revision,()=>{ensureMaterials();syncModel()})
watch(()=>[props.cameraX,props.cameraY,props.scale,props.showGrid],updateCamera)
watch(()=>props.theme,()=>{if(!ready)return;app.renderer.background.color=canvasTheme().background;resetTerrainCache();syncModel();updateCamera()})
watch(()=>[props.activeStroke,props.roomPreview,props.wallPreview,props.hoverPoint,props.activeTool,props.selectedTerrain,props.selectedObject],()=>{if(!ready)return;drawTransient();drawSelection();requestRender()},{deep:true})
watch(()=>props.selectedTerrain,(terrain)=>ensureMaterials([terrain]))
watch(()=>[props.selection,props.liveObject,props.liveRoom,props.liveLabel,props.editingLabelId],()=>{if(!ready)return;drawStructures();drawObjects();drawLabels();drawSelection();requestRender()},{deep:true})
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(renderFrame);resizeObserver?.disconnect();resetTerrainCache();app?.destroy(true,{children:true,texture:false,textureSource:false})})
</script>

<template><div ref="host" class="map-scene-host" aria-hidden="true"></div></template>
