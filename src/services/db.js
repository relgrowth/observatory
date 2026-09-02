import { openDB } from 'idb'

export const DB_NAME = 'story-shack-mapworks'
export const DB_VERSION = 1
export const STORES = ['projects', 'layers', 'chunks', 'structures', 'objects', 'labels', 'preferences', 'trash']
let dbPromise
const plain = (value) => value == null || typeof value !== 'object' ? value : Array.isArray(value) ? value.map(plain) : Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plain(entry)]))

export const getDb = () => (dbPromise ||= openDB(DB_NAME, DB_VERSION, { upgrade(db) { for (const name of STORES) { const store = db.createObjectStore(name, { keyPath: name === 'preferences' ? 'key' : 'id' }); if (!['projects', 'preferences'].includes(name)) store.createIndex('projectId', 'projectId') } } }))

export async function loadProjectBundle(id) {
  const db = await getDb(); const names = ['projects', 'layers', 'chunks', 'structures', 'objects', 'labels']; const tx = db.transaction(names, 'readonly'); const project = await tx.objectStore('projects').get(id); if (!project) return null
  const children = await Promise.all(names.slice(1).map((name) => tx.objectStore(name).index('projectId').getAll(id))); await tx.done
  return { project, ...Object.fromEntries(names.slice(1).map((name, index) => [name, children[index]])) }
}

export async function saveProjectBundle(bundle) {
  const db = await getDb(); const names = ['projects', 'layers', 'chunks', 'structures', 'objects', 'labels']; const tx = db.transaction(names, 'readwrite'); await tx.objectStore('projects').put(plain(bundle.project))
  for (const name of names.slice(1)) { const store = tx.objectStore(name); const old = await store.index('projectId').getAllKeys(bundle.project.id); await Promise.all(old.map((key) => store.delete(key))); await Promise.all((bundle[name] || []).map((record) => store.put(plain(record)))) }
  await tx.done
}
export async function deleteProjectBundle(id) { const db = await getDb(); const tx = db.transaction(STORES.filter((name) => name !== 'preferences'), 'readwrite'); await tx.objectStore('projects').delete(id); for (const name of STORES.filter((name) => !['projects','preferences'].includes(name))) { const store = tx.objectStore(name); const keys = await store.index('projectId').getAllKeys(id); await Promise.all(keys.map((key) => store.delete(key))) } await tx.done }
export async function getPreference(key, fallback = null) { return (await (await getDb()).get('preferences', key))?.value ?? fallback }
export async function setPreference(key, value) { return (await getDb()).put('preferences', { key, value }) }
export async function resetDatabaseForTests() { dbPromise?.then((db) => db.close()); dbPromise = null; await indexedDB.deleteDatabase(DB_NAME) }
