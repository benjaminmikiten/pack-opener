import { CollectionEntry, PackResult } from '@/types'

const STORAGE_KEY = 'pokemon-pack-opener-collection'

export function getCollection(): CollectionEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data) as CollectionEntry[]
  } catch {
    return []
  }
}

export function addPackToCollection(pack: PackResult): void {
  if (typeof window === 'undefined') return

  const existing = getCollection()
  const newEntries: CollectionEntry[] = pack.cards.map((card) => ({
    card,
    setId: pack.setId,
    openedAt: pack.openedAt,
  }))

  const updated = [...existing, ...newEntries]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearCollection(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
