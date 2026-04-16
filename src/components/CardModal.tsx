'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { PokemonCard, CollectionRecord, getMarketPrice, getEffectivePrice, PSA_MULTIPLIERS, PSA_GRADE_NAMES } from '@/types'

const PSA_WARNING_KEY = 'pokemon-pack-opener-psa-warned'

function hasPsaWarningBeenShown(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PSA_WARNING_KEY) === 'true'
}

function markPsaWarningShown(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PSA_WARNING_KEY, 'true')
}

interface CardModalProps {
  card: PokemonCard | null
  onClose: () => void
  /** Pass when opened from collection view to enable grading */
  collectionKey?: string
  collectionRecord?: CollectionRecord
  onGrade?: (key: string, grade: number) => void
}

type GradingState = 'idle' | 'warning' | 'grading' | 'revealed'

export default function CardModal({ card, onClose, collectionKey, collectionRecord, onGrade }: CardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateY = useSpring(x, { stiffness: 120, damping: 25 })
  const rotateX = useSpring(y, { stiffness: 120, damping: 25 })

  const [gradingState, setGradingState] = useState<GradingState>('idle')
  const [pendingGrade, setPendingGrade] = useState<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Don't let Escape close the modal while a grade is in flight or revealed —
        // the result is irrevocable and we want the player to see it.
        if (gradingState === 'grading' || gradingState === 'revealed') return
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, gradingState])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const py = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    x.set(px * 14)
    y.set(-py * 14)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }
  const handleTouchEnd = () => { x.set(0); y.set(0) }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!cardRef.current) return
    const touch = e.touches[0]
    const rect = cardRef.current.getBoundingClientRect()
    const px = (touch.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const py = (touch.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    x.set(px * 14)
    y.set(-py * 14)
  }

  const handleGradeButtonClick = useCallback(() => {
    if (hasPsaWarningBeenShown()) {
      beginGrading()
    } else {
      setGradingState('warning')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const beginGrading = useCallback(() => {
    setGradingState('grading')
    const grade = Math.floor(Math.random() * 9) + 1
    setTimeout(() => {
      setPendingGrade(grade)
      setGradingState('revealed')
    }, 1200)
  }, [])

  const acceptWarningAndGrade = useCallback(() => {
    markPsaWarningShown()
    beginGrading()
  }, [beginGrading])

  const commitGrade = useCallback(() => {
    if (pendingGrade !== null && collectionKey && onGrade) {
      onGrade(collectionKey, pendingGrade)
      onClose()
    }
  }, [pendingGrade, collectionKey, onGrade, onClose])

  if (!card) return null

  const isHolo = card.slot === 'holo'
  const isRare = card.slot === 'rare'
  const imageUrl = isHolo
    ? card.images.large.replace('.png', '_hires.png').replace('_hires_hires.png', '_hires.png')
    : card.images.large

  const alreadyGraded = collectionRecord?.grade !== undefined
  const canGrade = !!onGrade && !!collectionKey && !alreadyGraded
  const basePrice = getMarketPrice(card)
  const effectivePrice = collectionRecord ? getEffectivePrice(collectionRecord) : basePrice

  const psaSlabColor = (grade: number) => {
    if (grade >= 9) return '#1a4fa8'
    if (grade >= 7) return '#1a6a3a'
    if (grade >= 5) return '#7a6a10'
    if (grade >= 3) return '#7a3010'
    return '#5a1010'
  }

  // Backdrop click only allowed when not mid-grade
  const handleBackdropClick = () => {
    if (gradingState === 'grading' || gradingState === 'revealed') return
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
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

          {/* PSA slab badge (already graded) */}
          {alreadyGraded && collectionRecord?.grade !== undefined && (
            <div
              className="rounded-lg px-5 py-2 text-center font-bold text-white"
              style={{
                background: psaSlabColor(collectionRecord.grade),
                boxShadow: `0 0 20px ${psaSlabColor(collectionRecord.grade)}99`,
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              <div className="text-xs uppercase tracking-widest opacity-75">PSA Grade</div>
              <div className="text-3xl font-extrabold">{collectionRecord.grade}</div>
              <div className="text-xs opacity-75">{PSA_GRADE_NAMES[collectionRecord.grade]}</div>
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

          {/* Card info */}
          <div className="text-center">
            <p className="text-xl font-bold text-white">{card.name}</p>
            <p className="mt-1 text-sm text-gray-400 capitalize">{card.slot}</p>
            {effectivePrice !== undefined && (
              <p className="mt-1 text-sm font-semibold text-yellow-400">
                ${effectivePrice.toFixed(2)}{' '}
                <span className="text-xs font-normal text-gray-500">
                  {alreadyGraded ? 'graded value' : 'market'}
                </span>
                {alreadyGraded && basePrice !== undefined && collectionRecord?.grade && (
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    (raw ${basePrice.toFixed(2)} × {PSA_MULTIPLIERS[collectionRecord.grade]}x)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Grading UI */}
          <AnimatePresence mode="wait">
            {/* Idle — show "Get it Graded" button */}
            {canGrade && gradingState === 'idle' && (
              <motion.button
                key="grade-btn"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onClick={handleGradeButtonClick}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1a3a7a, #2a5ab8)', border: '1px solid rgba(100,150,255,0.3)' }}
              >
                🏅 Get it Graded
              </motion.button>
            )}

            {/* One-time warning */}
            {gradingState === 'warning' && (
              <motion.div
                key="warning"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="w-full max-w-xs rounded-2xl border border-white/10 p-5 text-center"
                style={{ background: '#111827' }}
              >
                <div className="mb-2 text-2xl">⚠️</div>
                <h3 className="mb-2 text-base font-bold text-white">This is permanent</h3>
                <p className="mb-5 text-sm leading-relaxed text-gray-400">
                  Once you submit a card for grading, you get whatever grade PSA gives it — good or bad.
                  There's no undo, no re-roll. Think of it as the real thing.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGradingState('idle')}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Never mind
                  </button>
                  <button
                    onClick={acceptWarningAndGrade}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-black"
                    style={{ background: '#fbbf24' }}
                  >
                    I understand
                  </button>
                </div>
              </motion.div>
            )}

            {/* Submitting spinner */}
            {gradingState === 'grading' && (
              <motion.div
                key="grading-spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="h-8 w-8 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: '#60a5fa' }}
                />
                <span className="text-xs text-gray-400">Submitting to PSA...</span>
              </motion.div>
            )}

            {/* Grade revealed — no way out */}
            {gradingState === 'revealed' && pendingGrade !== null && (
              <motion.div
                key="grade-result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className="rounded-xl px-8 py-4 text-center font-bold text-white"
                  style={{
                    background: psaSlabColor(pendingGrade),
                    boxShadow: `0 0 28px ${psaSlabColor(pendingGrade)}cc`,
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <div className="text-xs uppercase tracking-widest opacity-75">PSA Grade</div>
                  <div className="text-4xl font-extrabold">{pendingGrade}</div>
                  <div className="text-sm opacity-80">{PSA_GRADE_NAMES[pendingGrade]}</div>
                  {basePrice !== undefined && (
                    <div className="mt-1 text-xs opacity-60">
                      ${(basePrice * PSA_MULTIPLIERS[pendingGrade]).toFixed(2)} value
                      {' '}({PSA_MULTIPLIERS[pendingGrade] >= 1 ? '+' : ''}{Math.round((PSA_MULTIPLIERS[pendingGrade] - 1) * 100)}%)
                    </div>
                  )}
                </div>
                <button
                  onClick={commitGrade}
                  className="rounded-xl px-8 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
                  style={{ background: '#fbbf24' }}
                >
                  Accept Grade
                </button>
                <p className="text-xs text-gray-600">The grade has been recorded. You cannot change it.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button — hidden while a grade is in progress */}
          {gradingState !== 'grading' && gradingState !== 'revealed' && (
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 px-6 py-2 text-sm text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
            >
              Close
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
