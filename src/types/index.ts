export type CardSlot = 'energy' | 'common' | 'uncommon' | 'rare' | 'holo'

export type SetId = 'base1' | 'base2' | 'base3' | 'base4' | 'base5' | 'gym1' | 'gym2'

export interface PokemonCard {
  id: string
  name: string
  rarity?: string
  supertype?: string
  subtypes?: string[]
  images: {
    small: string
    large: string
  }
  slot?: CardSlot
  tcgplayer?: {
    prices?: {
      normal?: { market?: number }
      holofoil?: { market?: number }
    }
  }
}

/** Returns the TCGPlayer market price for a card, preferring holofoil over normal. */
export function getMarketPrice(card: PokemonCard): number | undefined {
  const prices = card.tcgplayer?.prices
  if (!prices) return undefined
  const val = prices.holofoil?.market ?? prices.normal?.market
  return typeof val === 'number' ? val : undefined
}

/** PSA grade multipliers applied to market price. No 10s — never give a perfect. */
export const PSA_MULTIPLIERS: Record<number, number> = {
  1: 0.5,
  2: 0.6,
  3: 0.7,
  4: 0.85,
  5: 1.0,
  6: 1.25,
  7: 1.5,
  8: 2.0,
  9: 3.5,
}

export const PSA_GRADE_NAMES: Record<number, string> = {
  1: 'Poor',
  2: 'Good',
  3: 'Very Good',
  4: 'VG-Excellent',
  5: 'Excellent',
  6: 'EX-Mint',
  7: 'Near Mint',
  8: 'NM-Mint',
  9: 'Mint',
}

/** Returns the effective price of a collection record, factoring in PSA grade. */
export function getEffectivePrice(record: { card: PokemonCard; grade?: number }): number | undefined {
  const base = getMarketPrice(record.card)
  if (base === undefined) return undefined
  if (!record.grade) return base
  const multiplier = PSA_MULTIPLIERS[record.grade] ?? 1
  return parseFloat((base * multiplier).toFixed(2))
}

export interface SetInfo {
  id: SetId
  name: string
  accent: string
  gradient: string[]
  logoUrl: string
  price: number
}

export interface CollectionRecord {
  card: PokemonCard
  setId: SetId
  count: number
  firstOpenedAt: string
  lastOpenedAt: string
  /** PSA grade 1–9. When set, count is always 1 and this record lives under a unique graded key. */
  grade?: number
}

export type CollectionStore = Record<string, CollectionRecord>

/** @deprecated Use CollectionRecord + CollectionStore. Kept for v1→v2 migration. */
export interface CollectionEntry {
  card: PokemonCard
  setId: SetId
  openedAt: string
}

export interface PackResult {
  cards: PokemonCard[]
  setId: SetId
  openedAt: string
}
