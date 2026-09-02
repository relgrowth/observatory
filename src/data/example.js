import { createEmptyBundle, nowIso, uuid } from '../constants.js'

export const EXAMPLE_VERSION = 4
export const EXAMPLE_PROJECT_TITLE = 'The Sunken Watch'

export function createExampleBundle() {
  const bundle = createEmptyBundle({ title: EXAMPLE_PROJECT_TITLE, description: 'A ruined riverside watchtower, its flooded crypt, and the village road that once protected it.', mapType: 'dungeon', width: 30, height: 22, baseTerrain: 'dark-grass' })
  const { project } = bundle
  const cells = bundle.chunks[0].cells
  const paint = (x, y, width, height, terrain) => { for (let row = y; row < y + height; row++) for (let col = x; col < x + width; col++) if (col >= 0 && row >= 0 && col < project.width && row < project.height) cells[row * project.width + col] = terrain }
  paint(2, 9, 26, 3, 'earth'); paint(9, 4, 13, 13, 'dungeon'); paint(10, 5, 5, 5, 'stone'); paint(16, 5, 5, 5, 'stone'); paint(12, 11, 7, 5, 'shallow-water'); paint(0, 18, 30, 4, 'deep-water'); paint(3, 2, 5, 4, 'moss-stone')
  const structureLayer = bundle.layers.find((layer) => layer.kind === 'structure')
  for (let x = 9; x <= 21; x++) for (const y of [4, 16]) bundle.structures.push({ id: uuid(), projectId: project.id, layerId: structureLayer.id, kind: 'wall', x, y, createdAt: nowIso() })
  for (let y = 5; y < 16; y++) for (const x of [9, 21]) bundle.structures.push({ id: uuid(), projectId: project.id, layerId: structureLayer.id, kind: 'wall', x, y, createdAt: nowIso() })
  const objectLayer = bundle.layers.find((layer) => layer.kind === 'objects')
  const add = (assetId, x, y, rotation = 0, scale = 1) => bundle.objects.push({ id: uuid(), projectId: project.id, layerId: objectLayer.id, assetId, x, y, rotation, scale, hidden: false, createdAt: nowIso(), updatedAt: nowIso() })
  add('door', 15, 4); add('stairs', 18, 7); add('chest', 12, 7); add('ruin', 6, 4); add('bridge', 24, 18); add('tree', 4, 14); add('pine', 25, 5); add('well', 5, 10)
  const labelLayer = bundle.layers.find((layer) => layer.kind === 'labels')
  bundle.labels.push({ id: uuid(), projectId: project.id, layerId: labelLayer.id, text: 'The Sunken Watch', x: 15, y: 2, size: 'large', hidden: false, createdAt: nowIso(), updatedAt: nowIso() })
  bundle.labels.push({ id: uuid(), projectId: project.id, layerId: labelLayer.id, text: 'Flooded crypt', x: 15, y: 13, size: 'small', hidden: true, createdAt: nowIso(), updatedAt: nowIso() })
  return bundle
}
