import { WORLD_COORDINATE_LIMIT, nowIso, uuid } from '../constants.js'

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))
const round=(value,precision=1000)=>Math.round(value*precision)/precision
export const distance=(first,second)=>Math.hypot(second.x-first.x,second.y-first.y)

// Softness feathers the outside of the selected brush footprint. Keeping a
// broad opaque core makes the visible mark match the diameter shown by the
// cursor instead of concentrating nearly all coverage at its center.
export function brushInnerRadius(radius,softness){return Math.max(0,Number(radius)||0)*(1-.35*clamp(Number(softness)||0,0,1))}

export const STROKE_FALLOFF_STEPS=24
export function strokeSoftness(stroke){const fallback=stroke.edge==='crisp'?0:stroke.edge==='wild'?1:.75;return clamp(Number(stroke.softness??fallback),0,1)}
export function strokeFalloffLayers(radius,softness,steps=STROKE_FALLOFF_STEPS){const outer=Math.max(0,Number(radius)||0),inner=brushInnerRadius(outer,softness),coverage=(amount)=>.012+.978*(amount*amount*(3-2*amount));return Array.from({length:steps},(_,index)=>{const amount=index/(steps-1),current=coverage(amount),previous=index?coverage((index-1)/(steps-1)):0;return{radius:outer-(outer-inner)*amount,alpha:Math.max(0,Math.min(1,(current-previous)/(1-previous)))}})}

export function interpolatePoints(from,to,spacing){
  const length=distance(from,to),steps=Math.max(1,Math.ceil(length/Math.max(.025,spacing))),points=[]
  for(let index=1;index<=steps;index++)points.push({x:round(from.x+(to.x-from.x)*index/steps),y:round(from.y+(to.y-from.y)*index/steps)})
  return points
}

export function simplifyPoints(points,tolerance=.035){
  if(points.length<=2)return points.map((point)=>({...point}))
  const square=tolerance*tolerance
  const perpendicular=(point,start,end)=>{
    const dx=end.x-start.x,dy=end.y-start.y
    if(!dx&&!dy)return (point.x-start.x)**2+(point.y-start.y)**2
    const amount=clamp(((point.x-start.x)*dx+(point.y-start.y)*dy)/(dx*dx+dy*dy),0,1)
    return (point.x-(start.x+dx*amount))**2+(point.y-(start.y+dy*amount))**2
  }
  const keep=new Uint8Array(points.length);keep[0]=1;keep[points.length-1]=1
  const stack=[[0,points.length-1]]
  while(stack.length){const[start,end]=stack.pop();let farthest=start,max=square;for(let index=start+1;index<end;index++){const value=perpendicular(points[index],points[start],points[end]);if(value>max){max=value;farthest=index}}if(farthest!==start){keep[farthest]=1;stack.push([start,farthest],[farthest,end])}}
  return points.filter((_,index)=>keep[index]).map(({x,y})=>({x:round(x),y:round(y)}))
}

export function strokeBounds(points,radius=0){
  if(!points.length)return{minX:0,minY:0,maxX:0,maxY:0,width:0,height:0}
  const minX=Math.min(...points.map((point)=>point.x))-radius,minY=Math.min(...points.map((point)=>point.y))-radius,maxX=Math.max(...points.map((point)=>point.x))+radius,maxY=Math.max(...points.map((point)=>point.y))+radius
  return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY}
}

export function createTerrainStroke(project,layerId,{id=null,terrain=null,mode='paint',points=[],radius=.5,edge='natural',softness=null,discrete=false,order=0}={}){
  const normalized=simplifyPoints(points.map((point)=>({x:clamp(Number(point.x),-WORLD_COORDINATE_LIMIT,WORLD_COORDINATE_LIMIT),y:clamp(Number(point.y),-WORLD_COORDINATE_LIMIT,WORLD_COORDINATE_LIMIT)})),discrete?0:.025)
  const resolvedSoftness=softness===null||softness===undefined?(edge==='crisp'?0:edge==='wild'?1:.75):clamp(Number(softness),0,1)
  return{id:id||uuid(),projectId:project.id,layerId,kind:'terrain-stroke',terrain:mode==='erase'?null:terrain,mode,radius:clamp(Number(radius)||.5,.125,12),edge,softness:resolvedSoftness,discrete:Boolean(discrete),order:Number(order)||0,points:normalized,bounds:strokeBounds(normalized,clamp(Number(radius)||.5,.125,12)),createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null}
}

export function createRoomStructure(project,layerId,{x,y,width,height,terrain='stone',shape='rectangle',rotation=0,sides=6,innerRatio=.48,lineStyle='stone-wall',wallTerrain='dungeon',wallWidth=.52}={}){
  const room={id:uuid(),projectId:project.id,layerId,kind:'room',shape,x:Number(x),y:Number(y),width:Math.max(1,Number(width)),height:Math.max(1,Number(height)),rotation:Number(rotation)||0,sides:clamp(Math.round(Number(sides)||6),3,12),innerRatio:clamp(Number(innerRatio)||.48,.15,.8),floorTerrain:terrain,lineStyle,wallTerrain,wallWidth,closed:true,createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null}
  room.points=roomShapePoints(room);return room
}

export function roomShapePoints(room){
  if(!Number.isFinite(room.x)||!Number.isFinite(room.y)||!Number.isFinite(room.width)||!Number.isFinite(room.height))return(room.points||[]).map((point)=>({...point}))
  const cx=room.x+room.width/2,cy=room.y+room.height/2,rotation=(room.rotation||0)*Math.PI/180,shape=room.shape||'rectangle',count=shape==='rectangle'?4:shape==='ellipse'?32:shape==='star'?Math.max(3,room.sides||5)*2:Math.max(3,room.sides||6),points=[]
  for(let index=0;index<count;index++){let nx,ny;if(shape==='rectangle'){[nx,ny]=[[-1,-1],[1,-1],[1,1],[-1,1]][index]}else{const angle=-Math.PI/2+index*Math.PI*2/count,radius=shape==='star'&&index%2?(room.innerRatio||.48):1;nx=Math.cos(angle)*radius;ny=Math.sin(angle)*radius}const px=nx*room.width/2,py=ny*room.height/2;points.push({x:cx+px*Math.cos(rotation)-py*Math.sin(rotation),y:cy+px*Math.sin(rotation)+py*Math.cos(rotation)})}return points
}

export function normalizeRoomStructure(room){
  if(Number.isFinite(room.x)&&Number.isFinite(room.y)&&Number.isFinite(room.width)&&Number.isFinite(room.height))return room
  const points=room.points||[],xs=points.map((point)=>point.x),ys=points.map((point)=>point.y);if(!points.length)return room
  room.x=Math.min(...xs);room.y=Math.min(...ys);room.width=Math.max(1,Math.max(...xs)-room.x);room.height=Math.max(1,Math.max(...ys)-room.y);room.shape=room.shape||'rectangle';room.rotation=room.rotation||0;room.sides=room.sides||6;room.innerRatio=room.innerRatio||.48;room.lineStyle=room.lineStyle||'stone-wall';return room
}

export function pointInRoom(room,point){const points=roomShapePoints(room);let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a.y>point.y)!==(b.y>point.y))&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}

export function createWallPath(project,layerId,{points=[],lineStyle='stone-wall',wallTerrain='dungeon',wallWidth=.52,closed=false}={}){
  return{id:uuid(),projectId:project.id,layerId,kind:'wall-path',points:simplifyPoints(points,.06),lineStyle,wallTerrain,wallWidth:clamp(Number(wallWidth)||.52,.12,1.5),closed:Boolean(closed),createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null}
}

export function pointInStroke(stroke,point){
  if(stroke.deletedAt||!stroke.points?.length)return false
  if(stroke.discrete)return stroke.points.some((sample)=>distance(sample,point)<=stroke.radius)
  if(stroke.points.length===1)return distance(stroke.points[0],point)<=stroke.radius
  for(let index=1;index<stroke.points.length;index++){
    const start=stroke.points[index-1],end=stroke.points[index],dx=end.x-start.x,dy=end.y-start.y,length=dx*dx+dy*dy
    const amount=length?clamp(((point.x-start.x)*dx+(point.y-start.y)*dy)/length,0,1):0
    if(Math.hypot(point.x-(start.x+dx*amount),point.y-(start.y+dy*amount))<=stroke.radius)return true
  }
  return false
}

export function terrainAtPoint(bundle,x,y){
  const point={x:Number(x)+.5,y:Number(y)+.5},strokes=(bundle?.terrainStrokes||[]).filter((stroke)=>!stroke.deletedAt)
  for(let index=strokes.length-1;index>=0;index--)if(pointInStroke(strokes[index],point))return strokes[index].mode==='erase'?null:strokes[index].terrain
  return null
}
