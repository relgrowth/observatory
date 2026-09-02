import { describe,expect,it } from 'vitest'
import { inspectStory } from '../../src/services/lenses.js'
describe('Story Lenses',()=>{it('finds neutral structural gaps',()=>{const issues=inspectStory({cards:[{id:'a',typeId:'character',title:'A',fields:{},deletedAt:null},{id:'b',typeId:'note',title:'A',fields:{},deletedAt:null}],relationships:[],groups:[],media:[]});expect(issues.some(x=>x.kind==='motivation')).toBe(true);expect(issues.some(x=>x.kind==='duplicate')).toBe(true)})})
