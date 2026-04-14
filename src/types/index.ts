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
}

export interface SetInfo {
  id: SetId
  name: string
  accent: string
  gradient: string[]
  logoUrl: string
  price: number
}

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
