import { CollectionEntry, CollectionRecord, CollectionStore, PackResult, getEffectivePrice } from '@/types'

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

/**
 * Sell copies of cards by storeKey.
 * Each item specifies a storeKey (the key in CollectionStore) and how many copies to sell.
 * If count >= record.count the entry is deleted; otherwise count is decremented.
 * Returns the updated store and total value sold (with PSA multipliers applied).
 */
export function sellCards(
  items: Array<{ storeKey: string; count: number }>
): { store: CollectionStore; totalValue: number } {
  const store = readStore()
  let totalValue = 0
  for (const { storeKey, count } of items) {
    const record = store[storeKey]
    if (!record) continue
    const effectiveCount = Math.min(count, record.count)
    totalValue += (getEffectivePrice(record) ?? 0) * effectiveCount
    if (effectiveCount >= record.count) {
      delete store[storeKey]
    } else {
      store[storeKey] = { ...record, count: record.count - effectiveCount }
    }
  }
  writeStore(store)
  return { store, totalValue }
}

/**
 * Grade one copy of a card.
 * Decrements (or removes) the original record and creates a new graded record
 * under the key `${cardId}:g${timestamp}`.
 */
export function gradeCardInCollection(
  storeKey: string,
  grade: number
): { store: CollectionStore; gradedKey: string } {
  const store = readStore()
  const record = store[storeKey]
  if (!record) return { store, gradedKey: '' }

  // Remove one copy from the original record
  if (record.count <= 1) {
    delete store[storeKey]
  } else {
    store[storeKey] = { ...record, count: record.count - 1 }
  }

  // Create graded entry (always count 1)
  const gradedKey = `${record.card.id}:g${Date.now()}`
  const gradedRecord: CollectionRecord = {
    card: record.card,
    setId: record.setId,
    count: 1,
    firstOpenedAt: record.firstOpenedAt,
    lastOpenedAt: record.lastOpenedAt,
    grade,
  }
  store[gradedKey] = gradedRecord

  writeStore(store)
  return { store, gradedKey }
}

export function clearCollection(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(VERSION_KEY)
}
