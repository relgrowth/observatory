export const SCHEMA_VERSION = 2
export const CHUNK_SIZE = 32
export const LIMITS = { projects: 50, width: 96, height: 96, objects: 1000, labels: 250, title: 200 }
export const uuid = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()

export const TERRAIN = [
  ['stone', 'Worn stone', 0], ['dungeon', 'Dungeon stone', 1], ['grass', 'Grass', 2], ['dark-grass', 'Dark grass', 3],
  ['earth', 'Packed earth', 4], ['sand', 'Sand', 5], ['shallow-water', 'Shallow water', 6], ['deep-water', 'Deep water', 7],
  ['cobble', 'Cobblestone', 8], ['mud', 'Mud', 9], ['snow', 'Snow', 10], ['volcanic', 'Volcanic rock', 11],
  ['wood', 'Wooden planks', 12], ['moss-stone', 'Mossy stone', 13], ['farmland', 'Farmland', 14], ['scree', 'Mountain scree', 15],
].map(([id, label, sprite]) => ({ id, label, sprite }))

export const OBJECTS = [
  ['door', 'Door', 0], ['stairs', 'Stairs', 1], ['chest', 'Treasure chest', 2], ['table', 'Table', 3],
  ['bed', 'Bed', 4], ['barrels', 'Barrels', 5], ['campfire', 'Campfire', 6], ['tree', 'Leafy tree', 7],
  ['pine', 'Pine tree', 8], ['boulder', 'Boulder', 9], ['bridge', 'Bridge', 10], ['cottage', 'Cottage', 11],
  ['tower', 'Stone tower', 12], ['well', 'Well', 13], ['ship', 'Ship', 14], ['ruin', 'Ruined statue', 15],
].map(([id, label, sprite]) => ({ id, label, sprite }))

export const TOOLS = [
  { id: 'terrain', label: 'Paint terrain' }, { id: 'room', label: 'Draw room' }, { id: 'wall', label: 'Draw wall' },
  { id: 'object', label: 'Place object' }, { id: 'label', label: 'Add label' }, { id: 'erase', label: 'Erase' },
]

export function createProject(input = {}) {
  const createdAt = nowIso()
  return { id: uuid(), schemaVersion: SCHEMA_VERSION, title: String(input.title || 'Untitled map').slice(0, 200), description: String(input.description || ''), mapType: input.mapType || 'dungeon', gridType: input.gridType || 'square', width: Math.min(LIMITS.width, Math.max(8, Number(input.width) || 28)), height: Math.min(LIMITS.height, Math.max(8, Number(input.height) || 20)), cellSize: 40, revision: 1, thumbnail: null, archivedAt: null, deletedAt: null, createdAt, updatedAt: createdAt }
}

export function createEmptyBundle(input = {}) {
  const project = createProject(input)
  const layers = [
    { id: uuid(), projectId: project.id, kind: 'terrain', name: 'Terrain', visible: true, locked: false, order: 0 },
    { id: uuid(), projectId: project.id, kind: 'structure', name: 'Structures', visible: true, locked: false, order: 1 },
    { id: uuid(), projectId: project.id, kind: 'objects', name: 'Objects', visible: true, locked: false, order: 2 },
    { id: uuid(), projectId: project.id, kind: 'labels', name: 'Labels', visible: true, locked: false, order: 3 },
  ]
  const cells = Array(project.width * project.height).fill(input.baseTerrain || (project.mapType === 'dungeon' ? 'dungeon' : 'grass'))
  return { project, layers, chunks: [{ id: `${project.id}:terrain:0:0`, projectId: project.id, layerId: layers[0].id, x: 0, y: 0, width: project.width, height: project.height, cells }], structures: [], objects: [], labels: [] }
}
