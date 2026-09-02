import { TYPE_MAP } from '../constants.js'

export function inspectStory({ cards = [], relationships = [], groups = [], media = [] }) {
  const live = cards.filter((card) => !card.deletedAt), edges = relationships.filter((edge) => !edge.deletedAt)
  const linked = new Set(edges.flatMap((edge) => [edge.sourceId, edge.targetId]))
  const issues = []
  const add = (kind, cardIds, messageKey, detail = {}) => issues.push({ id: `${kind}:${cardIds.join(',') || issues.length}`, kind, severity: 'prompt', cardIds, messageKey, detail })
  for (const card of live) {
    if (!linked.has(card.id) && live.length > 1) add('isolated', [card.id], 'lenses.isolated')
    const fields = TYPE_MAP[card.typeId]?.fields || []
    const missing = fields.filter((field) => !String(card.fields?.[field] || '').trim())
    if (missing.length) add('missing_fields', [card.id], 'lenses.missingFields', { fields: missing })
    if (card.typeId === 'character' && !card.fields?.desire) add('motivation', [card.id], 'lenses.motivation')
    if (card.typeId === 'conflict' && (!card.fields?.stakes || !card.fields?.resolution)) add('conflict', [card.id], 'lenses.conflict')
    if (card.typeId === 'secret' && (!card.fields?.holder || !card.fields?.plannedReveal)) add('secret', [card.id], 'lenses.secret')
    if (card.imageId && !media.some((item) => item.id === card.imageId)) add('broken_media', [card.id], 'lenses.brokenMedia')
  }
  const titles = new Map()
  live.forEach((card) => { const key = card.title.toLocaleLowerCase(); titles.set(key, [...(titles.get(key) || []), card.id]) })
  for (const ids of titles.values()) if (ids.length > 1) add('duplicate', ids, 'lenses.duplicate')
  for (const group of groups.filter((item) => !item.deletedAt)) if (!group.cardIds?.some((id) => live.some((card) => card.id === id))) add('empty_group', [], 'lenses.emptyGroup', { groupId: group.id })
  const beats = live.filter((card) => card.typeId === 'beat').sort((a, b) => Number(a.fields?.sequence || 0) - Number(b.fields?.sequence || 0))
  beats.forEach((beat, index) => { if (!beat.fields?.sequence || index && Number(beat.fields.sequence) <= Number(beats[index - 1].fields?.sequence || 0)) add('beat_sequence', [beat.id], 'lenses.beatSequence') })
  return issues
}
