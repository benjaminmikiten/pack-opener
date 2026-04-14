import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generatePack } from '../packGenerator'
import * as api from '../api'

// Build a realistic mock card pool
function makeCard(
  id: string,
  rarity: string | undefined,
  supertype = 'Pokémon',
  subtypes: string[] = []
) {
  return {
    id,
    name: id,
    rarity,
    supertype,
    subtypes,
    images: { small: `https://example.com/${id}.png`, large: `https://example.com/${id}_large.png` },
  }
}

const energyCards = Array.from({ length: 10 }, (_, i) =>
  makeCard(`energy-${i}`, undefined, 'Energy', ['Basic'])
)
const commonCards = Array.from({ length: 20 }, (_, i) =>
  makeCard(`common-${i}`, 'Common')
)
const uncommonCards = Array.from({ length: 15 }, (_, i) =>
  makeCard(`uncommon-${i}`, 'Uncommon')
)
const rareCards = Array.from({ length: 8 }, (_, i) =>
  makeCard(`rare-${i}`, 'Rare')
)
const holoCards = Array.from({ length: 5 }, (_, i) =>
  makeCard(`holo-${i}`, 'Rare Holo')
)

const fullSetCards = [...energyCards, ...commonCards, ...uncommonCards, ...rareCards, ...holoCards]
const setWithoutEnergy = [...commonCards, ...uncommonCards, ...rareCards, ...holoCards]

describe('generatePack', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns exactly 11 cards', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const pack = await generatePack('base1')
    expect(pack).toHaveLength(11)
  })

  it('has exactly 1 energy card in slot position 0', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const pack = await generatePack('base1')
    const energySlotCards = pack.filter((c) => c.slot === 'energy')
    expect(energySlotCards).toHaveLength(1)
    expect(pack[0].slot).toBe('energy')
  })

  it('has exactly 6 common cards', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const pack = await generatePack('base1')
    const commons = pack.filter((c) => c.slot === 'common')
    expect(commons).toHaveLength(6)
  })

  it('has exactly 3 uncommon cards', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const pack = await generatePack('base1')
    const uncommons = pack.filter((c) => c.slot === 'uncommon')
    expect(uncommons).toHaveLength(3)
  })

  it('has exactly 1 rare or holo card in the last position', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const pack = await generatePack('base1')
    const lastCard = pack[pack.length - 1]
    expect(['rare', 'holo']).toContain(lastCard.slot)

    const rareHoloCards = pack.filter((c) => c.slot === 'rare' || c.slot === 'holo')
    expect(rareHoloCards).toHaveLength(1)
  })

  it('has no duplicate card ids among non-energy cards', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const pack = await generatePack('base1')
    const nonEnergyIds = pack.slice(1).map((c) => c.id)
    const unique = new Set(nonEnergyIds)
    expect(unique.size).toBe(nonEnergyIds.length)
  })

  it('has roughly 33% holo chance over many iterations', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const iterations = 300
    let holoCount = 0

    for (let i = 0; i < iterations; i++) {
      const pack = await generatePack('base1')
      const lastCard = pack[pack.length - 1]
      if (lastCard.slot === 'holo') holoCount++
    }

    const holoRate = holoCount / iterations
    // Should be roughly 33% ± 10%
    expect(holoRate).toBeGreaterThan(0.20)
    expect(holoRate).toBeLessThan(0.50)
  })

  it('fetches energy from base1 for sets without energy (base2)', async () => {
    const fetchSpy = vi.spyOn(api, 'fetchSetCards').mockImplementation(async (setId) => {
      if (setId === 'base1') return fullSetCards
      return setWithoutEnergy
    })

    const pack = await generatePack('base2')

    // Should have called fetchSetCards with both 'base2' and 'base1'
    expect(fetchSpy).toHaveBeenCalledWith('base2')
    expect(fetchSpy).toHaveBeenCalledWith('base1')

    // Energy card should come from base1's energy pool
    const energyCard = pack[0]
    expect(energyCard.slot).toBe('energy')
    expect(energyCard.id).toMatch(/^energy-/)
  })

  it('fetches energy from base1 for base3', async () => {
    const fetchSpy = vi.spyOn(api, 'fetchSetCards').mockImplementation(async (setId) => {
      if (setId === 'base1') return fullSetCards
      return setWithoutEnergy
    })

    await generatePack('base3')
    expect(fetchSpy).toHaveBeenCalledWith('base1')
  })

  it('fetches energy from base1 for base5', async () => {
    const fetchSpy = vi.spyOn(api, 'fetchSetCards').mockImplementation(async (setId) => {
      if (setId === 'base1') return fullSetCards
      return setWithoutEnergy
    })

    await generatePack('base5')
    expect(fetchSpy).toHaveBeenCalledWith('base1')
  })

  it('reveals cards in correct order: energy → commons → uncommons → rare/holo', async () => {
    vi.spyOn(api, 'fetchSetCards').mockResolvedValue(fullSetCards)

    const pack = await generatePack('base1')

    expect(pack[0].slot).toBe('energy')
    for (let i = 1; i <= 6; i++) {
      expect(pack[i].slot).toBe('common')
    }
    for (let i = 7; i <= 9; i++) {
      expect(pack[i].slot).toBe('uncommon')
    }
    expect(['rare', 'holo']).toContain(pack[10].slot)
  })
})
