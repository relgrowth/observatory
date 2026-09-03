export const SCHEMA_VERSION = 5
export const CHUNK_SIZE = 32
export const WORLD_COORDINATE_LIMIT = 4096
export const LIMITS = { projects: 50, terrainCells: 50000, objects: 1000, labels: 250, title: 200 }
export const uuid = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()

export const TERRAIN = [
  ['stone', 'Worn stone', 0,15], ['dungeon', 'Dungeon stone', 1,13], ['grass', 'Grass', 2,20], ['dark-grass', 'Dark grass', 3,15],
  ['earth', 'Packed earth', 4,23], ['sand', 'Sand', 5,23], ['shallow-water', 'Shallow water', 6,18], ['deep-water', 'Deep water', 7,22],
  ['cobble', 'Cobblestone', 8,18], ['mud', 'Mud', 9,23], ['snow', 'Snow', 10,22], ['volcanic', 'Volcanic rock', 11,17],
  ['wood', 'Wooden planks', 12,13], ['moss-stone', 'Mossy stone', 13,13], ['farmland', 'Farmland', 14,21], ['scree', 'Mountain scree', 15,18],
].map(([id, label, sprite, texturePeriod]) => ({ id, label, sprite, texturePeriod }))

export const OBJECTS = [
  ['door', 'Door', 0,1,1], ['stairs', 'Stairs', 1,2,2], ['chest', 'Treasure chest', 2,1,1], ['table', 'Table', 3,2,2],
  ['bed', 'Bed', 4,1,2], ['barrels', 'Barrels', 5,2,2], ['campfire', 'Campfire', 6,2,2], ['tree', 'Leafy tree', 7,3,3],
  ['pine', 'Pine tree', 8,3,3], ['boulder', 'Boulder', 9,2,2], ['bridge', 'Bridge', 10,2,3], ['cottage', 'Cottage', 11,3,3],
  ['tower', 'Stone tower', 12,3,3], ['well', 'Well', 13,2,2], ['ship', 'Ship', 14,3,4], ['ruin', 'Ruined statue', 15,2,3],
].map(([id, label, sprite, width, height]) => ({ id, label, sprite, width, height }))

export const LINE_STYLES = [
  { id: 'stone-wall', label: 'Stone wall', description: 'Solid masonry boundary', terrain: 'dungeon', width: .52, asset: '/assets/terrain/story-shack-line-stone.png' },
  { id: 'palisade', label: 'Palisade', description: 'Close-set sharpened timbers', terrain: 'wood', width: .58, asset: '/assets/terrain/story-shack-line-palisade.png' },
  { id: 'cliff', label: 'Cliff edge', description: 'Rugged raised escarpment', terrain: 'scree', width: .7, asset: '/assets/terrain/story-shack-line-cliff.png' },
  { id: 'hedge', label: 'Hedge', description: 'Dense natural boundary', terrain: 'dark-grass', width: .64, asset: '/assets/terrain/story-shack-line-hedge.png' },
]

export const LABEL_SIZES = [
  { id: 'small', label: 'Small', sceneSize: .45, exportSize: 18 },
  { id: 'medium', label: 'Medium', sceneSize: .65, exportSize: 26 },
  { id: 'large', label: 'Large', sceneSize: .95, exportSize: 38 },
]
export const LABEL_FONTS = [
  { id: 'sans', label: 'Open Sans', family: 'Open Sans' },
  { id: 'display', label: 'Amaranth', family: 'Amaranth' },
  { id: 'alegreya', label: 'Alegreya', family: 'Alegreya' },
  { id: 'cinzel', label: 'Cinzel', family: 'Cinzel' },
  { id: 'cormorant-garamond', label: 'Cormorant Garamond', family: 'Cormorant Garamond' },
  { id: 'im-fell-english', label: 'IM FELL English', family: 'IM Fell English' },
  { id: 'uncial-antiqua', label: 'Uncial Antiqua', family: 'Uncial Antiqua' },
  { id: 'serif', label: 'Classic', family: 'Georgia', legacy: true },
]
export const LABEL_COLORS = [
  { id: 'light', label: 'Parchment', value: '#fff8e9', stroke: '#171512' },
  { id: 'gold', label: 'Gold', value: '#e8c982', stroke: '#171512' },
  { id: 'ink', label: 'Ink', value: '#2d241d', stroke: '#f4ead8' },
]
export function resolveLabelColor(value){const preset=LABEL_COLORS.find(({id})=>id===value);if(preset)return preset;const color=/^#[0-9a-f]{6}$/i.test(value||'')?value:'#fff8e9',number=parseInt(color.slice(1),16),red=number>>16,green=number>>8&255,blue=number&255,luminance=.2126*red+.7152*green+.0722*blue;return{id:color,label:color,value:color,stroke:luminance>145?'#171512':'#f4ead8'}}

export const NATURAL_TERRAIN = new Set(['grass','dark-grass','earth','sand','shallow-water','deep-water','mud','snow','volcanic','moss-stone','farmland','scree'])
const DETAIL_SPRITES={grass:[0,1,5], 'dark-grass':[0,4],earth:[2,3],sand:[11], 'shallow-water':[6,7],cobble:[12],mud:[9],snow:[8],volcanic:[10], 'moss-stone':[4,12],farmland:[14],scree:[15]}
export const cellHash=(x,y)=>Math.abs(((x*73856093)^(y*19349663))|0)
export function terrainDetailSprite(cell){const choices=DETAIL_SPRITES[cell.terrain];if(!choices||cellHash(cell.x,cell.y)%31!==0)return null;return choices[cellHash(cell.x+11,cell.y-7)%choices.length]}
export function connectedWallSprite(structures,item){const coordinates=new Set(structures.filter((entry)=>!entry.deletedAt&&entry.kind==='wall').map((entry)=>`${entry.x}:${entry.y}`)),has=(x,y)=>coordinates.has(`${x}:${y}`),mask=(has(item.x,item.y-1)?1:0)|(has(item.x+1,item.y)?2:0)|(has(item.x,item.y+1)?4:0)|(has(item.x-1,item.y)?8:0);return({0:0,5:1,10:2,15:3,3:4,6:5,12:6,9:7,14:8,13:9,11:10,7:11,1:14,2:15,4:12,8:13})[mask]??0}
export function wallLineCells(from,to){let x=from.x,y=from.y,error=Math.abs(to.x-x)-Math.abs(to.y-y);const dx=Math.abs(to.x-x),dy=Math.abs(to.y-y),stepX=x<to.x?1:-1,stepY=y<to.y?1:-1,cells=[{x,y}];while(x!==to.x||y!==to.y){const twice=2*error;if(twice>-dy&&x!==to.x){error-=dy;x+=stepX;cells.push({x,y})}if(twice<dx&&y!==to.y){error+=dx;y+=stepY;cells.push({x,y})}}return cells}

export const TOOLS = [
  { id: 'select', label: 'Select' }, { id: 'eyedropper', label: 'Pick from map' }, { id: 'terrain', label: 'Paint terrain' }, { id: 'room', label: 'Draw shape' }, { id: 'wall', label: 'Draw lines' },
  { id: 'object', label: 'Place object' }, { id: 'label', label: 'Add label' }, { id: 'erase', label: 'Erase' },
]

export function createProject(input = {}) {
  const createdAt = nowIso()
  return { id: uuid(), schemaVersion: SCHEMA_VERSION, title: String(input.title || 'Untitled map').slice(0, 200), description: String(input.description || ''), mapType: input.mapType || 'dungeon', gridType: input.gridType || 'square', cellSize: 40, revision: 1, thumbnail: null, archivedAt: null, deletedAt: null, createdAt, updatedAt: createdAt }
}

export function createEmptyBundle(input = {}) {
  const project = createProject(input)
  const layers = [
    { id: uuid(), projectId: project.id, kind: 'terrain', name: 'Terrain', visible: true, locked: false, order: 0 },
    { id: uuid(), projectId: project.id, kind: 'structure', name: 'Structures', visible: true, locked: false, order: 1 },
    { id: uuid(), projectId: project.id, kind: 'objects', name: 'Objects', visible: true, locked: false, order: 2 },
    { id: uuid(), projectId: project.id, kind: 'labels', name: 'Labels', visible: true, locked: false, order: 3 },
  ]
  return { project, layers, chunks: [], terrainStyles: [], terrainStrokes: [], structures: [], objects: [], labels: [] }
}

const floorDiv = (value) => Math.floor(value / CHUNK_SIZE)
const local = (value) => ((value % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
const cellKey = (x, y) => `${local(x)}:${local(y)}`

export function terrainEntries(bundle) {
  const entries = []
  for (const chunk of bundle?.chunks || []) {
    if (Array.isArray(chunk.cells)) {
      const width = chunk.width || bundle.project.width || CHUNK_SIZE
      chunk.cells.forEach((terrain, index) => { if (terrain) entries.push({ x: (chunk.x || 0) + index % width, y: (chunk.y || 0) + Math.floor(index / width), terrain }) })
    } else for (const [key, terrain] of Object.entries(chunk.cells || {})) {
      const [x, y] = key.split(':').map(Number)
      entries.push({ x: chunk.x * CHUNK_SIZE + x, y: chunk.y * CHUNK_SIZE + y, terrain })
    }
  }
  return entries
}

export function setTerrainCell(bundle, x, y, terrain) {
  const layerId = bundle.layers.find((layer) => layer.kind === 'terrain').id
  const chunkX = floorDiv(x), chunkY = floorDiv(y), id = `${bundle.project.id}:terrain:${chunkX}:${chunkY}`
  let chunk = bundle.chunks.find((item) => item.id === id)
  if (!chunk) { chunk = { id, projectId: bundle.project.id, layerId, x: chunkX, y: chunkY, cells: {} }; bundle.chunks.push(chunk) }
  if (!terrain) { delete chunk.cells[cellKey(x, y)]; setTerrainStyle(bundle,x,y,'natural') } else chunk.cells[cellKey(x, y)] = terrain
  if (!Object.keys(chunk.cells).length) bundle.chunks = bundle.chunks.filter((item) => item !== chunk)
}

export function setTerrainStyle(bundle,x,y,edge='natural') {
  bundle.terrainStyles ||= []
  const index=bundle.terrainStyles.findIndex((item)=>item.x===x&&item.y===y)
  if(edge==='natural'){if(index>=0)bundle.terrainStyles.splice(index,1);return}
  const style={id:`${bundle.project.id}:terrain-style:${x}:${y}`,projectId:bundle.project.id,x,y,edge}
  if(index>=0)bundle.terrainStyles[index]=style;else bundle.terrainStyles.push(style)
}

export function terrainStyleAt(bundle,x,y){return bundle?.terrainStyles?.find((item)=>item.x===x&&item.y===y)?.edge||'natural'}
export function terrainRenderEntries(bundle){const styles=new Map((bundle?.terrainStyles||[]).map((item)=>[`${item.x}:${item.y}`,item.edge]));return terrainEntries(bundle).map((cell)=>({...cell,edge:styles.get(`${cell.x}:${cell.y}`)||'natural'}))}

export function terrainAt(bundle, x, y) {
  const chunk = bundle?.chunks.find((item) => item.x === floorDiv(x) && item.y === floorDiv(y) && !Array.isArray(item.cells))
  return chunk?.cells?.[cellKey(x, y)] || null
}

export function migrateBundleToSparse(bundle) {
  if (!bundle || bundle.project.schemaVersion >= SCHEMA_VERSION) return bundle
  const entries = terrainEntries(bundle)
  bundle.chunks = []
  if(!Array.isArray(bundle.terrainStyles))bundle.terrainStyles=Object.entries(bundle.terrainStyles||{}).map(([coordinates,style])=>{const[x,y]=coordinates.split(':').map(Number);return{id:`${bundle.project.id}:terrain-style:${x}:${y}`,projectId:bundle.project.id,x,y,edge:style.edge||'natural'}})
  bundle.project.schemaVersion = SCHEMA_VERSION
  delete bundle.project.width
  delete bundle.project.height
  for (const { x, y, terrain } of entries) setTerrainCell(bundle, x, y, terrain)
  if(!Array.isArray(bundle.terrainStrokes))bundle.terrainStrokes=[]
  return bundle
}

export function getContentBounds(bundle, padding = 0) {
  const objectPoints=(bundle?.objects||[]).filter((item)=>!item.deletedAt).flatMap((item)=>{const asset=OBJECTS.find((entry)=>entry.id===item.assetId),size=Math.max(asset?.width||1,asset?.height||1)*(item.scale||1),radius=(size-1)/2;return[{x:item.x-radius,y:item.y-radius},{x:item.x+radius,y:item.y+radius}]})
  const structurePoints=(bundle?.structures||[]).filter((item)=>!item.deletedAt).flatMap((item)=>item.points?.length?item.points:[item])
  const points = [
    ...terrainEntries(bundle),
    ...(bundle?.terrainStrokes||[]).filter((item)=>!item.deletedAt).flatMap((item)=>item.bounds?[{x:item.bounds.minX,y:item.bounds.minY},{x:item.bounds.maxX,y:item.bounds.maxY}]:(item.points||[])),
    ...structurePoints,
    ...objectPoints,
    ...(bundle?.labels || []).filter((item) => !item.deletedAt).flatMap((item)=>item.boxWidth?[item,{x:item.x+item.boxWidth,y:item.y+(item.boxHeight||1)}]:[item]),
  ]
  if (!points.length) return { minX: -6, minY: -4, maxX: 6, maxY: 4, width: 13, height: 9 }
  const minX = Math.floor(Math.min(...points.map((item) => item.x))) - padding, minY = Math.floor(Math.min(...points.map((item) => item.y))) - padding
  const maxX = Math.ceil(Math.max(...points.map((item) => item.x))) + padding, maxY = Math.ceil(Math.max(...points.map((item) => item.y))) + padding
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }
}
