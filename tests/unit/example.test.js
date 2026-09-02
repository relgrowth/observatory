import { describe, expect, it } from 'vitest'
import { createExampleBundle, EXAMPLE_PROJECT_TITLE, EXAMPLE_VERSION } from '../../src/data/example.js'

describe('Caldris example observatory', () => {
  it('ships a connected, structured Caldris board', () => {
    const bundle = createExampleBundle()
    expect(EXAMPLE_VERSION).toBe(2)
    expect(bundle.project.title).toBe(EXAMPLE_PROJECT_TITLE)
    expect(bundle.cards.length).toBeGreaterThanOrEqual(18)
    expect(bundle.relationships.length).toBeGreaterThanOrEqual(15)
    expect(bundle.cards.find((card) => card.title === 'Maji')?.fields.desire).toContain('spirits')
    expect(bundle.cards.find((card) => card.title === 'Jon Wolff')?.fields.role).toContain('Antagonist')
    expect(bundle.cards.filter((card) => card.typeId === 'beat').map((card) => card.fields.sequence)).toEqual(['1', '2', '3', '4', '5'])
    expect(bundle.relationships.every((relationship) => bundle.cards.some((card) => card.id === relationship.source) && bundle.cards.some((card) => card.id === relationship.target))).toBe(true)
  })
})
