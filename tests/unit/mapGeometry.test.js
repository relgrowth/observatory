import { describe,expect,it } from 'vitest'
import { createEmptyBundle } from '../../src/constants.js'
import { brushInnerRadius, createRoomStructure, createTerrainStroke, createWallPath, interpolatePoints, normalizeRoomStructure, pointInRoom, pointInStroke, roomShapePoints, simplifyPoints, STROKE_FALLOFF_STEPS, strokeFalloffLayers, strokeSoftness, terrainAtPoint } from '../../src/services/mapGeometry.js'

describe('continuous map geometry',()=>{
  it('fills fast pointer movement at stable brush spacing',()=>{
    const points=interpolatePoints({x:0,y:0},{x:2,y:0},.4)
    expect(points).toHaveLength(5)
    expect(points.at(-1)).toEqual({x:2,y:0})
  })
  it('simplifies a straight stroke while retaining its ends',()=>{
    expect(simplifyPoints([{x:0,y:0},{x:.5,y:.01},{x:1,y:0}],.05)).toEqual([{x:0,y:0},{x:1,y:0}])
  })

  it('keeps softness in the outer portion of the brush footprint',()=>{
    expect(brushInnerRadius(5,0)).toBe(5)
    expect(brushInnerRadius(5,1)).toBe(3.25)
    expect(brushInnerRadius(5,.5)).toBeCloseTo(4.125)
  })

  it('provides one shared deterministic falloff contract for live and export renderers',()=>{
    const layers=strokeFalloffLayers(5,1)
    expect(layers).toHaveLength(STROKE_FALLOFF_STEPS)
    expect(layers[0].radius).toBe(5)
    expect(layers.at(-1).radius).toBe(3.25)
    expect(layers.every(({alpha})=>alpha>=0&&alpha<=1)).toBe(true)
    expect(strokeSoftness({edge:'wild'})).toBe(1)
    expect(strokeSoftness({edge:'crisp'})).toBe(0)
  })

  it('creates paint and erase strokes with bounded geometry',()=>{
    const bundle=createEmptyBundle(),layerId=bundle.layers[0].id
    const gestureId='11111111-1111-4111-8111-111111111111'
    const paint=createTerrainStroke(bundle.project,layerId,{id:gestureId,terrain:'grass',points:[{x:0,y:0},{x:2,y:0}],radius:.75})
    const erase=createTerrainStroke(bundle.project,layerId,{mode:'erase',points:[{x:1,y:0}],radius:.25})
    bundle.terrainStrokes.push(paint,erase)
    expect(pointInStroke(paint,{x:1,y:.5})).toBe(true)
    expect(paint.id).toBe(gestureId)
    expect(paint.softness).toBe(.75)
    expect(createTerrainStroke(bundle.project,layerId,{terrain:'sand',softness:1.4,points:[{x:0,y:0}]}).softness).toBe(1)
    expect(terrainAtPoint(bundle,0,0)).toBe('grass')
    expect(terrainAtPoint(bundle,.5,-.5)).toBeNull()
    expect(paint.bounds).toMatchObject({minX:-.75,maxX:2.75})
  })

  it('uses one polygon boundary for a room floor and its walls',()=>{
    const bundle=createEmptyBundle(),layerId=bundle.layers[1].id
    const room=createRoomStructure(bundle.project,layerId,{x:2,y:3,width:5,height:4,terrain:'wood'})
    expect(room.points).toEqual([{x:2,y:3},{x:7,y:3},{x:7,y:7},{x:2,y:7}])
    expect(room.floorTerrain).toBe('wood')
    expect(room.shape).toBe('rectangle')
    expect(room.closed).toBe(true)
    const star=createRoomStructure(bundle.project,layerId,{x:0,y:0,width:8,height:6,shape:'star',sides:5,lineStyle:'hedge'})
    expect(roomShapePoints(star)).toHaveLength(10)
    expect(pointInRoom(star,{x:4,y:3})).toBe(true)
    expect(star.lineStyle).toBe('hedge')
    expect(normalizeRoomStructure({kind:'room',points:[{x:2,y:3},{x:7,y:3},{x:7,y:6},{x:2,y:6}]})).toMatchObject({shape:'rectangle',x:2,y:3,width:5,height:3,lineStyle:'stone-wall'})
    const wall=createWallPath(bundle.project,layerId,{points:[{x:0,y:0},{x:1,y:.01},{x:2,y:0}]})
    expect(wall.points).toEqual([{x:0,y:0},{x:2,y:0}])
    expect(wall.lineStyle).toBe('stone-wall')
    expect(createWallPath(bundle.project,layerId,{lineStyle:'palisade',wallTerrain:'wood',wallWidth:.38,points:[{x:0,y:0},{x:2,y:0}]})).toMatchObject({lineStyle:'palisade',wallTerrain:'wood',wallWidth:.38})
  })
})
