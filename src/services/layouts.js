const CARD_W = 260, CARD_H = 180, GAP_X = 80, GAP_Y = 70
const active = (cards) => cards.filter((card) => !card.deletedAt)

export function tidyLayout(cards, selectedIds = null) {
  const targets = active(cards).filter((card) => !selectedIds || selectedIds.includes(card.id))
  const occupied = active(cards).filter((card) => selectedIds && !selectedIds.includes(card.id)).map((card) => card.position)
  return targets.map((card, index) => {
    let col = index % 4, row = Math.floor(index / 4), position
    do { position = { x: 100 + col * (CARD_W + GAP_X), y: 100 + row * (CARD_H + GAP_Y) }; col++; if (col > 5) { col = 0; row++ } }
    while (occupied.some((point) => Math.abs(point.x - position.x) < CARD_W && Math.abs(point.y - position.y) < CARD_H))
    return { id: card.id, position }
  })
}

export function constellationLayout(cards, relationships = []) {
  const list = active(cards)
  const types = [...new Set(list.map((card) => card.typeId))]
  const hubs = new Map(types.map((type, index) => [type, {
    x: 100 + (index % 4) * 660,
    y: 100 + Math.floor(index / 4) * 690,
  }]))
  return list.map((card) => {
    const siblings = list.filter((entry) => entry.typeId === card.typeId)
    const local = siblings.findIndex((entry) => entry.id === card.id)
    const hub = hubs.get(card.typeId)
    const linked = relationships.filter((edge) => edge.sourceId === card.id || edge.targetId === card.id).length
    return { id: card.id, position: {
      x: hub.x + (local % 2) * (CARD_W + GAP_X) - Math.min(linked, 4) * 3,
      y: hub.y + Math.floor(local / 2) * (CARD_H + GAP_Y) + Math.min(linked, 4) * 3,
    } }
  })
}

export function storyFlowLayout(cards, relationships = []) {
  const list = active(cards), beats = list.filter((card) => card.typeId === 'beat').sort((a, b) => Number(a.fields?.sequence || 0) - Number(b.fields?.sequence || 0))
  const positions = new Map(beats.map((beat, index) => [beat.id, { x: 120 + index * 330, y: 430 }]))
  const support = list.filter((card) => card.typeId !== 'beat')
  support.forEach((card, index) => {
    const edge = relationships.find((entry) => entry.sourceId === card.id && positions.has(entry.targetId) || entry.targetId === card.id && positions.has(entry.sourceId))
    const beatId = edge && (positions.has(edge.sourceId) ? edge.sourceId : edge.targetId)
    const base = positions.get(beatId) || { x: 120 + (index % 5) * 300, y: 100 + Math.floor(index / 5) * 650 }
    positions.set(card.id, { x: base.x + ((index % 2) ? 70 : -70), y: base.y + ((index % 2) ? 250 : -250) })
  })
  return list.map((card) => ({ id: card.id, position: positions.get(card.id) }))
}

export const arrange = (mode, cards, relationships, selectedIds) => mode === 'constellation'
  ? constellationLayout(cards, relationships) : mode === 'story_flow'
    ? storyFlowLayout(cards, relationships) : tidyLayout(cards, selectedIds)
