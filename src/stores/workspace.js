import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createCard, createProject, LIMITS, nowIso, uuid } from '../constants.js'
import { deleteProjectBundle, getDb, getPreference, loadProjectBundle, saveProjectBundle, setPreference } from '../services/db.js'
import { arrange as calculateLayout } from '../services/layouts.js'
import { inspectStory } from '../services/lenses.js'
import { createExampleBundle } from '../data/example.js'

// Vue wraps live workspace data in proxies, which structuredClone cannot copy.
// Logical undo snapshots contain JSON records only; media Blobs stay outside them.
const clone = (value) => JSON.parse(JSON.stringify(value))
const alive = (records = []) => records.filter((record) => !record.deletedAt)

export const useWorkspaceStore = defineStore('workspace', () => {
  const ready = ref(false), projects = ref([]), bundle = ref(null), selection = ref([])
  const saveState = ref('saved'), error = ref(null), theme = ref('basic'), locale = ref('en')
  const undoStack = ref([]), redoStack = ref([]), externalRevision = ref(null)
  let channel

  const activeCards = computed(() => alive(bundle.value?.cards))
  const activeRelationships = computed(() => alive(bundle.value?.relationships))
  const activeGroups = computed(() => alive(bundle.value?.groups))
  const lenses = computed(() => bundle.value ? inspectStory({ ...bundle.value, relationships: bundle.value.relationships.map((rel) => ({ ...rel, sourceId: rel.source, targetId: rel.target })) }).map((issue) => ({ ...issue, elementIds: issue.cardIds, title: issue.kind.replaceAll('_', ' '), message: issue.messageKey })) : [])
  const selected = computed(() => {
    const id = selection.value[0]
    return activeCards.value.find((x) => x.id === id) || activeRelationships.value.find((x) => x.id === id) || activeGroups.value.find((x) => x.id === id) || null
  })

  async function initialize() {
    theme.value = await getPreference('theme', globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'charcoal' : 'basic')
    locale.value = await getPreference('locale', navigator.language?.split('-')[0] || 'en')
    await refreshProjects()
    if (!projects.value.length && !(await getPreference('exampleCreated', false))) {
      await saveProjectBundle(createExampleBundle()); await setPreference('exampleCreated', true); await refreshProjects()
    }
    if ('BroadcastChannel' in globalThis) {
      channel = new BroadcastChannel('story-shack-observatory')
      channel.onmessage = ({ data }) => { if (bundle.value?.project.id === data?.projectId && data.revision > bundle.value.project.revision) externalRevision.value = data.revision }
    }
    ready.value = true
  }

  async function refreshProjects() {
    const db = await getDb(); projects.value = (await db.getAll('projects')).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  async function openProject(id) {
    bundle.value = await loadProjectBundle(id); selection.value = []; undoStack.value = []; redoStack.value = []; externalRevision.value = null
    return bundle.value
  }
  async function createNewProject(input = {}) {
    if (projects.value.filter((x) => !x.deletedAt).length >= LIMITS.projects) throw Object.assign(new Error('Project limit reached'), { code: 'limit_reached' })
    const next = { project: createProject(input), cards: [], relationships: [], groups: [], cardTypes: [], media: [] }
    await saveProjectBundle(next); await refreshProjects(); return next.project
  }
  async function duplicateProject(id) {
    const source = await loadProjectBundle(id); if (!source) throw Object.assign(new Error('Project not found'), { code: 'not_found' })
    const project = createProject({ title: `${source.project.title} copy`, premise: source.project.premise })
    const cardIds = Object.fromEntries(source.cards.map((card) => [card.id, uuid()]))
    const copy = { project, cards: source.cards.map((card) => ({ ...clone(card), id: cardIds[card.id], projectId: project.id, createdAt: nowIso(), updatedAt: nowIso() })), relationships: source.relationships.map((rel) => ({ ...clone(rel), id: uuid(), projectId: project.id, source: cardIds[rel.source], target: cardIds[rel.target], createdAt: nowIso(), updatedAt: nowIso() })), groups: source.groups.map((group) => ({ ...clone(group), id: uuid(), projectId: project.id, memberIds: group.memberIds.map((id) => cardIds[id]).filter(Boolean) })), cardTypes: source.cardTypes.map((type) => ({ ...clone(type), id: uuid(), projectId: project.id })), media: source.media.map((media) => ({ ...media, id: uuid(), projectId: project.id })) }
    await saveProjectBundle(copy); await refreshProjects(); return project
  }
  async function patchProject(id, patch) {
    const target = await loadProjectBundle(id); if (!target) return false
    target.project = { ...target.project, ...patch, updatedAt: nowIso(), revision: target.project.revision + 1 }
    await saveProjectBundle(target); if (bundle.value?.project.id === id) bundle.value = target; await refreshProjects(); return true
  }
  async function purgeProject(id) { await deleteProjectBundle(id); if (bundle.value?.project.id === id) bundle.value = null; await refreshProjects() }

  function snapshot() { return clone({ project: bundle.value.project, cards: bundle.value.cards, relationships: bundle.value.relationships, groups: bundle.value.groups, cardTypes: bundle.value.cardTypes }) }
  function remember() { undoStack.value.push(snapshot()); if (undoStack.value.length > 50) undoStack.value.shift(); redoStack.value = [] }
  async function commit(mutator, { rememberUndo = true } = {}) {
    if (!bundle.value) throw Object.assign(new Error('Project not found'), { code: 'not_found' })
    if (externalRevision.value && externalRevision.value > bundle.value.project.revision) throw Object.assign(new Error('This observatory changed in another tab'), { code: 'version_conflict' })
    if (rememberUndo) remember(); saveState.value = 'saving'; error.value = null
    try {
      await mutator(bundle.value)
      bundle.value.project = { ...bundle.value.project, revision: bundle.value.project.revision + 1, updatedAt: nowIso() }
      await saveProjectBundle(bundle.value); saveState.value = 'saved'
      channel?.postMessage({ projectId: bundle.value.project.id, revision: bundle.value.project.revision })
      await refreshProjects(); return bundle.value.project.revision
    } catch (cause) { saveState.value = 'failed'; error.value = cause; throw cause }
  }
  async function undo() { if (!undoStack.value.length) return; redoStack.value.push(snapshot()); const prior = undoStack.value.pop(); bundle.value = { ...bundle.value, ...prior }; await commit(() => {}, { rememberUndo: false }) }
  async function redo() { if (!redoStack.value.length) return; undoStack.value.push(snapshot()); const next = redoStack.value.pop(); bundle.value = { ...bundle.value, ...next }; await commit(() => {}, { rememberUndo: false }) }

  async function addCards(inputs) {
    if (activeCards.value.length + inputs.length > LIMITS.cards) throw Object.assign(new Error('Card limit reached'), { code: 'limit_reached' })
    const created = inputs.map((input, index) => createCard({ ...input, projectId: bundle.value.project.id }, activeCards.value.length + index))
    await commit((draft) => { draft.cards.push(...created) }); selection.value = created.map((x) => x.id); return created
  }
  async function updateCards(updates) {
    await commit((draft) => { for (const update of updates) { const card = draft.cards.find((x) => x.id === update.id && !x.deletedAt); if (!card) throw Object.assign(new Error('Card not found'), { code: 'not_found' }); Object.assign(card, clone(update), { id: card.id, projectId: card.projectId, updatedAt: nowIso() }) } }); return updates.map((x) => x.id)
  }
  async function connectCards(inputs) {
    if (activeRelationships.value.length + inputs.filter((x) => !x.id).length > LIMITS.relationships) throw Object.assign(new Error('Relationship limit reached'), { code: 'limit_reached' })
    const changed = []
    await commit((draft) => { for (const input of inputs) { if (!draft.cards.some((x) => x.id === input.source && !x.deletedAt) || !draft.cards.some((x) => x.id === input.target && !x.deletedAt)) throw Object.assign(new Error('Relationship endpoint not found'), { code: 'not_found' }); let rel = input.id && draft.relationships.find((x) => x.id === input.id); if (!rel) { rel = { id: uuid(), projectId: draft.project.id, createdAt: nowIso(), deletedAt: null }; draft.relationships.push(rel) } Object.assign(rel, { source: input.source, target: input.target, label: String(input.label || 'influences').slice(0, 100), description: String(input.description || '').slice(0, 2000), direction: input.direction || 'forward', color: input.color || '#8b5a3c', updatedAt: nowIso() }); changed.push(rel) } }); return changed
  }
  async function manageGroups(inputs) {
    if (activeGroups.value.length + inputs.filter((x) => x.action === 'create').length > LIMITS.groups) throw Object.assign(new Error('Group limit reached'), { code: 'limit_reached' })
    const changed = []
    await commit((draft) => { for (const input of inputs) { if (input.action === 'create') { const group = { id: uuid(), projectId: draft.project.id, title: String(input.title || 'New group').slice(0, 200), color: input.color || '#8b5a3c', memberIds: input.memberIds || [], position: input.position || { x: 80, y: 80 }, size: input.size || { width: 640, height: 420 }, createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null }; draft.groups.push(group); changed.push(group) } else { const group = draft.groups.find((x) => x.id === input.id && !x.deletedAt); if (!group) throw Object.assign(new Error('Group not found'), { code: 'not_found' }); if (input.action === 'delete') group.deletedAt = nowIso(); else Object.assign(group, clone(input.patch || {}), { updatedAt: nowIso() }); changed.push(group) } } }); return changed
  }
  async function deleteElements(ids) { await commit((draft) => { const when = nowIso(); for (const name of ['cards', 'relationships', 'groups']) for (const item of draft[name]) if (ids.includes(item.id)) item.deletedAt = when; for (const rel of draft.relationships) if (ids.includes(rel.source) || ids.includes(rel.target)) rel.deletedAt = when }); selection.value = selection.value.filter((id) => !ids.includes(id)) }
  async function addCustomType(input) {
    if ((input.fields || []).length > LIMITS.customFields) throw Object.assign(new Error('Custom field limit reached'), { code: 'limit_reached' })
    const type = { id: uuid(), projectId: bundle.value.project.id, typeId: `custom-${uuid()}`, displayName: String(input.displayName || 'Custom').slice(0, 60), icon: input.icon || 'Sparkles', color: input.color || '#8b5a3c', fields: (input.fields || []).map((field) => String(field).slice(0, 60)), createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null }
    await commit((draft) => draft.cardTypes.push(type)); return type
  }
  async function manageMedia({ action, cardId, blob, mime }) {
    const card = activeCards.value.find((x) => x.id === cardId); if (!card) throw Object.assign(new Error('Card not found'), { code: 'not_found' })
    if (blob && blob.size > LIMITS.imageBytes) throw Object.assign(new Error('Image exceeds 8 MB'), { code: 'invalid_input' })
    if (blob && !['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mime)) throw Object.assign(new Error('Unsupported image type'), { code: 'invalid_input' })
    if (action !== 'remove' && bundle.value.media.length >= LIMITS.images && !card.imageId) throw Object.assign(new Error('Image limit reached'), { code: 'limit_reached' })
    await commit((draft) => {
      if (action === 'remove') { card.imageId = null; return }
      let media = card.imageId && draft.media.find((x) => x.id === card.imageId)
      if (!media) { media = { id: uuid(), projectId: draft.project.id, createdAt: nowIso() }; draft.media.push(media); card.imageId = media.id }
      Object.assign(media, { blob, mime, size: blob.size, updatedAt: nowIso() })
    })
    return card.imageId
  }
  async function arrange(mode, ids = []) { await commit((draft) => { const changes = calculateLayout(mode, draft.cards, draft.relationships.map((rel) => ({ ...rel, sourceId: rel.source, targetId: rel.target })), ids.length ? ids : null); for (const change of changes) { const card = draft.cards.find((x) => x.id === change.id); if (card) card.position = change.position } }); }
  async function setTheme(value) { theme.value = value; await setPreference('theme', value) }
  async function setLocale(value) { locale.value = value; await setPreference('locale', value) }
  function select(ids) { selection.value = Array.isArray(ids) ? ids : [ids] }
  function dispose() { channel?.close() }

  return { ready, projects, bundle, selection, selected, activeCards, activeRelationships, activeGroups, lenses, saveState, error, theme, locale, undoStack, redoStack, externalRevision, initialize, refreshProjects, openProject, createNewProject, duplicateProject, patchProject, purgeProject, commit, undo, redo, addCards, updateCards, connectCards, manageGroups, addCustomType, deleteElements, manageMedia, arrange, setTheme, setLocale, select, dispose }
})
