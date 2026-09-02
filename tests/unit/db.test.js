import { beforeEach,describe,expect,it } from 'vitest'
import { createEmptyBundle } from '../../src/constants.js'
import { loadProjectBundle,resetDatabaseForTests,saveProjectBundle } from '../../src/services/db.js'
beforeEach(()=>resetDatabaseForTests())
describe('map persistence',()=>{it('round trips chunks and semantic layers atomically',async()=>{const bundle=createEmptyBundle({title:'Test map',width:12,height:10});bundle.chunks[0].cells[3]='water';bundle.objects.push({id:crypto.randomUUID(),projectId:bundle.project.id,layerId:bundle.layers[2].id,assetId:'chest',x:3,y:4});await saveProjectBundle(bundle);const loaded=await loadProjectBundle(bundle.project.id);expect(loaded.project.title).toBe('Test map');expect(loaded.chunks[0].cells[3]).toBe('water');expect(loaded.objects[0].assetId).toBe('chest')})})
