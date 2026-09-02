import { createCard, createProject, nowIso, uuid } from '../constants.js'
import { constellationLayout } from '../services/layouts.js'

export const EXAMPLE_VERSION = 3
export const EXAMPLE_PROJECT_TITLE = 'Caldris — Children of the Alignment'
export const LEGACY_EXAMPLE_TITLE = 'The Glass Cartographer'
export const LEGACY_EXAMPLE_PREMISE = 'A mapmaker discovers that every road she erases vanishes from the world—and one missing road leads to her brother.'

export function createExampleBundle() {
  const project = createProject({
    title: EXAMPLE_PROJECT_TITLE,
    premise: 'In the frontier world of Caldris, a rare celestial Alignment grants extraordinary powers to children—while an expanding organisation hunts them to extract and weaponise their Gifts.',
  })

  const definitions = [
    ['premise', 'Children of the Alignment', 'The central promise of Caldris.', {
      summary: project.premise,
      promise: 'Frontier fantasy where spiritual traditions collide with colonial science and weaponised magic.',
      centralQuestion: 'Can gifted children survive forces determined to classify, control, and consume their power?',
    }, ['world', 'alignment']],
    ['character', 'Maji', 'A twelve-year-old girl whose prophetic dreams and protective white vapour reveal a rare connection to the spirit world.', {
      role: 'Spirit-touched protagonist',
      desire: 'Survive the hunt and understand her bond with the spirits.',
      fear: 'Losing Chetan and being unable to call the spirits when they are needed.',
      stakes: 'Her freedom, her people, and a Gift the Organisation does not understand.',
      secret: 'Her spirit affinity does not fit the Organisation’s known classifications.',
    }, ['gifted', 'Maji']],
    ['character', 'Jon Wolff', 'A scarred, disciplined hunter serving the Organisation. His cruelty is interrupted by flashes of conscience that will reshape his bond with Maji.', {
      role: 'Antagonist who becomes a conflicted mentor',
      desire: 'Complete the Organisation’s mission and master the power it has placed in his hands.',
      fear: 'That conscience will make him weak—or prove his cause indefensible.',
      stakes: 'His standing, his purpose, and the lives of the children he hunts.',
      secret: 'He will ultimately remain in Maji’s life as a spirit wolf after his death.',
    }, ['hunter', 'organisation']],
    ['character', 'Chetan', 'Maji’s older brother and protector: vigilant, reassuring with her, and practical under threat.', {
      role: 'Older brother and protector',
      desire: 'Keep Maji and their travelling community safe.',
      fear: 'Failing to protect his sister from a danger he cannot see.',
      stakes: 'His family and the survival of the laager.',
      secret: 'He understands more about Maji’s connection to the spirits than he says.',
    }, ['family', 'protector']],
    ['character', 'The Flameborn Child', 'A gifted infant whose uncontrolled heat devastates a village. His captured manifestation becomes the foundation of a new weapon.', {
      role: 'Weaponised gifted child',
      desire: 'Survival before he is old enough to choose anything else.',
      fear: 'Isolation and the people who treat him as a resource.',
      stakes: 'His life, agency, and a future shaped by extraction.',
      secret: 'The Organisation successfully distils his fire into crystal ammunition.',
    }, ['gifted', 'flameborn']],
    ['location', "Maji's Laager", 'A fortified circle of wagons in a grassy valley, communal and protective until the surrounding hills become perfect firing positions.', {
      significance: 'The opening location of Maji, where Jon’s attack reveals her spirit powers and leads to her abduction.',
      atmosphere: 'Bonfire light and a star-filled sky giving way to gunfire, smoke, and supernatural flame.',
      constraints: 'The wagons provide cover inside the camp but leave it exposed to attackers on higher ground.',
    }, ['Maji', 'frontier']],
    ['location', 'Flameborn Village', 'An abandoned settlement scorched by the uncontrolled heat of the gifted infant trapped at its centre.', {
      significance: 'Where Jon discovers the Flameborn Child years before the attack on Maji’s laager.',
      atmosphere: 'Smouldering timber, choking dust, dead vegetation, and furnace-like heat.',
      constraints: 'The heat makes approach almost impossible; only a stone structure remains intact.',
    }, ['Flameborn', 'ruins']],
    ['conflict', 'The Gifted Hunts', 'The Organisation identifies and captures gifted children while frontier communities struggle to hide and protect them.', {
      opposingForces: 'Gifted children and their communities versus Jon Wolff and the Organisation.',
      stakes: 'Children are stripped of freedom and power; their Gifts become colonial weapons.',
      escalation: 'Registries become hunts, extraction becomes standardised, and distilled manifestations enter the arsenal.',
      resolution: 'Unresolved: Maji’s unclassifiable spirit affinity may challenge the system built to contain her.',
    }, ['organisation', 'gifted']],
    ['secret', 'What Distillation Costs', 'The Organisation presents Distillation as controlled research while hiding the severe harm done to each living bearer.', {
      holder: 'The Organisation and its researchers',
      consequence: 'Every new weapon proves that a child’s Gift can be separated, stored, and used by someone else.',
      plannedReveal: 'Jon’s crystal Flameborn shell reveals the truth during the attack on the laager.',
    }, ['distillation', 'weapon']],
    ['rule', 'The Alignment', 'A rare alignment of sun and planet casts a second, mystical light across Caldris.', {
      rule: 'Children exposed to the Alignment’s light can develop persistent supernatural Gifts.',
      cost: 'The event marks gifted children for reverence, fear, registration, or exploitation.',
      exception: 'Manifestations differ radically by individual and may resist every known category.',
    }, ['celestial', 'gift']],
    ['rule', 'The Gift', 'Magic belongs to living people touched as children by the Alignment, persisting as they grow older.', {
      rule: 'Each bearer manifests an individual power, from spirit affinity to extraordinary fire and heat.',
      cost: 'Costs vary by manifestation and remain incompletely understood.',
      exception: 'Training, limits, age boundaries, and the full range of manifestations remain unresolved.',
    }, ['magic', 'gifted']],
    ['rule', 'Distillation', 'An artificial process that extracts, refines, and stores a Gift outside its bearer.', {
      rule: 'Extracted manifestations can be contained in refined materials such as crystal and deployed by others.',
      cost: 'The extraction severely harms the gifted person it is taken from.',
      exception: 'It is unknown whether every manifestation can be distilled—or whether Maji’s spirit affinity can be contained at all.',
    }, ['science', 'weapon']],
    ['beat', 'A wolf followed by fire', 'Maji wakes from a warning dream and tells Chetan that the wolf from the hill was followed by fire.', {
      phase: 'Warning', sequence: '1', purpose: 'Foreshadow Jon’s arrival and establish Maji’s prophetic connection.', outcome: 'Chetan alerts the laager and asks Maji to call the spirits.',
    }, ['Maji', 'Maji story']],
    ['beat', 'Jon prepares the ambush', 'From the high grass, Jon loads a transparent crystal shell with a small flame dancing inside.', {
      phase: 'Attack', sequence: '2', purpose: 'Reveal that the Organisation has weaponised a child’s Gift.', outcome: 'Jon’s men open fire from the hills above the wagons.',
    }, ['Jon Wolff', 'Maji story']],
    ['beat', 'Maji calls the spirits', 'As a bullet flies toward Chetan, Maji’s trance releases white vapour that stops it in mid-air.', {
      phase: 'Attack', sequence: '3', purpose: 'Make Maji’s spirit affinity visible under mortal pressure.', outcome: 'The vapour spreads toward the laager’s defenders, briefly shielding them.',
    }, ['Maji', 'Chetan']],
    ['beat', 'The laager burns', 'Jon unleashes the distilled Flameborn shell, turning the circle of wagons into fire and shrapnel.', {
      phase: 'Catastrophe', sequence: '4', purpose: 'Bring the system of extraction directly against Maji’s community.', outcome: 'The laager falls while Maji remains protected inside smoke and flame.',
    }, ['Jon Wolff', 'Flameborn']],
    ['beat', 'Maji is taken', 'Her trance breaks. Chetan does not answer, and the wolf from her dreams walks out of the smoke.', {
      phase: 'Aftermath', sequence: '5', purpose: 'Complete the abduction and bind Maji’s future to Jon Wolff.', outcome: 'Jon carries Maji away from the ruined laager.',
    }, ['Maji', 'Jon Wolff']],
  ]

  const cards = definitions.map(([typeId, title, body, fields, tags], index) => createCard({ projectId: project.id, typeId, title, body, fields, tags }, index))
  const byTitle = Object.fromEntries(cards.map((card) => [card.title, card]))
  const links = [
    ['Children of the Alignment', 'The Alignment', 'belongsTo'],
    ['The Alignment', 'The Gift', 'causes'],
    ['The Gift', 'Maji', 'influences'],
    ['The Gift', 'The Flameborn Child', 'influences'],
    ['The Organisation', 'Distillation', 'wants'],
    ['The Gifted Hunts', 'Maji', 'opposes'],
    ['The Gifted Hunts', 'The Flameborn Child', 'opposes'],
    ['Jon Wolff', 'The Gifted Hunts', 'belongsTo'],
    ['Chetan', 'Maji', 'wants'],
    ["Maji's Laager", 'A wolf followed by fire', 'occursAt'],
    ['A wolf followed by fire', 'Jon prepares the ambush', 'causes'],
    ['Jon prepares the ambush', 'Maji calls the spirits', 'causes'],
    ['Maji calls the spirits', 'The laager burns', 'causes'],
    ['The laager burns', 'Maji is taken', 'causes'],
    ['What Distillation Costs', 'The laager burns', 'reveals'],
    ['The Flameborn Child', 'Distillation', 'causes'],
    ['Flameborn Village', 'The Flameborn Child', 'belongsTo'],
    ['Maji is taken', 'Jon Wolff', 'reveals'],
  ]
  const relationshipTitles = new Set(cards.map((card) => card.title))
  const organisation = createCard({ projectId: project.id, typeId: 'note', title: 'The Organisation', body: 'An unnamed military-scientific power that hunts gifted children, develops Distillation, and equips agents such as Jon Wolff.', tags: ['organisation', 'antagonist'] }, cards.length)
  cards.push(organisation)
  relationshipTitles.add(organisation.title)
  byTitle[organisation.title] = organisation

  const relationships = links.filter(([source, target]) => relationshipTitles.has(source) && relationshipTitles.has(target)).map(([source, target, label]) => ({
    id: uuid(), projectId: project.id, source: byTitle[source].id, target: byTitle[target].id,
    direction: 'forward', label, description: '', color: '#8b5a3c', createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null,
  }))
  const positions = new Map(constellationLayout(cards, relationships.map((relationship) => ({ ...relationship, sourceId: relationship.source, targetId: relationship.target }))).map((entry) => [entry.id, entry.position]))
  for (const card of cards) card.position = positions.get(card.id) || card.position
  return { project, cards, relationships, groups: [], cardTypes: [], media: [] }
}
