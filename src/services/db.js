import { openDB } from 'idb'

export const DB_NAME = 'story-shack-observatory'
export const DB_VERSION = 1
export const STORES = ['projects', 'cards', 'relationships', 'groups', 'cardTypes', 'media', 'preferences', 'trash']

let dbPromise
const plainRecord = (value) => {
  if (value == null || typeof value !== 'object') return value
  if (value instanceof Blob) return value
  if (Array.isArray(value)) return value.map(plainRecord)
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plainRecord(entry)]))
}
export const getDb = () => (dbPromise ||= openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    for (const name of STORES) {
      if (db.objectStoreNames.contains(name)) continue
      const store = db.createObjectStore(name, { keyPath: name === 'preferences' ? 'key' : 'id' })
      if (['cards', 'relationships', 'groups', 'cardTypes', 'media', 'trash'].includes(name)) store.createIndex('projectId', 'projectId')
    }
  },
}))

export async function loadProjectBundle(id) {
  const db = await getDb()
  const tx = db.transaction(['projects', 'cards', 'relationships', 'groups', 'cardTypes', 'media'], 'readonly')
  const project = await tx.objectStore('projects').get(id)
  if (!project) return null
  const byProject = (store) => tx.objectStore(store).index('projectId').getAll(id)
  const [cards, relationships, groups, cardTypes, media] = await Promise.all(['cards', 'relationships', 'groups', 'cardTypes', 'media'].map(byProject))
  await tx.done
  return { project, cards, relationships, groups, cardTypes, media }
}

export async function saveProjectBundle(bundle) {
  const db = await getDb()
  const names = ['projects', 'cards', 'relationships', 'groups', 'cardTypes', 'media']
  const tx = db.transaction(names, 'readwrite')
  await tx.objectStore('projects').put(plainRecord(bundle.project))
  for (const name of names.slice(1)) {
    const store = tx.objectStore(name)
    const old = await store.index('projectId').getAllKeys(bundle.project.id)
    await Promise.all(old.map((key) => store.delete(key)))
    await Promise.all((bundle[name] || []).map((record) => store.put(plainRecord(record))))
  }
  await tx.done
}

export async function deleteProjectBundle(id) {
  const db = await getDb()
  const names = ['projects', 'cards', 'relationships', 'groups', 'cardTypes', 'media', 'trash']
  const tx = db.transaction(names, 'readwrite')
  await tx.objectStore('projects').delete(id)
  for (const name of names.slice(1)) {
    const store = tx.objectStore(name)
    const keys = await store.index('projectId').getAllKeys(id)
    await Promise.all(keys.map((key) => store.delete(key)))
  }
  await tx.done
}

export async function getPreference(key, fallback = null) { return (await (await getDb()).get('preferences', key))?.value ?? fallback }
export async function setPreference(key, value) { return (await getDb()).put('preferences', { key, value }) }
export async function resetDatabaseForTests() { dbPromise?.then((db) => db.close()); dbPromise = null; await indexedDB.deleteDatabase(DB_NAME) }
