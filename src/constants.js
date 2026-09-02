export const LIMITS = Object.freeze({ projects: 50, cards: 500, relationships: 1000, groups: 100, images: 30, imageBytes: 8 * 1024 * 1024, title: 200, body: 20000, tags: 20, customFields: 12 })

export const CARD_TYPES = Object.freeze([
  { id: 'premise', color: '#8b5a3c', icon: 'Sparkles', fields: ['summary', 'promise', 'centralQuestion'] },
  { id: 'character', color: '#9c4f64', icon: 'UserRound', fields: ['role', 'desire', 'fear', 'stakes', 'secret'] },
  { id: 'location', color: '#3d7666', icon: 'MapPin', fields: ['significance', 'atmosphere', 'constraints'] },
  { id: 'conflict', color: '#b34d3f', icon: 'Swords', fields: ['opposingForces', 'stakes', 'escalation', 'resolution'] },
  { id: 'secret', color: '#76568f', icon: 'KeyRound', fields: ['holder', 'consequence', 'plannedReveal'] },
  { id: 'rule', color: '#50709a', icon: 'Scale', fields: ['rule', 'cost', 'exception'] },
  { id: 'beat', color: '#b0772f', icon: 'Milestone', fields: ['phase', 'sequence', 'purpose', 'outcome'] },
  { id: 'note', color: '#6b7280', icon: 'StickyNote', fields: [] },
])

export const RELATIONSHIP_PRESETS = ['influences', 'opposes', 'wants', 'hidesFrom', 'causes', 'reveals', 'occursAt', 'belongsTo']
export const TYPE_MAP = Object.freeze(Object.fromEntries(CARD_TYPES.map((type) => [type.id, type])))
export const nowIso = () => new Date().toISOString()
export const uuid = () => crypto.randomUUID()
export const cleanText = (value, limit = LIMITS.body) => String(value ?? '').trim().slice(0, limit)

export const createCard = (input = {}, index = 0) => {
  const typeId = TYPE_MAP[input.typeId] ? input.typeId : (input.typeId || 'note')
  const type = TYPE_MAP[typeId] || CARD_TYPES[7]
  const time = nowIso()
  return {
    id: input.id || uuid(), projectId: input.projectId, typeId,
    title: cleanText(input.title || `Untitled ${typeId}`, LIMITS.title), body: cleanText(input.body),
    fields: Object.fromEntries(Object.entries(input.fields || {}).slice(0, LIMITS.customFields).map(([key, value]) => [cleanText(key, 60), cleanText(value, 4000)])),
    tags: [...new Set((input.tags || []).map((tag) => cleanText(tag, 40)).filter(Boolean))].slice(0, LIMITS.tags),
    imageId: input.imageId || null, color: input.color || type.color,
    position: input.position || { x: 160 + (index % 4) * 300, y: 120 + Math.floor(index / 4) * 230 },
    size: input.size || { width: 260, height: 180 }, collapsed: Boolean(input.collapsed),
    createdAt: input.createdAt || time, updatedAt: time, deletedAt: null,
  }
}

export const createProject = (input = {}) => {
  const time = nowIso()
  return {
    id: input.id || uuid(), schemaVersion: 1, revision: 1,
    title: cleanText(input.title || 'Untitled observatory', LIMITS.title),
    premise: cleanText(input.premise), createdAt: time, updatedAt: time,
    archivedAt: null, deletedAt: null, thumbnail: null,
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}
