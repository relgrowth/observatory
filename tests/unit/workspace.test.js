import { createPinia,setActivePinia } from 'pinia'
import { beforeEach,describe,expect,it } from 'vitest'
import { getDb, resetDatabaseForTests } from '../../src/services/db.js'
import { useWorkspaceStore } from '../../src/stores/workspace.js'

beforeEach(async()=>{await resetDatabaseForTests();setActivePinia(createPinia())})

describe('workspace mutation ordering',()=>{
  it('rolls live state and history back when durable persistence fails',async()=>{
    const store=useWorkspaceStore();await store.initialize();const project=await store.createNewProject({title:'Failed save'});await store.openProject(project.id)
    const originalRevision=store.bundle.project.revision
    ;(await getDb()).close()
    await expect(store.paintCells([{x:1,y:1}],'grass')).rejects.toThrow()
    expect(store.bundle.project.revision).toBe(originalRevision)
    expect(store.terrainStrokes).toHaveLength(0)
    expect(store.undoStack).toHaveLength(0)
    expect(store.redoStack).toHaveLength(0)
    expect(store.saveState).toBe('failed')
    store.dispose()
  })

  it('waits for an in-flight terrain save before undoing it',async()=>{
    const store=useWorkspaceStore();await store.initialize()
    const project=await store.createNewProject({title:'Queued undo'});await store.openProject(project.id)
    const painting=store.paintCells([{x:0,y:0},{x:1,y:0},{x:2,y:0}],'grass')
    const undoing=store.undo()
    await Promise.all([painting,undoing])
    expect(store.terrainStrokes).toHaveLength(0)
    await store.redo()
    expect(store.terrainStrokes).toHaveLength(1)
    await store.openProject(project.id)
    expect(store.terrainStrokes).toHaveLength(1)
    store.dispose()
  })
  it('persists editable room shape changes and deletion through structure history',async()=>{
    const store=useWorkspaceStore();await store.initialize();const project=await store.createNewProject({title:'Editable room'});await store.openProject(project.id)
    const [room]=await store.createRooms([{x:1,y:2,width:6,height:4,terrain:'wood',shape:'star',sides:5,lineStyle:'hedge'}])
    expect(store.selection).toEqual({kind:'room',id:room.id})
    await store.updateEntity({shape:'ellipse',width:9,floorTerrain:'sand',lineStyle:'palisade'})
    expect(store.selectedEntity).toMatchObject({shape:'ellipse',width:9,floorTerrain:'sand',lineStyle:'palisade'})
    expect(store.selectedEntity.points).toHaveLength(32)
    await store.deleteSelection();expect(store.visibleRooms).toHaveLength(0)
    await store.undo();expect(store.visibleRooms).toHaveLength(1)
    store.dispose()
  })
  it('brings a selected shape in front of other structures',async()=>{
    const store=useWorkspaceStore();await store.initialize();const project=await store.createNewProject({title:'Shape stacking'});await store.openProject(project.id)
    const [first]=await store.createRooms([{x:1,y:1,width:4,height:4,terrain:'wood'}]),[second]=await store.createRooms([{x:2,y:2,width:4,height:4,terrain:'stone'}])
    store.selection={kind:'room',id:first.id};await store.bringSelectionToFront()
    expect(first.zIndex).toBeGreaterThan(second.zIndex)
    expect(store.visibleRooms.at(-1).id).toBe(first.id)
    await store.openProject(project.id);expect(store.bundle.structures.find((item)=>item.id===first.id).zIndex).toBeGreaterThan(store.bundle.structures.find((item)=>item.id===second.id).zIndex)
    store.dispose()
  })
  it('persists label typography and allows it to be edited',async()=>{
    const store=useWorkspaceStore();await store.initialize();const project=await store.createNewProject({title:'Styled labels'});await store.openProject(project.id)
    const [label]=await store.addLabels([{text:'The Sunken Watch',x:3.5,y:-2,boxWidth:8,boxHeight:2,fontSize:1.25,size:'large',font:'display',color:'gold',bold:true}])
    expect(label).toMatchObject({boxWidth:8,boxHeight:2,fontSize:1.25,size:'large',font:'display',color:'gold',bold:true})
    await store.updateEntity({font:'serif',color:'ink',bold:false})
    await store.openProject(project.id)
    expect(store.bundle.labels[0]).toMatchObject({font:'serif',color:'ink',bold:false})
    store.dispose()
  })
})
