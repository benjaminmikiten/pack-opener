'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CollectionEntry, PokemonCard, SetId } from '@/types'
import { SETS } from '@/lib/sets'
import Card from './Card'
import CardModal from './CardModal'
import Link from 'next/link'

interface CollectionViewProps {
  collection: CollectionEntry[]
  onClear: () => void
}

export default function CollectionView({ collection, onClear }: CollectionViewProps) {
  const [zoomedCard, setZoomedCard] = useState<PokemonCard | null>(null)

  const bySet = useMemo(() => {
    const map = new Map<SetId, CollectionEntry[]>()
    for (const entry of collection) {
      if (!map.has(entry.setId)) map.set(entry.setId, [])
      map.get(entry.setId)!.push(entry)
    }
    return map
  }, [collection])

  const totalCards = collection.length

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
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
                if (confirm('Clear your entire collection? This cannot be undone.')) {
                  onClear()
                }
              }}
              className="rounded-lg bg-red-900/60 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-800/60"
            >
              Clear Collection
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

      {/* Cards by set */}
      {SETS.filter((s) => bySet.has(s.id)).map((setInfo) => {
        const entries = bySet.get(setInfo.id) || []
        return (
          <motion.section
            key={setInfo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="mb-4 flex items-center gap-3">
              <h2
                className="text-xl font-bold"
                style={{ color: setInfo.accent, textShadow: `0 0 10px ${setInfo.accent}66` }}
              >
                {setInfo.name}
              </h2>
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm text-gray-400">
                {entries.length} cards
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              {entries.map((entry, i) => (
                <motion.div
                  key={`${entry.card.id}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.6) }}
                >
                  <Card card={entry.card} revealed={true} compact={true} onClick={() => setZoomedCard(entry.card)} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )
      })}

      {zoomedCard && (
        <CardModal card={zoomedCard} onClose={() => setZoomedCard(null)} />
      )}
    </div>
  )
}
