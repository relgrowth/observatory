import { beforeEach,describe,expect,it } from 'vitest'
import { createProject } from '../../src/constants.js'
import { loadProjectBundle,resetDatabaseForTests,saveProjectBundle } from '../../src/services/db.js'
beforeEach(()=>resetDatabaseForTests())
describe('IndexedDB bundles',()=>{it('round trips one logical bundle',async()=>{const project=createProject({title:'Test'}),bundle={project,cards:[],relationships:[],groups:[],cardTypes:[],media:[]};await saveProjectBundle(bundle);expect((await loadProjectBundle(project.id)).project.title).toBe('Test')})})
