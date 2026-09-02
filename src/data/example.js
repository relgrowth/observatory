import { createCard, createProject, nowIso, uuid } from '../constants.js'

export function createExampleBundle() {
  const project = createProject({ title: 'The Glass Cartographer', premise: 'A mapmaker discovers that every road she erases vanishes from the world—and one missing road leads to her brother.' })
  const definitions = [
    ['premise', 'A map that edits the world', { summary: project.premise, promise: 'A tactile mystery about memory, maps, and the cost of certainty.', centralQuestion: 'Can Ilyra restore what she erased without unmaking her home?' }],
    ['character', 'Ilyra Venn', { role: 'Mapmaker and reluctant investigator', desire: 'Restore the road to her missing brother', fear: 'That she erased him deliberately', stakes: 'Her city is losing one road each dawn', secret: 'Her maps were made from forbidden glass' }],
    ['character', 'Tomas Reed', { role: 'Courier who remembers vanished places', desire: 'Keep the city connected', fear: 'Being the last person who remembers', stakes: 'Each lost road takes one of his memories' }],
    ['location', 'The Lantern Archive', { significance: 'Holds maps of roads that no longer exist', atmosphere: 'Dust, green glass, and bells heard through walls', constraints: 'Its doors open only at dusk' }],
    ['conflict', 'The city is folding inward', { opposingForces: 'Ilyra versus the Archive’s keeper', stakes: 'Entire districts will become unreachable', escalation: 'The vanished roads begin taking names with them', resolution: 'Ilyra must draw a road that has never existed' }],
    ['secret', 'The erased road chose her', { holder: 'The Archive keeper', consequence: 'Ilyra’s brother crossed willingly', plannedReveal: 'At the midpoint, inside an unlabelled map case' }],
    ['rule', 'Glass maps change reality', { rule: 'A road scraped from glass disappears at sunrise', cost: 'The cartographer loses one memory of the destination', exception: 'A road drawn in reflected moonlight can return once' }],
    ['beat', 'A street disappears', { phase: 'Opening', sequence: '1', purpose: 'Prove the impossible rule', outcome: 'Ilyra finds her own initials on the altered map' }],
    ['beat', 'The archive opens', { phase: 'Middle', sequence: '2', purpose: 'Reveal the larger pattern', outcome: 'Tomas remembers the missing road' }],
    ['beat', 'Draw the impossible road', { phase: 'Ending', sequence: '3', purpose: 'Force the central choice', outcome: 'Ilyra trades her memory of home for a path forward' }],
  ]
  const cards = definitions.map(([typeId, title, fields], index) => createCard({ projectId: project.id, typeId, title, fields }, index))
  const byTitle = Object.fromEntries(cards.map((card) => [card.title, card]))
  const links = [
    ['A map that edits the world', 'Ilyra Venn', 'belongsTo'], ['Ilyra Venn', 'The city is folding inward', 'opposes'],
    ['Tomas Reed', 'Ilyra Venn', 'influences'], ['The erased road chose her', 'The archive opens', 'reveals'],
    ['The Lantern Archive', 'The archive opens', 'occursAt'], ['Glass maps change reality', 'A street disappears', 'causes'],
    ['A street disappears', 'The archive opens', 'causes'], ['The archive opens', 'Draw the impossible road', 'causes'],
  ]
  const relationships = links.map(([from, to, label]) => ({ id: uuid(), projectId: project.id, source: byTitle[from].id, target: byTitle[to].id, direction: 'forward', label, description: '', color: '#8b5a3c', createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null }))
  return { project, cards, relationships, groups: [], cardTypes: [], media: [] }
}
