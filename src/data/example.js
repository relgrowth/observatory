import { createEmptyBundle, nowIso, uuid } from '../constants.js'
import { createTerrainStroke } from '../services/mapGeometry.js'

export const EXAMPLE_VERSION = 9
export const EXAMPLE_PROJECT_TITLE = 'The Drowsy Village'

// Source-controlled reconstruction of the hand-authored Drowsy Village map.
// Some paths intentionally cross the frame and rely on clean renderer clipping.
const TERRAIN_STROKES = [
  ['deep-water',4.5,[[-8.699,15.862],[-7.895,14.346],[-5.711,12.443],[-3.265,11.072],[-1.548,9.866],[-.465,8.196],[-.229,6.042],[-1.322,2.667],[-1.761,.549],[-1.229,-1.57],[-.368,-3.251],[1.398,-3.921],[1.58,-4.748],[3.103,-4.739],[4.109,-5.587],[4.273,-6.785],[5.512,-6.53],[6.605,-6.418],[6.912,-7.1],[6.468,-8.204],[7.314,-8.555],[8.586,-9.528],[10.002,-10.624],[10.782,-11.886],[10.905,-14.534],[10.76,-15.369]]],
  ['deep-water',2,[[-3.691,10.1],[-2.719,9.022],[-2.618,8.411],[-2.128,6.809],[-2.057,5.328],[-2.231,3.497],[-1.881,5.232],[-2.636,7.852],[-3.595,9.733],[-4.65,10.8],[-4.355,9.471],[-3.728,8.132],[-2.743,6.391],[-2.024,4.305]]],
  ['deep-water',2,[[-.366,3.241],[-.12,2.724],[.022,2.191],[.605,.997],[.686,.58],[1.028,-1.751],[1.028,-2.428],[.877,-3.233]]],
  ['deep-water',2,[[-.206,-4.337],[.179,-4.997],[.814,-6.695],[1.654,-7.879],[2.902,-8.756],[4.274,-9.026]]],
  ['mud',2,[[-11.661,14.575],[-9.161,12.449],[-7.318,10.523],[-5.809,8.709],[-4.689,6.241],[-4.111,3.701],[-3.962,.738],[-3.503,-1.587],[-2.961,-2.903],[-1.826,-4.764],[-.628,-6.608]]],
  ['mud',2,[[.251,-7.747],[1.073,-8.488],[3.078,-9.598],[5.1,-10.371],[6.394,-10.986],[7.369,-12.448],[7.805,-14.742]]],
  ['mud',2,[[.196,14.992],[1.289,13.558],[2.125,11.389],[2.793,9.446],[3.173,6.337],[2.688,3.75],[2.493,2.085],[3.176,.069],[3.933,-.755],[5.174,-1.744],[7.241,-3.335]]],
  ['stone',4,[[-5.223,-2.193],[-6.402,-2.732],[-8.978,-3.625],[-12.013,-4.096],[-15.44,-3.995],[-17.671,-3.832],[-19.522,-3.421],[-20.182,-3.165]]],
  ['stone',4,[[3.675,.813],[5.899,1.281],[8.38,1.899],[11.737,2.791],[14.253,3.984],[16.924,6.361],[19.37,9.543]]],
  ['mud',2,[[8.55,-4.1],[9.358,-5.107],[10.882,-6.121],[12.108,-7.562],[13.449,-9.425],[13.98,-11.078],[13.925,-13.737],[13.906,-14.704]]],
  ['deep-water',4.5,[[-7.562,15.816],[-6.335,15.208],[-4.508,14.669],[-3.228,13.843],[-2.227,12.674]]],
  ['mud',1,[[-10.718,14.368],[-10.148,13.31],[-9.594,12.851]]],
  ['stone',4,[[19.767,10.41],[20.09,10.791],[20.831,11.541]]],
]

const OBJECTS = [
  ['bridge',-.75,-1,290,4.267287539404855],['tree',-11,-12,0,1.799713364572049],['tree',-.5,-11,5,2.7561531249791353],['tree',9.5,-5.25,0,3.7973863725751063],['tree',-16.25,9.75,0,2.0728550545353777],['cottage',-12.75,1.25,200,3.85812285377722],['market-stall',15.75,1,35,3.0514786852667606],['pine',4.25,7.25,0,2.217542662507494],['tent',10.75,11.25,175,4.271689584093026],['campfire',10,7.75,0,1.2223496140772665],['boulder',-17.25,-12.25,0,1.6180286678205986],['boulder',-12,-8,0,1],['boulder',-5.25,-9.25,0,1.4547991885835558],
]

export function createExampleBundle() {
  const bundle = createEmptyBundle({ title: EXAMPLE_PROJECT_TITLE, description: 'A quiet forest village.', mapType: 'village', frameWidth:40, frameHeight:30, baseTerrain:'grass' })
  const terrainLayer = bundle.layers.find((layer) => layer.kind === 'terrain')
  bundle.terrainStrokes = TERRAIN_STROKES.map(([terrain,radius,points],index) => createTerrainStroke(bundle.project,terrainLayer.id,{terrain,radius,edge:'natural',softness:1,points:points.map(([x,y])=>({x,y})),order:index+1}))
  const objectLayer = bundle.layers.find((layer) => layer.kind === 'objects')
  OBJECTS.forEach(([assetId,x,y,rotation,scale],index) => { const timestamp=nowIso(); bundle.objects.push({id:uuid(),projectId:bundle.project.id,layerId:objectLayer.id,assetId,x,y,rotation,scale,zIndex:index===0?1:index+2,createdAt:timestamp,updatedAt:timestamp,deletedAt:null}) })
  return bundle
}
