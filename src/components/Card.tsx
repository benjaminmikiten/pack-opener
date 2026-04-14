'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { PokemonCard } from '@/types'

interface CardProps {
  card: PokemonCard
  revealDelay?: number
  revealed?: boolean
  compact?: boolean
  onClick?: () => void
}

export default function Card({ card, revealDelay = 0, revealed = true, compact = false, onClick }: CardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  const isHolo = card.slot === 'holo'
  const isRare = card.slot === 'rare'
  const isEnergy = card.slot === 'energy'

  const imageUrl = isHolo
    ? card.images.large.replace('.png', '_hires.png').replace('_hires_hires.png', '_hires.png')
    : card.images.small

  const cardSizeClass = compact
    ? 'w-28'
    : isEnergy
      ? 'w-36'
      : 'w-44'

  return (
    <motion.div
      className={`relative ${cardSizeClass} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ perspective: '1000px' }}
      onClick={onClick}
      initial={revealed ? { rotateY: 180, opacity: 0, y: 20 } : {}}
      animate={
        revealed
          ? {
              rotateY: 0,
              opacity: isEnergy ? 0.85 : 1,
              y: 0,
            }
          : {}
      }
      transition={{
        delay: revealDelay,
        duration: 0.6,
        type: 'spring',
        stiffness: 120,
        damping: 15,
      }}
      whileHover={
        !compact
          ? {
              y: -14,
              rotate: 2,
              scale: 1.06,
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }
          : {}
      }
      onAnimationComplete={() => setIsFlipped(true)}
    >
      {/* Holo rainbow glow */}
      {isHolo && isFlipped && (
        <motion.div
          className="pointer-events-none absolute -inset-2 rounded-xl"
          animate={{
            boxShadow: [
              '0 0 20px 4px rgba(168, 85, 247, 0.7)',
              '0 0 30px 6px rgba(59, 130, 246, 0.7)',
              '0 0 20px 4px rgba(236, 72, 153, 0.7)',
              '0 0 30px 6px rgba(168, 85, 247, 0.7)',
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Rare gold glow */}
      {isRare && isFlipped && (
        <div
          className="pointer-events-none absolute -inset-1 rounded-xl"
          style={{ boxShadow: '0 0 18px 3px rgba(255, 215, 0, 0.5)' }}
        />
      )}

      {/* Card image */}
      <div className="relative overflow-hidden rounded-lg">
        {!imageLoaded && (
          <div
            className={`${isEnergy ? 'h-48' : 'h-56'} w-full animate-pulse rounded-lg bg-gray-700`}
          />
        )}
        <Image
          src={imageUrl}
          alt={card.name}
          width={isHolo ? 400 : 250}
          height={isHolo ? 560 : 350}
          unoptimized
          className={`w-full rounded-lg transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            // Image failed to load — just show the skeleton
          }}
        />
        {/* Holo shimmer overlay for compact holo cards */}
        {isHolo && isFlipped && imageLoaded && <div className="holo-shimmer" />}
      </div>

      {/* Rarity badges */}
      {isHolo && isFlipped && (
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold"
          animate={{
            background: [
              'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(59,130,246,0.9))',
              'linear-gradient(90deg, rgba(59,130,246,0.9), rgba(236,72,153,0.9))',
              'linear-gradient(90deg, rgba(236,72,153,0.9), rgba(168,85,247,0.9))',
            ],
            boxShadow: [
              '0 0 10px rgba(168,85,247,0.8)',
              '0 0 10px rgba(59,130,246,0.8)',
              '0 0 10px rgba(236,72,153,0.8)',
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{ color: '#fff' }}
        >
          ✨ HOLO RARE
        </motion.div>
      )}

      {isRare && isFlipped && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{
            background: 'linear-gradient(90deg, rgba(180,130,0,0.9), rgba(255,215,0,0.9))',
            boxShadow: '0 0 10px rgba(255,215,0,0.7)',
          }}
        >
          ⭐ RARE
        </div>
      )}
    </motion.div>
  )
}
