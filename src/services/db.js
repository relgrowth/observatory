import { openDB } from 'idb'

export const DB_NAME = 'story-shack-observatory'
export const DB_VERSION = 3
export const STORES = ['projects', 'layers', 'chunks', 'terrainStyles', 'terrainStrokes', 'structures', 'objects', 'labels', 'preferences', 'trash']
let dbPromise
const plain = (value) => value == null || typeof value !== 'object' ? value : Array.isArray(value) ? value.map(plain) : Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plain(entry)]))

export const getDb = () => (dbPromise ||= openDB(DB_NAME, DB_VERSION, { upgrade(db) { for (const name of STORES) if(!db.objectStoreNames.contains(name)){ const store = db.createObjectStore(name, { keyPath: name === 'preferences' ? 'key' : 'id' }); if (!['projects', 'preferences'].includes(name)) store.createIndex('projectId', 'projectId') } } }))

export async function loadProjectBundle(id) {
  const db = await getDb(); const names = ['projects', 'layers', 'chunks', 'terrainStyles', 'terrainStrokes', 'structures', 'objects', 'labels']; const tx = db.transaction(names, 'readonly'); const project = await tx.objectStore('projects').get(id); if (!project) return null
  const children = await Promise.all(names.slice(1).map((name) => tx.objectStore(name).index('projectId').getAll(id))); await tx.done
  const bundle={ project, ...Object.fromEntries(names.slice(1).map((name, index) => [name, children[index]])) }
  bundle.terrainStrokes.sort((first,second)=>(first.order||0)-(second.order||0)||(first.createdAt||'').localeCompare(second.createdAt||'')||first.id.localeCompare(second.id))
  return bundle
}

export async function saveProjectBundle(bundle, changedStores = null) {
  const childStores = changedStores ? [...new Set(changedStores)] : ['layers', 'chunks', 'terrainStyles', 'terrainStrokes', 'structures', 'objects', 'labels']
  const db = await getDb(); const names = ['projects', ...childStores]; const tx = db.transaction(names, 'readwrite'); await tx.objectStore('projects').put(plain(bundle.project))
  for (const name of childStores) {
    const store = tx.objectStore(name)
    const existing = await store.index('projectId').getAll(bundle.project.id)
    const existingById = new Map(existing.map((record) => [record.id, record]))
    const incoming = (bundle[name] || []).map(plain)
    const incomingIds = new Set(incoming.map((record) => record.id))
    await Promise.all(existing.filter((record) => !incomingIds.has(record.id)).map((record) => store.delete(record.id)))
    await Promise.all(incoming.filter((record) => JSON.stringify(existingById.get(record.id)) !== JSON.stringify(record)).map((record) => store.put(record)))
  }
  await tx.done
}
export async function deleteProjectBundle(id) { const db = await getDb(); const tx = db.transaction(STORES.filter((name) => name !== 'preferences'), 'readwrite'); await tx.objectStore('projects').delete(id); for (const name of STORES.filter((name) => !['projects','preferences'].includes(name))) { const store = tx.objectStore(name); const keys = await store.index('projectId').getAllKeys(id); await Promise.all(keys.map((key) => store.delete(key))) } await tx.done }
export async function getPreference(key, fallback = null) { return (await (await getDb()).get('preferences', key))?.value ?? fallback }
export async function setPreference(key, value) { return (await getDb()).put('preferences', { key, value }) }
export async function resetDatabaseForTests() { dbPromise?.then((db) => db.close()); dbPromise = null; await indexedDB.deleteDatabase(DB_NAME) }
