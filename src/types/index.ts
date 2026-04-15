export type CardSlot = 'energy' | 'common' | 'uncommon' | 'rare' | 'holo'

export type SetId = 'base1' | 'base2' | 'base3' | 'base4' | 'base5'

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
