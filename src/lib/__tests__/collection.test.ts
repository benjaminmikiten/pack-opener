import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCollection, addPackToCollection, clearCollection } from '../collection'
import { PackResult } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

Object.defineProperty(global, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
})

const mockPack: PackResult = {
  setId: 'base1',
  openedAt: '2024-01-01T00:00:00.000Z',
  cards: [
    {
      id: 'energy-1',
      name: 'Fire Energy',
      supertype: 'Energy',
      subtypes: ['Basic'],
      images: { small: 'https://example.com/energy.png', large: 'https://example.com/energy_l.png' },
      slot: 'energy',
    },
    {
      id: 'common-1',
      name: 'Caterpie',
      rarity: 'Common',
      supertype: 'Pokémon',
      subtypes: ['Basic'],
      images: { small: 'https://example.com/caterpie.png', large: 'https://example.com/caterpie_l.png' },
      slot: 'common',
    },
  ],
}

describe('collection', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getCollection', () => {
    it('returns empty object when localStorage is empty', () => {
      const result = getCollection()
      expect(result).toEqual({})
    })

    it('returns empty object when localStorage has invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('not-valid-json')
      const result = getCollection()
      expect(result).toEqual({})
    })
  })

  describe('addPackToCollection', () => {
    it('persists cards to localStorage', () => {
      addPackToCollection(mockPack)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('stored data is retrievable via getCollection', () => {
      addPackToCollection(mockPack)

      // Simulate what getCollection reads back
      const storedValue = localStorageMock.setItem.mock.calls[0][1] as string
      localStorageMock.getItem.mockReturnValueOnce(storedValue)
      // second call is for VERSION_KEY
      localStorageMock.getItem.mockReturnValueOnce('2')

      const result = getCollection()
      expect(Object.keys(result)).toHaveLength(mockPack.cards.length)
      expect(result['energy-1'].card.id).toBe('energy-1')
      expect(result['energy-1'].setId).toBe('base1')
      expect(result['energy-1'].firstOpenedAt).toBe(mockPack.openedAt)
    })

    it('increments count when same card added again', () => {
      addPackToCollection(mockPack)
      const firstStored = localStorageMock.setItem.mock.calls[0][1] as string
      localStorageMock.getItem.mockReturnValue(firstStored)

      const secondPack: PackResult = { ...mockPack, cards: [mockPack.cards[0]] }
      addPackToCollection(secondPack)

      const secondStored = localStorageMock.setItem.mock.calls[2][1] as string
      localStorageMock.getItem.mockReturnValueOnce(secondStored)
      localStorageMock.getItem.mockReturnValueOnce('2')

      const result = getCollection()
      // Still 2 unique cards, but energy-1 count is 2
      expect(Object.keys(result)).toHaveLength(mockPack.cards.length)
      expect(result['energy-1'].count).toBe(2)
    })

    it('stores correct setId for each entry', () => {
      addPackToCollection(mockPack)
      const stored = localStorageMock.setItem.mock.calls[0][1] as string
      localStorageMock.getItem.mockReturnValueOnce(stored)
      localStorageMock.getItem.mockReturnValueOnce('2')

      const result = getCollection()
      Object.values(result).forEach((record) => {
        expect(record.setId).toBe('base1')
      })
    })
  })

  describe('clearCollection', () => {
    it('clears localStorage', () => {
      addPackToCollection(mockPack)
      clearCollection()
      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })

    it('getCollection returns empty after clear', () => {
      // Simulate already having data, then clear
      addPackToCollection(mockPack)
      clearCollection()
      // After remove, getItem returns null
      localStorageMock.getItem.mockReturnValueOnce(null)
      const result = getCollection()
      expect(result).toEqual({})
    })
  })
})
