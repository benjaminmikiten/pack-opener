import { PokemonCard, SetId } from '@/types'

const API_BASE = 'https://api.pokemontcg.io/v2'
const cardCache = new Map<SetId, PokemonCard[]>()

export async function fetchSetCards(setId: SetId): Promise<PokemonCard[]> {
  if (cardCache.has(setId)) {
    return cardCache.get(setId)!
  }

  const url = `${API_BASE}/cards?q=set.id:${setId}&pageSize=250&select=id,name,rarity,supertype,subtypes,images`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch cards for set ${setId}: ${response.statusText}`)
  }

  const data = await response.json()
  const cards: PokemonCard[] = data.data || []

  cardCache.set(setId, cards)
  return cards
}

export function clearCardCache() {
  cardCache.clear()
}
