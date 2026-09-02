import { describe,expect,it } from 'vitest'
import { constellationLayout,storyFlowLayout,tidyLayout } from '../../src/services/layouts.js'
const cards=[{id:'a',typeId:'beat',fields:{sequence:'2'},position:{x:0,y:0}},{id:'b',typeId:'beat',fields:{sequence:'1'},position:{x:0,y:0}},{id:'c',typeId:'character',fields:{},position:{x:0,y:0}}]
describe('deterministic layouts',()=>{it('places every live card',()=>{expect(tidyLayout(cards)).toHaveLength(3);expect(constellationLayout(cards)).toHaveLength(3)});it('orders beats by sequence',()=>{const result=storyFlowLayout(cards);expect(result.find(x=>x.id==='b').position.x).toBeLessThan(result.find(x=>x.id==='a').position.x)})})
