'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SetId, SetInfo } from '@/types'
import { SETS } from '@/lib/sets'

interface SetSelectorProps {
  onSelectSet: (setId: SetId) => void
}

function SetCard({ set, onClick }: { set: SetInfo; onClick: () => void }) {
  const [logoLoaded, setLogoLoaded] = useState(false)

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative flex h-48 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 p-6 text-center shadow-lg"
      style={{
        borderColor: set.accent,
        background: `linear-gradient(135deg, ${set.gradient[0]}, ${set.gradient[1]}, ${set.gradient[2]})`,
        boxShadow: `0 0 20px ${set.accent}33, 0 4px 24px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0"
        whileHover={{ opacity: 1 }}
        style={{ background: `radial-gradient(ellipse at center, ${set.accent}22 0%, transparent 70%)` }}
      />

      {/* Set logo */}
      <div className="mb-3 flex h-20 items-center justify-center">
        <img
          src={set.logoUrl}
          alt={set.name}
          className="max-h-16 max-w-[160px] object-contain drop-shadow-lg"
          style={{
            opacity: logoLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
            filter: `drop-shadow(0 0 8px ${set.accent}99)`,
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
              borderColor: set.accent,
              background: `radial-gradient(circle at 30% 30%, ${set.accent}40, ${set.gradient[1]})`,
              boxShadow: `0 0 12px ${set.accent}66`,
            }}
          >
            ⚡
          </div>
        )}
      </div>

      <h3
        className="text-lg font-bold tracking-wide"
        style={{ color: set.accent, textShadow: `0 0 10px ${set.accent}88` }}
      >
        {set.name}
      </h3>
      <p className="mt-1 text-xs text-gray-400">Click to open a pack</p>
    </motion.button>
  )
}

export default function SetSelector({ onSelectSet }: SetSelectorProps) {
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
            <SetCard set={set} onClick={() => onSelectSet(set.id)} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
