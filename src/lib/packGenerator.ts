import { PokemonCard, SetId, CardSlot } from '@/types'
import { fetchSetCards } from './api'
import { SETS_WITHOUT_ENERGY } from './sets'

function isEnergyCard(card: PokemonCard): boolean {
  if (!card.rarity && card.supertype === 'Energy' && card.subtypes?.includes('Basic')) {
    return true
  }
  return false
}

function getCardSlot(card: PokemonCard): CardSlot | null {
  if (isEnergyCard(card)) return 'energy'

  switch (card.rarity) {
    case 'Common':
      return 'common'
    case 'Uncommon':
      return 'uncommon'
    case 'Rare':
      return 'rare'
    case 'Rare Holo':
    case 'Rare Secret':
      return 'holo'
    default:
      return null
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count)
}

export async function generatePack(setId: SetId): Promise<PokemonCard[]> {
  const setCards = await fetchSetCards(setId)

  let energyPool: PokemonCard[]
  if (SETS_WITHOUT_ENERGY.includes(setId)) {
    const base1Cards = await fetchSetCards('base1')
    energyPool = base1Cards.filter((c) => isEnergyCard(c))
  } else {
    energyPool = setCards.filter((c) => isEnergyCard(c))
  }

  const commons = setCards.filter((c) => c.rarity === 'Common')
  const uncommons = setCards.filter((c) => c.rarity === 'Uncommon')
  const rares = setCards.filter((c) => c.rarity === 'Rare')
  const holos = setCards.filter(
    (c) => c.rarity === 'Rare Holo' || c.rarity === 'Rare Secret'
  )

  // Pick energy
  const energyCard = pickRandom(energyPool.length > 0 ? energyPool : setCards, 1)[0]

  // Pick 6 commons (no duplicates)
  const commonCards = pickRandom(commons, Math.min(6, commons.length))

  // Pick 3 uncommons (no duplicates)
  const uncommonCards = pickRandom(uncommons, Math.min(3, uncommons.length))

  // Rare slot: 33% holo, 67% rare
  let rareCard: PokemonCard
  const isHolo = Math.random() < 0.33

  if (isHolo && holos.length > 0) {
    rareCard = pickRandom(holos, 1)[0]
  } else if (rares.length > 0) {
    rareCard = pickRandom(rares, 1)[0]
  } else if (holos.length > 0) {
    rareCard = pickRandom(holos, 1)[0]
  } else {
    rareCard = pickRandom(setCards, 1)[0]
  }

  // Assign slots and build reveal order: energy first, then commons, uncommons, rare last
  const withSlot = (card: PokemonCard, slot: CardSlot): PokemonCard => ({
    ...card,
    slot,
  })

  const pack: PokemonCard[] = [
    withSlot(energyCard, 'energy'),
    ...commonCards.map((c) => withSlot(c, 'common')),
    ...uncommonCards.map((c) => withSlot(c, 'uncommon')),
    withSlot(rareCard, isHolo && holos.includes(rareCard) ? 'holo' : getCardSlot(rareCard) || 'rare'),
  ]

  return pack
}
