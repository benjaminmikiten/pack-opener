'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CollectionRecord, CollectionStore, SetId, getMarketPrice } from '@/types'
import { SETS } from '@/lib/sets'
import Card from './Card'
import CardModal from './CardModal'
import Link from 'next/link'

interface CollectionViewProps {
  collection: CollectionStore
  onSell: (ids: string[]) => void
  onClear: () => void
}

type SortKey = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'rarity' | 'price-high' | 'price-low'
type RarityFilter = 'all' | 'energy' | 'common' | 'uncommon' | 'rare' | 'holo'

const RARITY_ORDER: Record<string, number> = {
  energy: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  holo: 4,
}

const RARITY_LABELS: Record<RarityFilter, string> = {
  all: 'All Rarities',
  energy: 'Energy',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  holo: 'Holo Rare',
}

export default function CollectionView({ collection, onSell, onClear }: CollectionViewProps) {
  const [zoomedCard, setZoomedCard] = useState<CollectionRecord | null>(null)
  const [setFilter, setSetFilter] = useState<SetId | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [search, setSearch] = useState('')
  const [sellMode, setSellMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const records = useMemo(() => Object.values(collection), [collection])
  const totalCards = useMemo(() => records.reduce((sum, r) => sum + r.count, 0), [records])
  const totalUnique = records.length

  const filtered = useMemo(() => {
    let entries = [...records]

    if (setFilter !== 'all') {
      entries = entries.filter((r) => r.setId === setFilter)
    }

    if (rarityFilter !== 'all') {
      entries = entries.filter((r) => r.card.slot === rarityFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      entries = entries.filter((r) => r.card.name.toLowerCase().includes(q))
    }

    entries.sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
        case 'oldest': return new Date(a.firstOpenedAt).getTime() - new Date(b.firstOpenedAt).getTime()
        case 'name-az': return a.card.name.localeCompare(b.card.name)
        case 'name-za': return b.card.name.localeCompare(a.card.name)
        case 'rarity': return (RARITY_ORDER[b.card.slot ?? ''] ?? 0) - (RARITY_ORDER[a.card.slot ?? ''] ?? 0)
        case 'price-high': return (getMarketPrice(b.card) ?? 0) - (getMarketPrice(a.card) ?? 0)
        case 'price-low': return (getMarketPrice(a.card) ?? 0) - (getMarketPrice(b.card) ?? 0)
        default: return 0
      }
    })

    return entries
  }, [records, setFilter, rarityFilter, sort, search])

  const toggleCard = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((r) => r.card.id)))
  }

  const deselectAll = () => setSelected(new Set())

  const exitSellMode = () => {
    setSellMode(false)
    setSelected(new Set())
  }

  const selectedRecords = useMemo(
    () => records.filter((r) => selected.has(r.card.id)),
    [records, selected]
  )

  const sellTotal = useMemo(
    () => selectedRecords.reduce((sum, r) => sum + (getMarketPrice(r.card) ?? 0) * r.count, 0),
    [selectedRecords]
  )

  const handleConfirmSell = () => {
    onSell(Array.from(selected))
    setConfirmOpen(false)
    exitSellMode()
  }

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
                onClick={() => {
                  if (sellMode) {
                    exitSellMode()
                  } else {
                    setSellMode(true)
                  }
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={
                  sellMode
                    ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }
                    : { background: 'rgba(255,255,255,0.07)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {sellMode ? 'Done Selling' : 'Sell Cards'}
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
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/25 focus:ring-0"
              style={{ minWidth: 160 }}
            />

            {/* Set filter */}
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value as SetId | 'all')}
              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            >
              <option value="all">All Sets</option>
              {SETS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Rarity filter */}
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value as RarityFilter)}
              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            >
              {(Object.keys(RARITY_LABELS) as RarityFilter[]).map((r) => (
                <option key={r} value={r}>{RARITY_LABELS[r]}</option>
              ))}
            </select>

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
            {filtered.length !== totalUnique && (
              <span className="text-sm text-gray-500">
                {filtered.length} of {totalUnique}
              </span>
            )}

            {/* Clear filters */}
            {(setFilter !== 'all' || rarityFilter !== 'all' || search || sort !== 'newest') && (
              <button
                onClick={() => { setSetFilter('all'); setRarityFilter('all'); setSearch(''); setSort('newest') }}
                className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-300"
              >
                Reset
              </button>
            )}

            {/* Sell mode selection controls */}
            {sellMode && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/10"
                  style={{ border: '1px solid rgba(251,191,36,0.3)' }}
                >
                  Select All ({filtered.length})
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
            {filtered.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 text-center text-gray-500"
              >
                No cards match your filters.
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                className={`flex flex-wrap gap-4 ${sellMode ? 'pb-32' : ''}`}
              >
                {filtered.map((record, i) => (
                  <motion.div
                    key={record.card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                  >
                    <Card
                      card={record.card}
                      revealed={true}
                      compact={true}
                      selected={sellMode && selected.has(record.card.id)}
                      count={record.count}
                      price={getMarketPrice(record.card)}
                      onClick={() => {
                        if (sellMode) {
                          toggleCard(record.card.id)
                        } else {
                          setZoomedCard(record)
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Card modal (not shown in sell mode) */}
      {!sellMode && zoomedCard && (
        <CardModal card={zoomedCard.card} onClose={() => setZoomedCard(null)} />
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
                <span>Select cards to sell</span>
              ) : (
                <span>
                  <span className="font-bold text-white">{selected.size}</span> card{selected.size !== 1 ? 's' : ''} selected
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
              Sell{selected.size > 0 && sellTotal > 0 ? ` for $${sellTotal.toFixed(2)}` : ''}
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
                Sell {selected.size} card{selected.size !== 1 ? 's' : ''} for{' '}
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
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors"
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
