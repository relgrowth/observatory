import { describe, expect, it } from 'vitest'
import { connectedWallSprite, createEmptyBundle, getContentBounds, migrateBundleToSparse, setTerrainCell, setTerrainStyle, TERRAIN, terrainAt, terrainDetailSprite, terrainEntries, terrainRenderEntries, wallLineCells } from '../../src/constants.js'
import { DEDICATED_MATERIAL_URLS, terrainRendererTestApi } from '../../src/services/terrainRenderer.js'

describe('endless sparse grid', () => {
  it('stores signed coordinates in independent chunks', () => {
    const bundle = createEmptyBundle({ title: 'Endless map' })
    setTerrainCell(bundle, -33, -1, 'snow')
    setTerrainCell(bundle, 64, 65, 'grass')
    expect(terrainAt(bundle, -33, -1)).toBe('snow')
    expect(terrainAt(bundle, 64, 65)).toBe('grass')
    expect(bundle.chunks).toHaveLength(2)
    expect(getContentBounds(bundle)).toEqual({ minX: -20, minY: -15, maxX: 20, maxY: 15, width: 40, height: 30 })
  })

  it('migrates a fixed legacy board without losing its cells', () => {
    const bundle = createEmptyBundle({ title: 'Legacy map' })
    bundle.project.schemaVersion = 2
    bundle.project.width = 2
    bundle.project.height = 2
    bundle.chunks = [{ id: 'legacy', projectId: bundle.project.id, layerId: bundle.layers[0].id, x: 0, y: 0, width: 2, height: 2, cells: ['stone', 'grass', 'water', 'sand'] }]
    migrateBundleToSparse(bundle)
    expect(bundle.project.width).toBeUndefined()
    expect(terrainEntries(bundle).map((cell) => cell.terrain)).toEqual(['stone', 'grass', 'water', 'sand'])
  })

  it('selects connected wall art from neighbouring cells', () => {
    const walls=[{kind:'wall',x:0,y:0},{kind:'wall',x:0,y:-1},{kind:'wall',x:1,y:0}]
    expect(connectedWallSprite(walls,walls[0])).toBe(4)
    const horizontal=[{kind:'wall',x:0,y:0},{kind:'wall',x:1,y:0},{kind:'wall',x:2,y:0}]
    expect(horizontal.map((wall)=>connectedWallSprite(horizontal,wall))).toEqual([15,2,13])
    const vertical=[{kind:'wall',x:0,y:0},{kind:'wall',x:0,y:1},{kind:'wall',x:0,y:2}]
    expect(vertical.map((wall)=>connectedWallSprite(vertical,wall))).toEqual([12,1,14])
    expect(terrainDetailSprite({terrain:'deep-water',x:0,y:0})).toBeNull()
  })

  it('fills diagonal wall drags with orthogonally connected cells',()=>{
    const cells=wallLineCells({x:0,y:0},{x:5,y:3})
    expect(cells[0]).toEqual({x:0,y:0})
    expect(cells.at(-1)).toEqual({x:5,y:3})
    expect(cells).toHaveLength(9)
    for(let index=1;index<cells.length;index++)expect(Math.abs(cells[index].x-cells[index-1].x)+Math.abs(cells[index].y-cells[index-1].y)).toBe(1)
  })

  it('includes multi-cell object footprints in calculated bounds', () => {
    const bundle=createEmptyBundle({title:'Large landmarks'})
    bundle.objects.push({id:crypto.randomUUID(),projectId:bundle.project.id,layerId:bundle.layers[2].id,assetId:'tree',x:0,y:0,scale:1,deletedAt:null})
    expect(getContentBounds(bundle)).toEqual({minX:-20,minY:-15,maxX:20,maxY:15,width:40,height:30})
  })

  it('keeps edge profiles sparse and material generation bounded',()=>{
    const bundle=createEmptyBundle({title:'Painted edges'});setTerrainCell(bundle,-1,0,'grass');setTerrainCell(bundle,32,0,'grass');setTerrainStyle(bundle,-1,0,'wild')
    const cells=terrainRenderEntries(bundle)
    expect(cells.find((cell)=>cell.x===-1).edge).toBe('wild')
    expect(cells.find((cell)=>cell.x===32).edge).toBe('natural')
    expect(terrainRendererTestApi.EDGE_PROFILES.wild.halo).toBeGreaterThan(1)
    expect(terrainRendererTestApi.MATERIAL_TEXTURE_SIZE).toBe(1040)
    expect(terrainRendererTestApi.MATERIAL_QUILT_STEP).toBe(208)
    expect(terrainRendererTestApi.MATERIAL_TEXTURE_SIZE%terrainRendererTestApi.MATERIAL_QUILT_STEP).toBe(0)
    expect(terrainRendererTestApi.MATERIAL_QUILT_SEAM).toBeLessThan(terrainRendererTestApi.MATERIAL_QUILT_STEP/4)
  })

  it('smooths organic occupancy without creating values outside its neighbourhood',()=>{
    const source=new Float32Array(25);source[12]=1
    const result=terrainRendererTestApi.blurField(source,5,5,1)
    expect(result[12]).toBeGreaterThan(0)
    expect(result[12]).toBeLessThan(1)
    expect(result[0]).toBe(0)
    expect(result[7]).toBeGreaterThan(0)
  })

  it('cuts texture quilts through the lowest-cost continuous seam',()=>{
    const width=5,height=7,cost=new Float32Array(width*height).fill(20)
    for(let y=0;y<height;y++)cost[y*width+2]=0
    expect([...terrainRendererTestApi.minimumCostSeam(cost,width,height)]).toEqual(Array(height).fill(2))
  })

  it('defines a bounded perceptual texture scale for every terrain',()=>{
    expect(TERRAIN.every((terrain)=>Number.isFinite(terrain.texturePeriod)&&terrain.texturePeriod>=13&&terrain.texturePeriod<=24)).toBe(true)
    expect(TERRAIN.find((terrain)=>terrain.id==='dark-grass').texturePeriod).toBeLessThan(TERRAIN.find((terrain)=>terrain.id==='grass').texturePeriod)
    expect(TERRAIN.find((terrain)=>terrain.id==='dungeon').texturePeriod).toBeLessThan(TERRAIN.find((terrain)=>terrain.id==='earth').texturePeriod)
    expect(TERRAIN.find((terrain)=>terrain.id==='wood').texturePeriod).toBe(13)
    expect(TERRAIN.find((terrain)=>terrain.id==='moss-stone').texturePeriod).toBe(13)
    expect(Object.keys(DEDICATED_MATERIAL_URLS)).toEqual(['wood','moss-stone'])
  })

  it('normalizes competing materials without depending on painting order',()=>{
    const cells=[{x:0,y:0,terrain:'grass',edge:'natural'},{x:1,y:0,terrain:'stone',edge:'natural'}]
    const boundary=terrainRendererTestApi.sampleTerrainBlend(cells,1,.5),reversed=terrainRendererTestApi.sampleTerrainBlend([...cells].reverse(),1,.5)
    expect(boundary.alpha).toBeGreaterThan(.95)
    expect(boundary.weights.grass+boundary.weights.stone).toBeCloseTo(1,5)
    expect(reversed).toEqual(boundary)
    expect(terrainRendererTestApi.sampleTerrainBlend(cells,-2,.5).alpha).toBe(0)
  })

  it('keeps internal terrain feathers narrow and world-space deterministic',()=>{
    const balanced=[['grass',.5],['stone',.5]],first=terrainRendererTestApi.normalizeMaterialWeights(balanced,3.25,-7.5),again=terrainRendererTestApi.normalizeMaterialWeights([...balanced].reverse(),3.25,-7.5)
    expect(first.get('grass')+first.get('stone')).toBeCloseTo(1,6)
    expect(again.get('grass')).toBeCloseTo(first.get('grass'),6)
    const sharpened=terrainRendererTestApi.normalizeMaterialWeights([['grass',.7],['stone',.3]],8,4)
    expect(Math.max(...sharpened.values())).toBeGreaterThan(.995)
  })
})
