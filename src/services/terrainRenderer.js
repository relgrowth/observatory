import { cellHash, TERRAIN, terrainDetailSprite } from '../constants.js'

export const TERRAIN_VARIANT_URLS = [
  '/assets/terrain/story-shack-terrain-atlas.webp',
  '/assets/terrain/story-shack-terrain-atlas-v2.webp',
  '/assets/terrain/story-shack-terrain-atlas-v3.webp',
  '/assets/terrain/story-shack-terrain-atlas-v4.webp',
]

const DETAIL_URL = '/assets/terrain/natural-details-atlas.webp'
const MATERIAL_GRAIN_URL = '/assets/terrain/story-shack-material-grain.jpg'
export const DEDICATED_MATERIAL_URLS = {
  wood: '/assets/terrain/observatory-wood-floor-seamless.jpg',
  'moss-stone': '/assets/terrain/observatory-mossy-stone-seamless.jpg',
}
const FIELD_SAMPLES_PER_CELL = 12
const MATERIAL_TEXTURE_SIZE = 1040
const MATERIAL_QUILT_STEP = 208
const MATERIAL_QUILT_SEAM = 24
const TERRAIN_SEEDS = new Map(TERRAIN.map((terrain,index)=>[terrain.id,index*97+31]))
const EDGE_PROFILES = {
  crisp: { inner: .47, outer: .53, noise: 0, strength: 12, halo: .53 },
  natural: { inner: .5, outer: 1.06, noise: .1, strength: 1, halo: 1.06 },
  wild: { inner: .46, outer: 1.32, noise: .2, strength: .88, halo: 1.32 },
}
let assetPromise

const loadImage = (src) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src })
const createSurface = (width, height) => { const surface = document.createElement('canvas'); surface.width = Math.max(1, Math.round(width)); surface.height = Math.max(1, Math.round(height)); return surface }
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value))
const smoothstep = (minimum, maximum, value) => { const amount = clamp((value - minimum) / (maximum - minimum)); return amount * amount * (3 - 2 * amount) }
const interpolate=(from,to,amount)=>from+(to-from)*amount
function valueNoise(x,y,seed){
  const left=Math.floor(x),top=Math.floor(y),amountX=smoothstep(0,1,x-left),amountY=smoothstep(0,1,y-top)
  const sample=(sampleX,sampleY)=>(cellHash(sampleX+seed*17,sampleY-seed*29)%2048)/2047
  return interpolate(interpolate(sample(left,top),sample(left+1,top),amountX),interpolate(sample(left,top+1),sample(left+1,top+1),amountX),amountY)*2-1
}
function terrainBoundaryNoise(id,worldX,worldY){const seed=TERRAIN_SEEDS.get(id)||1;return valueNoise(worldX*.7,worldY*.7,seed)*.78+valueNoise(worldX*2.15,worldY*2.15,seed+43)*.22}
function normalizeMaterialWeights(entries,worldX,worldY){
  const active=entries.filter(([,value])=>value>0)
  if(active.length<2){const only=active[0];return only?new Map([[only[0],1]]):new Map()}
  // Let the boundary field choose a material decisively. A high exponent keeps
  // just enough fractional coverage for antialiasing without creating a broad
  // translucent cross-fade between unrelated textures.
  const scores=active.map(([id,value])=>[id,Math.pow(value*Math.max(.38,1+terrainBoundaryNoise(id,worldX,worldY)*.62),12)])
  const total=scores.reduce((sum,[,value])=>sum+value,0)
  return new Map(scores.map(([id,value])=>[id,value/total]))
}
function mirroredTexture(source,size=source.width){
  const texture=createSurface(size*2,size*2),context=texture.getContext('2d')
  for(let row=0;row<2;row++)for(let column=0;column<2;column++){
    context.save();context.translate(column*size+(column?size:0),row*size+(row?size:0));context.scale(column?-1:1,row?-1:1);context.drawImage(source,0,0,source.width,source.height,0,0,size,size);context.restore()
  }
  return texture
}
function drawWrapped(context,source,offsetX,offsetY){
  for(let row=-1;row<=1;row++)for(let column=-1;column<=1;column++)context.drawImage(source,column*source.width-offsetX,row*source.height-offsetY,source.width,source.height)
}
function pixelDifference(first,firstIndex,second,secondIndex){let difference=0;for(let channel=0;channel<3;channel++){const delta=first[firstIndex+channel]-second[secondIndex+channel];difference+=delta*delta}return difference}
function minimumCostSeam(cost,width,height){
  let previous=new Float32Array(width),current=new Float32Array(width);previous.set(cost.subarray(0,width));const parents=new Int16Array(cost.length)
  for(let y=1;y<height;y++){
    for(let x=0;x<width;x++){
      let parent=x,best=previous[x]
      if(x&&previous[x-1]<best){parent=x-1;best=previous[x-1]}
      if(x+1<width&&previous[x+1]<best){parent=x+1;best=previous[x+1]}
      current[x]=cost[y*width+x]+best;parents[y*width+x]=parent
    }
    const swap=previous;previous=current;current=swap
  }
  let end=0;for(let x=1;x<width;x++)if(previous[x]<previous[end])end=x
  const seam=new Int16Array(height);seam[height-1]=end
  for(let y=height-1;y>0;y--)seam[y-1]=parents[y*width+seam[y]]
  return seam
}
function verticalQuiltSeam(left,current,size,step,overlap){
  const cost=new Float32Array(size*overlap)
  for(let y=0;y<size;y++)for(let x=0;x<overlap;x++)cost[y*overlap+x]=pixelDifference(left.data,(y*size+step+x)*4,current.data,(y*size+x)*4)
  return minimumCostSeam(cost,overlap,size)
}
function horizontalQuiltSeam(top,current,size,step,overlap){
  const cost=new Float32Array(size*overlap)
  for(let x=0;x<size;x++)for(let y=0;y<overlap;y++)cost[x*overlap+y]=pixelDifference(top.data,((step+y)*size+x)*4,current.data,(y*size+x)*4)
  return minimumCostSeam(cost,overlap,size)
}
function quiltMask(size,leftSeam,topSeam){
  const mask=createSurface(size,size),maskContext=mask.getContext('2d'),image=maskContext.createImageData(size,size)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)image.data[(y*size+x)*4+3]=Math.round(smoothstep(leftSeam[y]-1,leftSeam[y]+1,x)*smoothstep(topSeam[x]-1,topSeam[x]+1,y)*255)
  maskContext.putImageData(image,0,0);return mask
}
function materialTexture(tiles,seed){
  const size=MATERIAL_TEXTURE_SIZE,texture=createSurface(size,size),context=texture.getContext('2d')
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high'
  context.fillStyle=context.createPattern(tiles[0],'repeat');context.fillRect(0,0,size,size)
  const patchSize=256,seam=MATERIAL_QUILT_SEAM,step=MATERIAL_QUILT_STEP,overlap=patchSize-step,count=size/step,rawPatches=[],rawImages=[],patches=[]
  for(let row=0;row<count;row++)for(let column=0;column<count;column++){
    const index=row*count+column,source=tiles[0],patch=createSurface(patchSize,patchSize),patchContext=patch.getContext('2d')
    const sourceX=cellHash(seed+index*17,index*29)%source.width,sourceY=cellHash(index*31,seed-index*13)%source.height
    drawWrapped(patchContext,source,sourceX,sourceY)
    rawPatches.push(patch);rawImages.push(patchContext.getImageData(0,0,patchSize,patchSize))
  }
  for(let row=0;row<count;row++)for(let column=0;column<count;column++){
    const index=row*count+column,leftIndex=row*count+modulo(column-1,count),topIndex=modulo(row-1,count)*count+column
    const patch=createSurface(patchSize,patchSize),patchContext=patch.getContext('2d');patchContext.drawImage(rawPatches[index],0,0)
    const leftSeam=verticalQuiltSeam(rawImages[leftIndex],rawImages[index],patchSize,step,overlap),topSeam=horizontalQuiltSeam(rawImages[topIndex],rawImages[index],patchSize,step,overlap)
    patchContext.globalCompositeOperation='destination-in'
    patchContext.drawImage(quiltMask(patchSize,leftSeam,topSeam),0,0)
    patches.push(patch)
  }
  for(let row=-1;row<=count;row++)for(let column=-1;column<=count;column++)context.drawImage(patches[modulo(row,count)*count+modulo(column,count)],column*step-seam,row*step-seam)
  context.globalAlpha=1
  return texture
}

async function loadAssets() {
  if (!assetPromise) {
    const dedicatedEntries=Object.entries(DEDICATED_MATERIAL_URLS)
    assetPromise = Promise.all([...TERRAIN_VARIANT_URLS, DETAIL_URL, MATERIAL_GRAIN_URL,...dedicatedEntries.map(([,url])=>url)].map(loadImage)).then((images) => {
    const variants = images.slice(0, 4).map((image) => TERRAIN.map((terrain) => {
      const tile = createSurface(256, 256), tileContext = tile.getContext('2d'), sourceWidth = image.naturalWidth / 4, sourceHeight = image.naturalHeight / 4
      tileContext.drawImage(image, (terrain.sprite % 4) * sourceWidth, Math.floor(terrain.sprite / 4) * sourceHeight, sourceWidth, sourceHeight, 0, 0, 256, 256)
      return tile
    }))
    return {variants,materials:new Map(),detail:images[4],grain:mirroredTexture(images[5],512),dedicated:new Map(dedicatedEntries.map(([id],index)=>[id,images[6+index]]))}
  })
  }
  return assetPromise
}

function terrainMaterial(assets,terrain){if(assets.dedicated.has(terrain.id))return assets.dedicated.get(terrain.id);if(!assets.materials.has(terrain.id))assets.materials.set(terrain.id,materialTexture(assets.variants.map((set)=>set[terrain.sprite]),terrain.sprite*101+17));return assets.materials.get(terrain.id)}

export async function loadTerrainMaterialSources(ids=TERRAIN.map((terrain)=>terrain.id)){
  const assets=await loadAssets()
  const requested=new Set(ids)
  return Object.fromEntries(TERRAIN.filter((terrain)=>requested.has(terrain.id)).map((terrain)=>[terrain.id,terrainMaterial(assets,terrain)]))
}

function prepareCell(cell) {
  const profile = EDGE_PROFILES[cell.edge] || EDGE_PROFILES.natural, seed = cellHash(cell.x, cell.y)
  if (cell.edge === 'crisp') return { ...cell, profile, centerX: cell.x + .5, centerY: cell.y + .5, stretchX: 1, stretchY: 1, phase: 0 }
  const jitterX = ((cellHash(cell.x + 17, cell.y - 5) % 100) / 100 - .5) * .18
  const jitterY = ((cellHash(cell.x - 9, cell.y + 13) % 100) / 100 - .5) * .18
  const stretchX = .94 + (cellHash(cell.x + 3, cell.y + 7) % 100) / 100 * .12
  return { ...cell, profile, centerX: cell.x + .5 + jitterX, centerY: cell.y + .5 + jitterY, stretchX, stretchY: 2 - stretchX, phase: (seed % 6283) / 1000 }
}

function preparedCellInfluence(cell, worldX, worldY) {
  const dx = worldX - cell.centerX, dy = worldY - cell.centerY
  if (cell.edge === 'crisp') {
    const distance = Math.max(Math.abs(dx), Math.abs(dy))
    return 1 - smoothstep(cell.profile.inner, cell.profile.outer, distance)
  }
  const angle = Math.atan2(dy, dx)
  const ripple = Math.sin(angle * 3 + cell.phase) * .56 + Math.sin(angle * 5 - cell.phase * 1.7) * .29 + Math.sin(angle * 2 + cell.phase * 2.3) * .15
  const boundaryScale = 1 + ripple * cell.profile.noise
  const distance = Math.hypot(dx / cell.stretchX, dy / cell.stretchY)
  return 1 - smoothstep(cell.profile.inner * boundaryScale, cell.profile.outer * boundaryScale, distance)
}

function buildTerrainFields(cells, { originX, originY, widthCells, heightCells, samplesPerCell = FIELD_SAMPLES_PER_CELL }) {
  const width = Math.max(1, Math.ceil(widthCells * samplesPerCell)), height = Math.max(1, Math.ceil(heightCells * samplesPerCell)), length = width * height
  const terrainIds = TERRAIN.map((terrain) => terrain.id).filter((id) => cells.some((cell) => cell.terrain === id))
  const fields = new Map(terrainIds.map((id) => [id, new Float32Array(length)])), crispOccupancy = new Float32Array(length), organicOccupancy = new Float32Array(length)

  for (const source of cells) {
    const cell = prepareCell(source), field = fields.get(cell.terrain)
    if (!field) continue
    const reach = cell.profile.outer * (1 + cell.profile.noise) * Math.max(cell.stretchX, cell.stretchY)
    const minimumX = Math.max(0, Math.floor((cell.centerX - reach - originX) * samplesPerCell))
    const maximumX = Math.min(width - 1, Math.ceil((cell.centerX + reach - originX) * samplesPerCell))
    const minimumY = Math.max(0, Math.floor((cell.centerY - reach - originY) * samplesPerCell))
    const maximumY = Math.min(height - 1, Math.ceil((cell.centerY + reach - originY) * samplesPerCell))
    for (let sampleY = minimumY; sampleY <= maximumY; sampleY++) for (let sampleX = minimumX; sampleX <= maximumX; sampleX++) {
      const index = sampleY * width + sampleX
      const influence = preparedCellInfluence(cell, originX + (sampleX + .5) / samplesPerCell, originY + (sampleY + .5) / samplesPerCell)
      if (influence <= 0) continue
      const occupancy=cell.edge==='crisp'?crispOccupancy:organicOccupancy
      occupancy[index] = Math.max(occupancy[index], influence)
      field[index] = Math.max(field[index], influence * cell.profile.strength)
    }
  }

  const smoothedOrganic=blurField(organicOccupancy,width,height,Math.max(1,Math.round(samplesPerCell*.25)))
  const alphas = new Map(terrainIds.map((id) => [id, new Uint8ClampedArray(length)])), occupancyAlpha = new Uint8ClampedArray(length)
  for (let index = 0; index < length; index++) {
    const alpha = smoothstep(.025, .72, Math.max(crispOccupancy[index],smoothedOrganic[index]))
    occupancyAlpha[index] = Math.round(alpha * 255)
    if (!alpha) continue
    const sampleX=index%width,sampleY=Math.floor(index/width),weights=normalizeMaterialWeights([...fields].map(([id,field])=>[id,field[index]]),originX+(sampleX+.5)/samplesPerCell,originY+(sampleY+.5)/samplesPerCell)
    for (const [id, weight] of weights) alphas.get(id)[index] = Math.round(alpha * weight * 255)
  }
  return { width, height, terrainIds, alphas, occupancyAlpha }
}

function blurField(source,width,height,radius){if(!radius)return source;const horizontal=new Float32Array(source.length),result=new Float32Array(source.length);for(let y=0;y<height;y++){let sum=0;for(let x=-radius;x<=radius;x++)sum+=source[y*width+Math.max(0,Math.min(width-1,x))];for(let x=0;x<width;x++){horizontal[y*width+x]=sum/(radius*2+1);sum-=source[y*width+Math.max(0,x-radius)];sum+=source[y*width+Math.min(width-1,x+radius+1)]}}for(let x=0;x<width;x++){let sum=0;for(let y=-radius;y<=radius;y++)sum+=horizontal[Math.max(0,Math.min(height-1,y))*width+x];for(let y=0;y<height;y++){result[y*width+x]=sum/(radius*2+1);sum-=horizontal[Math.max(0,y-radius)*width+x];sum+=horizontal[Math.min(height-1,y+radius+1)*width+x]}}return result}

function alphaSurface(width, height, alpha) {
  const surface = createSurface(width, height), context = surface.getContext('2d'), image = context.createImageData(width, height)
  for (let index = 0; index < alpha.length; index++) image.data[index * 4 + 3] = alpha[index]
  context.putImageData(image, 0, 0)
  return surface
}

function terrainPattern(context, texture, originX, originY, cellSize,periodCells=14,offsetX=0,offsetY=0) {
  const pattern = context.createPattern(texture, 'repeat'), period = cellSize * periodCells, scale = period / texture.width
  if (pattern?.setTransform && globalThis.DOMMatrix) {
    const phaseX = modulo(originX * cellSize+offsetX*cellSize, period), phaseY = modulo(originY * cellSize+offsetY*cellSize, period)
    pattern.setTransform(new DOMMatrix().translate(-phaseX, -phaseY).scale(scale))
  }
  return pattern
}

function paintMaterial(layerContext, assets, terrain, cells, originX, originY, cellSize, width, height) {
  layerContext.globalCompositeOperation = 'source-over'
  layerContext.globalAlpha = 1
  layerContext.fillStyle = terrainPattern(layerContext,terrainMaterial(assets,terrain),originX,originY,cellSize,terrain.texturePeriod,terrain.sprite*7.3,terrain.sprite*11.1)
  layerContext.fillRect(0, 0, width, height)
  layerContext.globalCompositeOperation='soft-light'
  layerContext.globalAlpha=.14
  layerContext.fillStyle=terrainPattern(layerContext,assets.grain,originX,originY,cellSize,17.5,5.25,8.75)
  layerContext.fillRect(0,0,width,height)
  layerContext.globalCompositeOperation='source-over'
  layerContext.globalAlpha = 1
}

function drawDetail(context, image, sprite, x, y, size) {
  const sourceWidth = image.naturalWidth / 4, sourceHeight = image.naturalHeight / 4
  context.drawImage(image, (sprite % 4) * sourceWidth, Math.floor(sprite / 4) * sourceHeight, sourceWidth, sourceHeight, x, y, size, size)
}

function sampleTerrainBlend(cells, worldX, worldY) {
  const weights = {}
  let occupancy = 0
  for (const source of cells) {
    const cell = prepareCell(source), influence = preparedCellInfluence(cell, worldX, worldY)
    if (influence <= 0) continue
    occupancy = Math.max(occupancy, influence)
    weights[cell.terrain] = Math.max(weights[cell.terrain] || 0, influence * cell.profile.strength)
  }
  const normalized=normalizeMaterialWeights(Object.entries(weights),worldX,worldY),alpha = smoothstep(.025, .72, occupancy)
  for (const id of Object.keys(weights)) weights[id] = normalized.get(id)||0
  return { alpha, weights }
}

export async function renderTerrainRegion(context, { cells, originX, originY, cellSize, clearWidth, clearHeight, drawDetails = true, clear = true, samplesPerCell = FIELD_SAMPLES_PER_CELL }) {
  const assets = await loadAssets()
  if (clear) context.clearRect(0, 0, clearWidth, clearHeight)
  if (!cells.length) return

  const width = Math.max(1, Math.round(clearWidth)), height = Math.max(1, Math.round(clearHeight))
  const widthCells = clearWidth / cellSize, heightCells = clearHeight / cellSize
  const fields = buildTerrainFields(cells, { originX, originY, widthCells, heightCells, samplesPerCell })
  const composition = createSurface(width, height), compositionContext = composition.getContext('2d')
  const layer = createSurface(width, height), layerContext = layer.getContext('2d')
  compositionContext.imageSmoothingEnabled = true
  compositionContext.imageSmoothingQuality = 'high'
  compositionContext.globalCompositeOperation = 'lighter'

  for (const terrain of TERRAIN) {
    if (!fields.alphas.has(terrain.id)) continue
    layerContext.clearRect(0, 0, width, height)
    paintMaterial(layerContext, assets, terrain, cells, originX, originY, cellSize, width, height)
    layerContext.globalCompositeOperation = 'destination-in'
    layerContext.imageSmoothingEnabled = true
    layerContext.imageSmoothingQuality = 'high'
    layerContext.drawImage(alphaSurface(fields.width, fields.height, fields.alphas.get(terrain.id)), 0, 0, width, height)
    compositionContext.drawImage(layer, 0, 0)
  }

  compositionContext.globalCompositeOperation = 'source-over'
  if (drawDetails) for (const cell of cells) {
    const sprite = terrainDetailSprite(cell)
    if (sprite === null) continue
    const detailScale=.78+(cellHash(cell.x+5,cell.y-3)%23)/100,size=cellSize*detailScale,x=(cell.x-originX)*cellSize+(cellSize-size)/2,y=(cell.y-originY)*cellSize+(cellSize-size)/2
    compositionContext.save()
    compositionContext.globalAlpha = .24
    compositionContext.filter='saturate(.68) contrast(.92)'
    compositionContext.translate(x + size / 2, y + size / 2)
    compositionContext.rotate((cellHash(cell.x, cell.y) % 4) * Math.PI / 2)
    drawDetail(compositionContext, assets.detail, sprite, -size / 2, -size / 2, size)
    compositionContext.restore()
  }

  compositionContext.globalCompositeOperation = 'destination-in'
  compositionContext.drawImage(alphaSurface(fields.width, fields.height, fields.occupancyAlpha), 0, 0, width, height)
  compositionContext.globalCompositeOperation = 'source-over'
  context.save()
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(composition, 0, 0, clearWidth, clearHeight)
  context.restore()
}

export const terrainRendererTestApi = { EDGE_PROFILES, FIELD_SAMPLES_PER_CELL, MATERIAL_QUILT_SEAM, MATERIAL_QUILT_STEP, MATERIAL_TEXTURE_SIZE, blurField, buildTerrainFields, minimumCostSeam, normalizeMaterialWeights, sampleTerrainBlend }
