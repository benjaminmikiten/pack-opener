'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CollectionEntry, PokemonCard, SetId } from '@/types'
import { SETS } from '@/lib/sets'
import Card from './Card'
import CardModal from './CardModal'
import Link from 'next/link'

interface CollectionViewProps {
  collection: CollectionEntry[]
  onClear: () => void
}

type SortKey = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'rarity'
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

export default function CollectionView({ collection, onClear }: CollectionViewProps) {
  const [zoomedCard, setZoomedCard] = useState<PokemonCard | null>(null)
  const [setFilter, setSetFilter] = useState<SetId | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let entries = [...collection]

    // Set filter
    if (setFilter !== 'all') {
      entries = entries.filter((e) => e.setId === setFilter)
    }

    // Rarity filter
    if (rarityFilter !== 'all') {
      entries = entries.filter((e) => e.card.slot === rarityFilter)
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      entries = entries.filter((e) => e.card.name.toLowerCase().includes(q))
    }

    // Sort
    entries.sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
        case 'oldest': return new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
        case 'name-az': return a.card.name.localeCompare(b.card.name)
        case 'name-za': return b.card.name.localeCompare(a.card.name)
        case 'rarity': return (RARITY_ORDER[b.card.slot ?? ''] ?? 0) - (RARITY_ORDER[a.card.slot ?? ''] ?? 0)
        default: return 0
      }
    })

    return entries
  }, [collection, setFilter, rarityFilter, sort, search])

  const totalCards = collection.length

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
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
          <span className="text-sm text-gray-400">{totalCards} cards</span>
          {totalCards > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear your entire collection? This cannot be undone.')) onClear()
              }}
              className="rounded-lg bg-red-900/60 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-800/60"
            >
              Clear
            </button>
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
            </select>

            {/* Result count */}
            {filtered.length !== totalCards && (
              <span className="text-sm text-gray-500">
                {filtered.length} of {totalCards}
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
                className="flex flex-wrap gap-4"
              >
                {filtered.map((entry, i) => (
                  <motion.div
                    key={`${entry.card.id}-${entry.openedAt}`}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                  >
                    <Card
                      card={entry.card}
                      revealed={true}
                      compact={true}
                      onClick={() => setZoomedCard(entry.card)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {zoomedCard && <CardModal card={zoomedCard} onClose={() => setZoomedCard(null)} />}
    </div>
  )
}
