import { CollectionEntry, CollectionRecord, CollectionStore, PackResult, getMarketPrice } from '@/types'

const STORAGE_KEY = 'pokemon-pack-opener-collection'
const VERSION_KEY = 'pokemon-pack-opener-collection-version'
const CURRENT_VERSION = 2

// ─── Migration ────────────────────────────────────────────────────────────────

function migrateV1toV2(raw: CollectionEntry[]): CollectionStore {
  const store: CollectionStore = {}
  for (const entry of raw) {
    const { card, setId, openedAt } = entry
    if (!card?.id) continue
    if (store[card.id]) {
      store[card.id].count += 1
      store[card.id].lastOpenedAt = openedAt
    } else {
      store[card.id] = { card, setId, count: 1, firstOpenedAt: openedAt, lastOpenedAt: openedAt }
    }
  }
  return store
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function readStore(): CollectionStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const version = parseInt(localStorage.getItem(VERSION_KEY) ?? '1', 10)
    const parsed = JSON.parse(raw)
    if (version < CURRENT_VERSION) {
      // One-time migration from flat array
      const migrated = migrateV1toV2(parsed as CollectionEntry[])
      writeStore(migrated)
      return migrated
    }
    return parsed as CollectionStore
  } catch {
    return {}
  }
}

function writeStore(store: CollectionStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION))
  } catch {
    // ignore quota errors
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCollection(): CollectionStore {
  return readStore()
}

export function addPackToCollection(pack: PackResult): void {
  const store = readStore()
  const now = pack.openedAt
  for (const card of pack.cards) {
    if (!card.id) continue
    if (store[card.id]) {
      store[card.id].count += 1
      store[card.id].lastOpenedAt = now
      store[card.id].card = card // keep price data fresh
    } else {
      store[card.id] = {
        card,
        setId: pack.setId,
        count: 1,
        firstOpenedAt: now,
        lastOpenedAt: now,
      }
    }
  }
  writeStore(store)
}

/** Removes the given card IDs from the collection and returns total market value sold. */
export function sellCards(cardIds: string[]): { store: CollectionStore; totalValue: number } {
  const store = readStore()
  let totalValue = 0
  for (const id of cardIds) {
    const record = store[id]
    if (!record) continue
    totalValue += (getMarketPrice(record.card) ?? 0) * record.count
    delete store[id]
  }
  writeStore(store)
  return { store, totalValue }
}

export function clearCollection(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(VERSION_KEY)
}
