'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SetId, SetInfo } from '@/types'
import { SETS } from '@/lib/sets'

interface SetSelectorProps {
  onSelectSet: (setId: SetId) => void
  balance: number
  points: number
  redeemableAmount: number
  onRedeem: () => void
  hydrated: boolean
}

function SetCard({
  set,
  onClick,
  canAfford,
}: {
  set: SetInfo
  onClick: () => void
  canAfford: boolean
}) {
  const [logoLoaded, setLogoLoaded] = useState(false)

  return (
    <motion.button
      onClick={canAfford ? onClick : undefined}
      whileHover={canAfford ? { scale: 1.05, y: -8 } : {}}
      whileTap={canAfford ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative flex h-48 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 p-6 text-center shadow-lg"
      style={{
        borderColor: canAfford ? set.accent : '#444',
        background: canAfford
          ? `linear-gradient(135deg, ${set.gradient[0]}, ${set.gradient[1]}, ${set.gradient[2]})`
          : 'linear-gradient(135deg, #111, #1a1a1a)',
        boxShadow: canAfford
          ? `0 0 20px ${set.accent}33, 0 4px 24px rgba(0,0,0,0.4)`
          : '0 4px 24px rgba(0,0,0,0.4)',
        opacity: canAfford ? 1 : 0.45,
        cursor: canAfford ? 'pointer' : 'not-allowed',
      }}
    >
      {/* Hover glow */}
      {canAfford && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0"
          whileHover={{ opacity: 1 }}
          style={{ background: `radial-gradient(ellipse at center, ${set.accent}22 0%, transparent 70%)` }}
        />
      )}

      {/* Set logo */}
      <div className="mb-3 flex h-20 items-center justify-center">
        <img
          src={set.logoUrl}
          alt={set.name}
          className="max-h-16 max-w-[160px] object-contain drop-shadow-lg"
          style={{
            opacity: logoLoaded ? (canAfford ? 1 : 0.5) : 0,
            transition: 'opacity 0.3s',
            filter: canAfford ? `drop-shadow(0 0 8px ${set.accent}99)` : 'grayscale(1)',
          }}
          ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLogoLoaded(true) }}
          onLoad={() => setLogoLoaded(true)}
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
          draggable={false}
        />
        {/* Fallback while loading */}
        {!logoLoaded && (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-4 text-2xl"
            style={{
              borderColor: canAfford ? set.accent : '#444',
              background: canAfford
                ? `radial-gradient(circle at 30% 30%, ${set.accent}40, ${set.gradient[1]})`
                : '#222',
              boxShadow: canAfford ? `0 0 12px ${set.accent}66` : 'none',
            }}
          >
            ⚡
          </div>
        )}
      </div>

      <h3
        className="text-lg font-bold tracking-wide"
        style={{
          color: canAfford ? set.accent : '#555',
          textShadow: canAfford ? `0 0 10px ${set.accent}88` : 'none',
        }}
      >
        {set.name}
      </h3>
      <p className="mt-1 text-xs" style={{ color: canAfford ? '#9ca3af' : '#555' }}>
        {canAfford ? `$${set.price.toFixed(2)}` : `Need $${set.price.toFixed(2)}`}
      </p>
    </motion.button>
  )
}

export default function SetSelector({
  onSelectSet,
  balance,
  points,
  redeemableAmount,
  onRedeem,
  hydrated,
}: SetSelectorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
          Pokemon TCG
          <span className="block bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
            Pack Opener
          </span>
        </h1>
        <p className="text-lg text-gray-400">Select a set to open a pack</p>

        {/* Economy bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: hydrated ? 1 : 0, y: hydrated ? 0 : 8 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-6 inline-flex items-center gap-4 rounded-2xl px-6 py-3 text-sm"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="font-bold text-white">
            💰 ${balance.toFixed(2)}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-yellow-300">
            ⭐ {points} {points === 1 ? 'pt' : 'pts'}
          </span>
          <AnimatePresence>
            {redeemableAmount > 0 && (
              <motion.button
                key="redeem"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onClick={onRedeem}
                className="rounded-full px-3 py-1 text-xs font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
              >
                Redeem +${redeemableAmount}.00
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
        {redeemableAmount === 0 && points > 0 && (
          <p className="mt-2 text-xs text-gray-600">
            {10 - points} more flips to redeem $1
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SETS.map((set, i) => (
          <motion.div
            key={set.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
          >
            <SetCard
              set={set}
              onClick={() => onSelectSet(set.id)}
              canAfford={hydrated && balance >= set.price}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
