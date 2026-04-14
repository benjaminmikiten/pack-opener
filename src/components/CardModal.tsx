'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { PokemonCard } from '@/types'

interface CardModalProps {
  card: PokemonCard | null
  onClose: () => void
}

export default function CardModal({ card, onClose }: CardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateY = useSpring(x, { stiffness: 120, damping: 25 })
  const rotateX = useSpring(y, { stiffness: 120, damping: 25 })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const py = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    x.set(px * 14)
    y.set(-py * 14)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!cardRef.current) return
    const touch = e.touches[0]
    const rect = cardRef.current.getBoundingClientRect()
    const px = (touch.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const py = (touch.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    x.set(px * 14)
    y.set(-py * 14)
  }

  const handleTouchEnd = () => {
    x.set(0)
    y.set(0)
  }

  if (!card) return null

  const isHolo = card.slot === 'holo'
  const isRare = card.slot === 'rare'
  const imageUrl = isHolo
    ? card.images.large.replace('.png', '_hires.png').replace('_hires_hires.png', '_hires.png')
    : card.images.large

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-6"
        >
          {/* Rarity badge */}
          {isHolo && (
            <motion.div
              animate={{
                background: [
                  'linear-gradient(90deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))',
                  'linear-gradient(90deg, rgba(59,130,246,0.95), rgba(236,72,153,0.95))',
                  'linear-gradient(90deg, rgba(236,72,153,0.95), rgba(168,85,247,0.95))',
                ],
                boxShadow: [
                  '0 0 16px rgba(168,85,247,0.8)',
                  '0 0 16px rgba(59,130,246,0.8)',
                  '0 0 16px rgba(236,72,153,0.8)',
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="rounded-full px-5 py-1.5 text-sm font-bold text-white"
            >
              ✨ HOLO RARE
            </motion.div>
          )}
          {isRare && !isHolo && (
            <div
              className="rounded-full px-5 py-1.5 text-sm font-bold text-white"
              style={{
                background: 'linear-gradient(90deg, rgba(180,130,0,0.95), rgba(255,215,0,0.95))',
                boxShadow: '0 0 16px rgba(255,215,0,0.7)',
              }}
            >
              ⭐ RARE
            </div>
          )}

          {/* Card with parallax */}
          <div style={{ perspective: '1000px' }}>
            <motion.div
              ref={cardRef}
              style={{ rotateY, rotateX, transformStyle: 'preserve-3d' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative cursor-grab active:cursor-grabbing"
            >
              {/* Holo animated glow */}
              {isHolo && (
                <motion.div
                  className="pointer-events-none absolute -inset-3 rounded-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 40px 10px rgba(168,85,247,0.7)',
                      '0 0 55px 14px rgba(59,130,246,0.7)',
                      '0 0 40px 10px rgba(236,72,153,0.7)',
                      '0 0 55px 14px rgba(168,85,247,0.7)',
                    ],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              )}
              {/* Rare gold glow */}
              {isRare && !isHolo && (
                <div
                  className="pointer-events-none absolute -inset-2 rounded-2xl"
                  style={{ boxShadow: '0 0 35px 8px rgba(255,215,0,0.55)' }}
                />
              )}

              {isHolo && (
                <div className="holo-shimmer" style={{ borderRadius: '12px', zIndex: 2 }} />
              )}
              <img
                src={imageUrl}
                alt={card.name}
                className="relative rounded-xl shadow-2xl"
                style={{
                  width: 'min(340px, 80vw)',
                  height: 'auto',
                  display: 'block',
                  zIndex: 1,
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                } as React.CSSProperties}
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Card name */}
          <div className="text-center">
            <p className="text-xl font-bold text-white">{card.name}</p>
            <p className="mt-1 text-sm text-gray-400 capitalize">{card.slot}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-6 py-2 text-sm text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
