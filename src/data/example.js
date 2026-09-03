import { createEmptyBundle, nowIso, uuid } from '../constants.js'
import { createRoomStructure, createTerrainStroke, createWallPath } from '../services/mapGeometry.js'

export const EXAMPLE_VERSION = 6
export const EXAMPLE_PROJECT_TITLE = 'The Abandoned Tower'

const TERRAIN_STROKES = [
  ['dark-grass',10.5,'wild',.94,[[-23,-13],[-12,-14],[0,-12],[12,-14],[23,-12]]],
  ['dark-grass',10,'wild',.96,[[-24,-5],[-13,-4],[-2,-6],[10,-4],[23,-5]]],
  ['dark-grass',10.5,'wild',.95,[[-23,4],[-12,3],[0,5],[12,3],[24,4]]],
  ['dark-grass',10,'wild',.93,[[-22,13],[-10,12],[2,14],[13,12],[22,13]]],
  ['grass',5.5,'wild',.9,[[-20,-10],[-14,-8],[-9,-10]]],
  ['grass',4.8,'wild',.88,[[8,-12],[14,-9],[20,-10]]],
  ['grass',5.2,'natural',.9,[[-21,6],[-15,8],[-10,6]]],
  ['grass',5,'wild',.91,[[10,7],[16,5],[21,8]]],
  ['mud',2.8,'wild',.87,[[-16,-2],[-12,0],[-9,-2]]],
  ['mud',2.5,'wild',.85,[[12,1],[16,-1],[19,1]]],
  ['earth',1.35,'natural',.42,[[-21,15],[-17,12],[-15,9]]],
  ['earth',1.2,'natural',.38,[[-15,9],[-11,7],[-8,7]]],
  ['earth',1.15,'natural',.36,[[-8,7],[-5,5],[-4,2]]],
  ['earth',1.3,'natural',.4,[[-4,2],[-2,0],[0,0]]],
  ['earth',7.2,'wild',.9,[[1,0],[2,-1]]],
  ['grass',5.8,'wild',.82,[[1,0],[2,-1]]],
  ['moss-stone',3.2,'natural',.5,[[0,-1],[1,-1]]],
  ['scree',1.7,'wild',.72,[[-2,-4],[-4,-3]]],
  ['scree',1.4,'wild',.68,[[4,-3],[5,-1]]],
  ['scree',1.6,'wild',.74,[[3,3],[1,4]]],
]

const FOREST_OBJECTS = [
  ['pine',-22,-14,-12,1.35],['pine',-18,-15,8,1.05],['pine',-14,-13,19,1.25],['pine',-10,-15,-17,.95],['pine',-6,-13,6,1.3],['pine',0,-15,-9,1.15],['pine',6,-14,16,1.35],['pine',11,-15,-14,1.05],['pine',16,-13,11,1.25],['pine',21,-14,-6,1.4],
  ['pine',-23,-9,15,1.1],['pine',-17,-8,-18,1.3],['pine',-12,-10,7,.9],['pine',-8,-8,21,1.15],['pine',10,-9,-11,1.2],['pine',16,-8,14,1.35],['pine',22,-9,-8,1.1],['pine',-22,-3,9,1.3],['pine',-15,-3,-15,1.05],['pine',-11,-5,18,1.25],
  ['pine',13,-4,-12,1.2],['pine',20,-3,7,1.4],['pine',-22,4,-17,1.15],['pine',-16,5,12,1.35],['pine',-11,3,-7,1],['pine',12,4,19,1.25],['pine',17,6,-13,1.1],['pine',22,4,8,1.35],['pine',-19,11,16,1.3],['pine',-13,13,-10,1.05],
  ['pine',-7,12,6,1.25],['pine',7,12,-18,1.15],['pine',14,13,12,1.35],['pine',20,11,-6,1.2],
  ['tree',-20,-6,11,.9],['tree',-10,-12,-14,.85],['tree',13,-11,19,.9],['tree',-19,7,-9,.85],['tree',18,1,14,.9],['tree',10,10,-16,.85],
  ['boulder',-6.5,-4.5,18,.9],['boulder',6.2,-4.8,-12,1],['boulder',7,4.4,9,.8],['boulder',-5.3,5.1,-19,.9],['boulder',-11.5,7.8,14,.75],['boulder',-3.2,1.8,-7,.65],
]

const CLEARING_HEDGES = [
  [[[-7,-4],[-5,-6],[-2,-7]],'dark-grass',.5],
  [[[1,-7],[4,-6.5],[7,-4.5]],'dark-grass',.48],
  [[[7.5,-2],[8,1],[7,4]],'grass',.5],
  [[[5,6],[2,7],[0,6.8]],'dark-grass',.46],
  [[[-5,5],[-7,3],[-8,0]],'grass',.52],
  [[[-8,-1],[-8,-3],[-7,-4]],'dark-grass',.45],
]

export function createExampleBundle() {
  const bundle = createEmptyBundle({ title: EXAMPLE_PROJECT_TITLE, description: 'A lone tower in a dense forest.', mapType: 'wilderness' })
  const terrainLayer = bundle.layers.find((layer) => layer.kind === 'terrain')
  bundle.terrainStrokes = TERRAIN_STROKES.map(([terrain,radius,edge,softness,points],index) => createTerrainStroke(bundle.project,terrainLayer.id,{terrain,radius,edge,softness,points:points.map(([x,y])=>({x,y})),order:index+1}))

  const structureLayer = bundle.layers.find((layer) => layer.kind === 'structure')
  const foundation = createRoomStructure(bundle.project,structureLayer.id,{x:-2.6,y:-4.2,width:7.2,height:7.2,terrain:'moss-stone',shape:'polygon',rotation:7,sides:10,lineStyle:'stone-wall',wallTerrain:'moss-stone',wallWidth:.42})
  foundation.zIndex = 20
  bundle.structures.push(foundation,...CLEARING_HEDGES.map(([points,wallTerrain,wallWidth])=>({...createWallPath(bundle.project,structureLayer.id,{points:points.map(([x,y])=>({x,y})),lineStyle:'hedge',wallTerrain,wallWidth}),zIndex:18})))

  const objectLayer = bundle.layers.find((layer) => layer.kind === 'objects')
  const addObject = (assetId,x,y,rotation,scale,zIndex) => {
    const timestamp=nowIso()
    bundle.objects.push({id:uuid(),projectId:bundle.project.id,layerId:objectLayer.id,assetId,x,y,rotation,scale,zIndex,createdAt:timestamp,updatedAt:timestamp,deletedAt:null})
  }
  FOREST_OBJECTS.forEach(([assetId,x,y,rotation,scale],index)=>addObject(assetId,x,y,rotation,scale,index+1))
  addObject('tower',1,-.8,7,1.65,40)
  addObject('stairs',-.8,2.2,-8,.85,41)
  addObject('door',.1,1.5,-5,.7,42)
  return bundle
}
