import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { webMcpTestApi } from '../../src/services/webMcp.js'
import { webMcpActivity } from '../../src/services/webMcpState.js'

const projectId = '11111111-1111-4111-8111-111111111111'
const operationId = '22222222-2222-4222-8222-222222222222'
const objectId = '33333333-3333-4333-8333-333333333333'
const shapeId = '44444444-4444-4444-8444-444444444444'
const lineId = '55555555-5555-4555-8555-555555555555'
const labelId = '66666666-6666-4666-8666-666666666666'

function fakeStore() {
  const store = {
    bundle: {
      project: { id: projectId, title: 'Test', description: 'A test map', mapType: 'dungeon', schemaVersion: 5, revision: 3 },
      layers: [
        { id: 'terrain-layer', kind: 'terrain', name: 'Terrain', visible: true, locked: false, order: 0 },
        { id: 'structure-layer', kind: 'structure', name: 'Structures', visible: true, locked: false, order: 1 },
        { id: 'object-layer', kind: 'objects', name: 'Objects', visible: true, locked: false, order: 2 },
        { id: 'label-layer', kind: 'labels', name: 'Labels', visible: true, locked: false, order: 3 },
      ],
      chunks: [], terrainStyles: [], terrainStrokes: [],
      structures: [
        { id: shapeId, kind: 'room', shape: 'rectangle', x: 1, y: 2, width: 4, height: 3, rotation: 0, sides: 6, innerRatio: .48, floorTerrain: 'stone', lineStyle: 'stone-wall', wallTerrain: 'dungeon', wallWidth: .52, points: [], zIndex: 1, deletedAt: null },
        { id: lineId, kind: 'wall-path', points: [{ x: 0, y: 0 }, { x: 4, y: 1 }], lineStyle: 'hedge', wallTerrain: 'dark-grass', wallWidth: .64, zIndex: 2, deletedAt: null },
      ],
      objects: [{ id: objectId, assetId: 'chest', x: 2, y: 3, rotation: 0, scale: 1, zIndex: 1, deletedAt: null }],
      labels: [{ id: labelId, text: 'Keep', x: 1, y: 1, boxWidth: 5, boxHeight: 2, rotation: 0, fontSize: 1, size: 'medium', font: 'cinzel', color: '#aabbcc', bold: true, deletedAt: null }],
    },
    terrain: [], terrainStrokes: [],
    contentBounds: { minX: -6, minY: -4, maxX: 6, maxY: 4, width: 13, height: 9 },
    selection: null, activeTool: 'select', selectedLineStyle: 'stone-wall', undoStack: [{}], redoStack: [],
    paintRegions: vi.fn(async () => {}),
    paintStrokes: vi.fn(async (items) => items.map((item, index) => ({ id: `stroke-${index}`, ...item }))),
    createRooms: vi.fn(async (items) => items.map((item, index) => ({ id: `shape-${index}`, shape: item.shape || 'rectangle', ...item }))),
    drawWallPaths: vi.fn(async (items) => items.map((item, index) => ({ id: `line-${index}`, ...item }))),
    placeObjects: vi.fn(async (items) => items.map((item, index) => ({ id: `object-${index}`, ...item }))),
    addLabels: vi.fn(async (items) => items.map((item, index) => ({ id: `label-${index}`, ...item }))),
    undo: vi.fn(async () => { store.undoStack.pop(); store.redoStack.push({}); store.bundle.project.revision += 1 }),
    redo: vi.fn(async () => { store.redoStack.pop(); store.undoStack.push({}); store.bundle.project.revision += 1 }),
  }
  store.visibleObjects = store.bundle.objects
  store.visibleLabels = store.bundle.labels
  store.commit = vi.fn(async (fn) => { await fn(store.bundle); store.bundle.project.revision += 1 })
  return store
}

describe('Observatory WebMCP', () => {
  beforeEach(() => {
    webMcpTestApi.operations.clear()
    webMcpTestApi.previews.clear()
    webMcpActivity.value = { visible: false, status: 'idle', title: '', message: '' }
  })

  it('discovers and disposes a fake-browser scope', async () => {
    const registered = []
    Object.defineProperty(document, 'modelContext', { value: { registerTool: vi.fn(async (entry) => registered.push(entry.name)) }, configurable: true })
    const dispose = webMcpTestApi.registerScope('test-scope', [{ name: 'test_tool', title: 'Test', description: 'Test', inputSchema: { type: 'object', additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async () => ({ status: 'ok' }) }])
    await new Promise((resolve) => setTimeout(resolve))
    expect(registered).toEqual(['test_tool'])
    dispose()
    expect(webMcpTestApi.supported()).toBe(true)
    delete document.modelContext
  })

  it('exposes one stable project tool set regardless of the selected drawing tool', () => {
    const store = fakeStore()
    const first = webMcpTestApi.projectTools(store).map(({ name }) => name)
    store.activeTool = 'label'
    const second = webMcpTestApi.projectTools(store).map(({ name }) => name)
    expect(first).toEqual(webMcpTestApi.PROJECT_TOOL_NAMES)
    expect(second).toEqual(first)
    expect(first).toEqual(expect.arrayContaining(['create_map_shapes', 'draw_map_lines', 'add_map_labels', 'update_map_elements', 'set_map_layer_visibility']))
  })

  it('coaches agents toward natural terrain without restricting valid styles', async () => {
    const capabilities = webMcpTestApi.libraryTools({ projects: [] }).find(({ name }) => name === 'get_observatory_capabilities')
    const response = await webMcpTestApi.runTool(capabilities, {})
    expect(response.data.visual_guidance.natural_terrain).toContain('65-100 softness')
    const tools = webMcpTestApi.projectTools(fakeStore()),strokes = tools.find(({ name }) => name === 'paint_map_strokes'),regions = tools.find(({ name }) => name === 'paint_map_regions')
    expect(strokes.description).toContain('overlap offset strokes')
    expect(strokes.inputSchema.properties.strokes.items.properties.softness).toMatchObject({ minimum: 0, maximum: 100, default: 100 })
    expect(strokes.inputSchema.properties.strokes.items.properties.softness.description).toContain('coastlines')
    expect(regions.description).toContain('intentionally blocky')
    expect(tools.find(({ name }) => name === 'draw_map_lines').description).toContain('instead of tracing every terrain boundary')
  })

  it('rejects additional input and stale revisions', async () => {
    const store = fakeStore(), entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'paint_map_regions')
    const invalid = await webMcpTestApi.runTool(entry, { operation_id: operationId, expected_revision: 3, regions: [{ terrain: 'stone', cells: [{ x: 1, y: 1 }] }], extra: true })
    expect(invalid.error_code).toBe('invalid_input')
    const stale = await webMcpTestApi.runTool(entry, { operation_id: operationId, expected_revision: 2, regions: [{ terrain: 'stone', cells: [{ x: 1, y: 1 }] }] })
    expect(stale.error_code).toBe('version_conflict')
  })

  it('paints mixed terrain regions in one durable operation', async () => {
    const store = fakeStore(), entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'paint_map_regions')
    const regions = [{ terrain: 'shallow-water', edge: 'wild', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }, { terrain: 'sand', cells: [{ x: 2, y: 0 }] }]
    const response = await webMcpTestApi.runTool(entry, { operation_id: operationId, expected_revision: 3, regions })
    expect(response.status).toBe('ok')
    expect(response.data).toMatchObject({ regions: 2, cells: 3 })
    expect(store.paintRegions).toHaveBeenCalledWith(regions)
  })

  it('keeps terrain erase separate from semantic element removal', async () => {
    const store = fakeStore(), entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'erase_map_terrain')
    const response = await webMcpTestApi.runTool(entry, { operation_id: operationId, expected_revision: 3, strokes: [{ radius: 2, softness: 25, points: [{ x: 0, y: 0 }, { x: 4, y: 1 }] }] })
    expect(response.status).toBe('ok')
    expect(store.paintStrokes).toHaveBeenCalledWith([{ radius: 2, softness: .25, points: [{ x: 0, y: 0 }, { x: 4, y: 1 }], terrain: null, mode: 'erase', discrete: false }])
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('creates styled shapes, lines, objects, and text boxes with canonical fields', async () => {
    const store = fakeStore(), tools = webMcpTestApi.projectTools(store)
    await webMcpTestApi.runTool(tools.find(({ name }) => name === 'create_map_shapes'), { operation_id: operationId, expected_revision: 3, shapes: [{ x: 1, y: 2, width: 6, height: 4, shape: 'star', inner_ratio: .3, floor_terrain: 'wood', line_style: 'hedge' }] })
    expect(store.createRooms.mock.calls[0][0][0]).toMatchObject({ shape: 'star', terrain: 'wood', innerRatio: .3, lineStyle: 'hedge', wallTerrain: 'dark-grass', wallWidth: .64 })

    webMcpTestApi.operations.clear()
    await webMcpTestApi.runTool(tools.find(({ name }) => name === 'draw_map_lines'), { operation_id: operationId, expected_revision: 3, lines: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], line_style: 'cliff' }] })
    expect(store.drawWallPaths.mock.calls[0][0][0]).toMatchObject({ lineStyle: 'cliff', wallTerrain: 'scree', wallWidth: .7 })

    webMcpTestApi.operations.clear()
    await webMcpTestApi.runTool(tools.find(({ name }) => name === 'place_map_objects'), { operation_id: operationId, expected_revision: 3, objects: [{ asset_id: 'door', x: 3, y: 4, z_index: 7 }] })
    expect(store.placeObjects.mock.calls[0][0][0]).toMatchObject({ assetId: 'door', zIndex: 7 })

    webMcpTestApi.operations.clear()
    await webMcpTestApi.runTool(tools.find(({ name }) => name === 'add_map_labels'), { operation_id: operationId, expected_revision: 3, labels: [{ text: 'The Reach', x: 5, y: 6, box_width: 8, box_height: 2, font_size: 1.4, font: 'cinzel', color: '#ABCDEF', bold: true }] })
    expect(store.addLabels.mock.calls[0][0][0]).toMatchObject({ boxWidth: 8, boxHeight: 2, fontSize: 1.4, font: 'cinzel', color: '#ABCDEF', bold: true })
  })

  it('replays exact retries and rejects operation IDs reused with different input', async () => {
    const store = fakeStore(), entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'place_map_objects')
    const input = { operation_id: operationId, expected_revision: 3, objects: [{ asset_id: 'chest', x: 2, y: 3 }] }
    const first = await webMcpTestApi.runTool(entry, input), replay = await webMcpTestApi.runTool(entry, input)
    const conflict = await webMcpTestApi.runTool(entry, { ...input, objects: [{ asset_id: 'chest', x: 9, y: 3 }] })
    expect(first.status).toBe('ok')
    expect(replay).toEqual(first)
    expect(conflict.error_code).toBe('operation_conflict')
    expect(store.placeObjects).toHaveBeenCalledTimes(1)
  })

  it('returns complete paged context for new element and style types', async () => {
    const store = fakeStore()
    store.bundle = reactive(store.bundle)
    const entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'get_map_context')
    const overview = await webMcpTestApi.runTool(entry, {})
    const shapes = await webMcpTestApi.runTool(entry, { detail: 'shapes', include_geometry: true })
    const lines = await webMcpTestApi.runTool(entry, { detail: 'lines', include_geometry: true })
    const labels = await webMcpTestApi.runTool(entry, { detail: 'labels' })
    expect(overview.data.counts).toMatchObject({ shapes: 1, lines: 1, objects: 1, labels: 1 })
    expect(shapes.data.shapes[0]).toMatchObject({ id: shapeId, line_style: 'stone-wall' })
    expect(lines.data.lines[0]).toMatchObject({ id: lineId, line_style: 'hedge', points: [{ x: 0, y: 0 }, { x: 4, y: 1 }] })
    expect(labels.data.labels[0]).toMatchObject({ id: labelId, font: 'cinzel', color: '#aabbcc', font_size: 1 })
    expect(() => structuredClone(lines)).not.toThrow()
    expect(webMcpActivity.value.visible).toBe(false)
  })

  it('publishes every current drawing and text style in a bounded catalog', async () => {
    const store = fakeStore(), entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'get_map_asset_catalog')
    for (const input of [{}, { kind: 'terrain' }, { kind: 'objects' }, { kind: 'line_styles' }, { kind: 'label_styles' }, { kind: 'shapes' }]) {
      const response = await webMcpTestApi.runTool(entry, input)
      expect(response.status).toBe('ok')
      expect(JSON.stringify(response).length).toBeLessThanOrEqual(webMcpTestApi.OUTPUT_LIMIT)
    }
  })

  it('updates mixed element types atomically and recomputes shape geometry', async () => {
    const store = fakeStore(), entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'update_map_elements')
    const response = await webMcpTestApi.runTool(entry, { operation_id: operationId, expected_revision: 3, updates: [{ kind: 'object', id: objectId, x: 8, scale: 2 }, { kind: 'shape', id: shapeId, shape: 'ellipse', width: 7 }, { kind: 'label', id: labelId, text: 'Changed', color: 'gold', font_size: 1.8 }] })
    expect(response.status).toBe('ok')
    expect(store.bundle.objects[0]).toMatchObject({ x: 8, scale: 2 })
    expect(store.bundle.structures[0]).toMatchObject({ shape: 'ellipse', width: 7 })
    expect(store.bundle.structures[0].points).toHaveLength(32)
    expect(store.bundle.labels[0]).toMatchObject({ text: 'Changed', color: 'gold', fontSize: 1.8 })
    expect(store.commit).toHaveBeenCalledTimes(1)
  })

  it('changes layer visibility and exposes recoverable history', async () => {
    const store = fakeStore(), tools = webMcpTestApi.projectTools(store)
    const layer = tools.find(({ name }) => name === 'set_map_layer_visibility')
    const response = await webMcpTestApi.runTool(layer, { operation_id: operationId, expected_revision: 3, layers: [{ kind: 'labels', visible: false }] })
    expect(response.status).toBe('ok')
    expect(store.bundle.layers.find(({ kind }) => kind === 'labels').visible).toBe(false)

    webMcpTestApi.operations.clear()
    const history = tools.find(({ name }) => name === 'change_map_history')
    const undone = await webMcpTestApi.runTool(history, { operation_id: operationId, expected_revision: 4, action: 'undo' })
    expect(undone.status).toBe('ok')
    expect(store.undo).toHaveBeenCalledOnce()
  })

  it('keeps whole-map deletion out of WebMCP and validates map-management actions', async () => {
    const manage = webMcpTestApi.libraryTools({ projects: [] }).find(({ name }) => name === 'manage_maps')
    expect(manage.inputSchema.properties.action.enum).not.toContain('delete')
    const response = await webMcpTestApi.runTool(manage, { operation_id: operationId, expected_revision: 1, action: 'rename' })
    expect(response.error_code).toBe('invalid_input')
  })

  it('binds known element removal to a human preview', async () => {
    const store = fakeStore(), entry = webMcpTestApi.projectTools(store).find(({ name }) => name === 'delete_map_elements')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const previewInput = { operation_id: operationId, expected_revision: 3, ids: [objectId], risk: { preview: true } }
    const preview = await webMcpTestApi.runTool(entry, previewInput)
    expect(preview.status).toBe('preview')
    const commit = await webMcpTestApi.runTool(entry, { ...previewInput, risk: { preview: false, preview_token: preview.data.preview_token } })
    expect(commit.status).toBe('ok')
    expect(store.bundle.objects[0].deletedAt).toBeTruthy()
    expect(store.commit).toHaveBeenCalledOnce()
  })
})
