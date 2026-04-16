'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CollectionRecord, CollectionStore, getEffectivePrice, PSA_GRADE_NAMES } from '@/types'
import { SETS } from '@/lib/sets'
import Card from './Card'
import CardModal from './CardModal'
import Link from 'next/link'

interface CollectionViewProps {
  collection: CollectionStore
  onSell: (items: Array<{ storeKey: string; count: number }>) => void
  onGrade: (storeKey: string, grade: number) => void
  onClear: () => void
}

type SortKey = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'rarity' | 'price-high' | 'price-low'
type RarityKey = 'energy' | 'common' | 'uncommon' | 'rare' | 'holo'

const RARITY_ORDER: Record<string, number> = {
  energy: 0, common: 1, uncommon: 2, rare: 3, holo: 4,
}

const RARITY_OPTIONS: Array<{ value: RarityKey; label: string }> = [
  { value: 'energy', label: 'Energy' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'holo', label: 'Holo Rare' },
]

const SET_OPTIONS = SETS.map((s) => ({ value: s.id, label: s.name }))

// ─── Multi-select filter dropdown ─────────────────────────────────────────────

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  selected: Set<string>
  onToggle: (value: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayLabel =
    selected.size === 0
      ? label
      : selected.size === 1
        ? options.find((o) => selected.has(o.value))?.label ?? label
        : `${selected.size} selected`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none hover:border-white/20"
      >
        <span>{displayLabel}</span>
        {selected.size > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-black">
            {selected.size}
          </span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M5 7L0 2h10L5 7z" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-white/10 bg-gray-900 p-1.5 shadow-2xl"
          >
            {selected.size > 0 && (
              <button
                onClick={() => { onClear(); setOpen(false) }}
                className="w-full rounded px-3 py-1.5 text-left text-xs text-amber-400 hover:bg-white/5"
              >
                Clear selection
              </button>
            )}
            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={selected.has(option.value)}
                  onChange={() => onToggle(option.value)}
                  className="accent-amber-400"
                />
                <span className="text-sm text-white">{option.label}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sell item type (one copy of one card) ────────────────────────────────────

interface SellItem {
  storeKey: string
  record: CollectionRecord
  copyIndex: number
  sellKey: string // `${storeKey}:copy:${copyIndex}` — unique per visible tile
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CollectionView({ collection, onSell, onGrade, onClear }: CollectionViewProps) {
  const [zoomedEntry, setZoomedEntry] = useState<{ key: string; record: CollectionRecord } | null>(null)
  const [setFilters, setSetFilters] = useState<Set<string>>(new Set())
  const [rarityFilters, setRarityFilters] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortKey>('newest')
  const [search, setSearch] = useState('')
  const [sellMode, setSellMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set()) // tracks sellKeys
  const [confirmOpen, setConfirmOpen] = useState(false)

  // All records as {key, record} pairs
  const allEntries = useMemo(
    () => Object.entries(collection).map(([key, record]) => ({ key, record })),
    [collection]
  )

  const totalCards = useMemo(
    () => allEntries.reduce((sum, e) => sum + e.record.count, 0),
    [allEntries]
  )
  const totalUnique = allEntries.length

  // Filtered + sorted entries
  const filteredEntries = useMemo(() => {
    let entries = [...allEntries]

    if (setFilters.size > 0) {
      entries = entries.filter((e) => setFilters.has(e.record.setId))
    }
    if (rarityFilters.size > 0) {
      entries = entries.filter((e) => rarityFilters.has(e.record.card.slot ?? ''))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      entries = entries.filter((e) => e.record.card.name.toLowerCase().includes(q))
    }

    entries.sort((a, b) => {
      const ra = a.record
      const rb = b.record
      switch (sort) {
        case 'newest': return new Date(rb.lastOpenedAt).getTime() - new Date(ra.lastOpenedAt).getTime()
        case 'oldest': return new Date(ra.firstOpenedAt).getTime() - new Date(rb.firstOpenedAt).getTime()
        case 'name-az': return ra.card.name.localeCompare(rb.card.name)
        case 'name-za': return rb.card.name.localeCompare(ra.card.name)
        case 'rarity': return (RARITY_ORDER[rb.card.slot ?? ''] ?? 0) - (RARITY_ORDER[ra.card.slot ?? ''] ?? 0)
        case 'price-high': return (getEffectivePrice(rb) ?? 0) - (getEffectivePrice(ra) ?? 0)
        case 'price-low': return (getEffectivePrice(ra) ?? 0) - (getEffectivePrice(rb) ?? 0)
        default: return 0
      }
    })

    return entries
  }, [allEntries, setFilters, rarityFilters, sort, search])

  // In sell mode, expand each entry into individual copy tiles
  const sellItems = useMemo<SellItem[]>(() => {
    if (!sellMode) return []
    return filteredEntries.flatMap(({ key, record }) =>
      Array.from({ length: record.count }, (_, i) => ({
        storeKey: key,
        record,
        copyIndex: i,
        sellKey: `${key}:copy:${i}`,
      }))
    )
  }, [sellMode, filteredEntries])

  // Sell total (computed from selected sellKeys)
  const sellTotal = useMemo(() => {
    const quantities = new Map<string, number>()
    for (const sellKey of selected) {
      const [storeKey] = sellKey.split(':copy:')
      quantities.set(storeKey, (quantities.get(storeKey) ?? 0) + 1)
    }
    let total = 0
    for (const [storeKey, count] of quantities) {
      const record = collection[storeKey]
      if (record) total += (getEffectivePrice(record) ?? 0) * count
    }
    return parseFloat(total.toFixed(2))
  }, [selected, collection])

  const toggleSellItem = (sellKey: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(sellKey)) next.delete(sellKey)
      else next.add(sellKey)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(sellItems.map((i) => i.sellKey)))
  const deselectAll = () => setSelected(new Set())

  const exitSellMode = () => {
    setSellMode(false)
    setSelected(new Set())
  }

  const handleConfirmSell = () => {
    const quantities = new Map<string, number>()
    for (const sellKey of selected) {
      const [storeKey] = sellKey.split(':copy:')
      quantities.set(storeKey, (quantities.get(storeKey) ?? 0) + 1)
    }
    const items = Array.from(quantities.entries()).map(([storeKey, count]) => ({ storeKey, count }))
    onSell(items)
    setConfirmOpen(false)
    exitSellMode()
  }

  const filtersActive = setFilters.size > 0 || rarityFilters.size > 0 || !!search.trim() || sort !== 'newest'

  return (
    <div
      className="min-h-screen bg-gray-950 px-4 py-8"
      style={sellMode ? { outline: '3px solid #fbbf24', outlineOffset: '-3px' } : undefined}
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold text-white">My Collection</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {totalUnique} unique · {totalCards} total
          </span>
          {totalCards > 0 && (
            <>
              <button
                onClick={() => (sellMode ? exitSellMode() : setSellMode(true))}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={
                  sellMode
                    ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }
                    : { background: 'rgba(255,255,255,0.07)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {sellMode ? 'Exit Sell Mode' : 'Enter Sell Mode'}
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear your entire collection? This cannot be undone.')) onClear()
                }}
                className="rounded-lg bg-red-900/60 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-800/60"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty state */}
      {totalCards === 0 && (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <div className="mb-6 text-8xl opacity-20">📦</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-500">No cards yet</h2>
          <p className="mb-8 text-gray-600">Open some packs to start your collection!</p>
          <Link
            href="/"
            className="rounded-xl bg-yellow-500/20 px-8 py-3 font-bold text-yellow-300 transition-colors hover:bg-yellow-500/30"
          >
            Open a Pack
          </Link>
        </div>
      )}

      {totalCards > 0 && (
        <>
          {/* Filter / sort bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search cards…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/25"
              style={{ minWidth: 160 }}
            />

            {/* Set multi-select */}
            <FilterDropdown
              label="All Sets"
              options={SET_OPTIONS}
              selected={setFilters}
              onToggle={(v) => {
                setSetFilters((prev) => {
                  const next = new Set(prev)
                  if (next.has(v)) next.delete(v)
                  else next.add(v)
                  return next
                })
              }}
              onClear={() => setSetFilters(new Set())}
            />

            {/* Rarity multi-select */}
            <FilterDropdown
              label="All Rarities"
              options={RARITY_OPTIONS}
              selected={rarityFilters}
              onToggle={(v) => {
                setRarityFilters((prev) => {
                  const next = new Set(prev)
                  if (next.has(v)) next.delete(v)
                  else next.add(v)
                  return next
                })
              }}
              onClear={() => setRarityFilters(new Set())}
            />

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-az">Name A→Z</option>
              <option value="name-za">Name Z→A</option>
              <option value="rarity">Rarity (High→Low)</option>
              <option value="price-high">Price (High→Low)</option>
              <option value="price-low">Price (Low→High)</option>
            </select>

            {/* Result count */}
            {filteredEntries.length !== totalUnique && (
              <span className="text-sm text-gray-500">
                {filteredEntries.length} of {totalUnique}
              </span>
            )}

            {/* Clear filters */}
            {filtersActive && (
              <button
                onClick={() => { setSetFilters(new Set()); setRarityFilters(new Set()); setSearch(''); setSort('newest') }}
                className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-300"
              >
                Reset
              </button>
            )}

            {/* Sell mode selection controls */}
            {sellMode && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/10"
                  style={{ border: '1px solid rgba(251,191,36,0.3)' }}
                >
                  Select All ({sellItems.length})
                </button>
                {selected.size > 0 && (
                  <button
                    onClick={deselectAll}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Deselect All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cards grid */}
          <AnimatePresence mode="popLayout">
            {(sellMode ? sellItems.length : filteredEntries.length) === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 text-center text-gray-500"
              >
                No cards match your filters.
              </motion.div>
            ) : sellMode ? (
              /* Sell mode: expanded individual copy tiles */
              <motion.div key="sell-grid" className="flex flex-wrap gap-4 pb-32">
                {sellItems.map((item, i) => (
                  <motion.div
                    key={item.sellKey}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.25) }}
                    className="relative"
                  >
                    <Card
                      card={item.record.card}
                      revealed
                      compact
                      selected={selected.has(item.sellKey)}
                      price={getEffectivePrice(item.record)}
                      onClick={() => toggleSellItem(item.sellKey)}
                    />
                    {/* Grade badge overlay for graded cards in sell mode */}
                    {item.record.grade !== undefined && (
                      <div
                        className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-xs font-bold text-white"
                        style={{ background: '#1a4fa8', fontSize: 9 }}
                      >
                        PSA {item.record.grade}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* Normal mode: one tile per unique record */
              <motion.div key="grid" className="flex flex-wrap gap-4">
                {filteredEntries.map(({ key, record }, i) => (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.25) }}
                    className="relative"
                  >
                    <Card
                      card={record.card}
                      revealed
                      compact
                      count={record.grade === undefined ? record.count : undefined}
                      price={getEffectivePrice(record)}
                      onClick={() => setZoomedEntry({ key, record })}
                    />
                    {/* PSA grade badge */}
                    {record.grade !== undefined && (
                      <div
                        className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-xs font-bold text-white"
                        style={{ background: '#1a4fa8', fontSize: 9 }}
                        title={`PSA ${record.grade} – ${PSA_GRADE_NAMES[record.grade]}`}
                      >
                        PSA {record.grade}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Card modal (not shown in sell mode) */}
      {!sellMode && zoomedEntry && (
        <CardModal
          card={zoomedEntry.record.card}
          onClose={() => setZoomedEntry(null)}
          collectionKey={zoomedEntry.key}
          collectionRecord={zoomedEntry.record}
          onGrade={(key, grade) => {
            onGrade(key, grade)
            setZoomedEntry(null)
          }}
        />
      )}

      {/* Sticky sell footer */}
      <AnimatePresence>
        {sellMode && (
          <motion.div
            key="sell-footer"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 border-t border-amber-400/20 px-6 py-4"
            style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)' }}
          >
            <div className="text-sm text-gray-400">
              {selected.size === 0 ? (
                <span>Select individual cards to sell</span>
              ) : (
                <span>
                  <span className="font-bold text-white">{selected.size}</span> cop{selected.size !== 1 ? 'ies' : 'y'} selected
                  {sellTotal > 0 && (
                    <span className="ml-2 font-semibold text-amber-400">· ${sellTotal.toFixed(2)}</span>
                  )}
                </span>
              )}
            </div>
            <button
              disabled={selected.size === 0}
              onClick={() => setConfirmOpen(true)}
              className="rounded-xl px-6 py-2.5 text-sm font-bold transition-all"
              style={
                selected.size > 0
                  ? { background: '#fbbf24', color: '#000' }
                  : { background: 'rgba(255,255,255,0.08)', color: '#555', cursor: 'not-allowed' }
              }
            >
              {selected.size > 0 && sellTotal > 0 ? `Sell for $${sellTotal.toFixed(2)}` : 'Sell'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm sell modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            key="confirm-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl"
              style={{ background: '#111827' }}
            >
              <h2 className="mb-1 text-lg font-bold text-white">Confirm Sale</h2>
              <p className="mb-6 text-sm text-gray-400">
                Sell{' '}
                <span className="font-semibold text-white">
                  {selected.size} cop{selected.size !== 1 ? 'ies' : 'y'}
                </span>{' '}
                for{' '}
                <span className="font-semibold text-amber-400">${sellTotal.toFixed(2)}</span>?
                {' '}This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSell}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                  style={{ background: '#fbbf24', color: '#000' }}
                >
                  Sell for ${sellTotal.toFixed(2)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
