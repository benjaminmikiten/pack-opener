'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { SetId, PokemonCard, PackResult, SetInfo } from '@/types'
import { SET_MAP } from '@/lib/sets'
import { generatePack } from '@/lib/packGenerator'
import Card from './Card'
import CardModal from './CardModal'

interface PackOpenerProps {
  setId: SetId
  onBack: () => void
  onPackOpened: (pack: PackResult) => void
}

type Phase = 'ready' | 'loading' | 'revealing' | 'done'

// The face-down card back
function CardBack({ accent }: { accent: string }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl"
      style={{
        width: 260,
        height: 364,
        boxShadow: `0 0 30px ${accent}33, 0 20px 50px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Real card back (locally hosted) */}
      {!imgError && (
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/card-back.jpg`}
          alt="Card Back"
          className="absolute inset-0 h-full w-full rounded-2xl object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          ref={(el) => { if (el?.complete && el.naturalWidth > 0) setImgLoaded(true) }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          draggable={false}
        />
      )}
      {/* CSS Pokeball fallback */}
      {(!imgLoaded || imgError) && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl"
          style={{
            background: 'linear-gradient(160deg,#1c3f6e 0%,#0d2040 60%,#1c3f6e 100%)',
            border: `2px solid ${accent}55`,
          }}
        >
          <div
            style={{
              width: 96, height: 96, borderRadius: '50%', border: '4px solid #4a90c4',
              background: 'linear-gradient(180deg,#d32f2f 0%,#d32f2f 46%,#111 46%,#111 54%,#eee 54%,#eee 100%)',
              position: 'relative', boxShadow: '0 0 18px rgba(74,144,196,0.5)',
            }}
          >
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)', width: 26, height: 26,
              borderRadius: '50%', background: '#fff', border: '4px solid #111',
            }} />
          </div>
          <span style={{ color: '#4a90c4', fontSize: 14, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>
            Pokémon
          </span>
        </div>
      )}
    </div>
  )
}

// The face-up card shown large in the spotlight
function SpotlightFront({ card, setInfo }: { card: PokemonCard; setInfo: SetInfo }) {
  const [loaded, setLoaded] = useState(false)
  const isHolo = card.slot === 'holo'
  const isRare = card.slot === 'rare'
  const src = isHolo
    ? card.images.large.replace('.png', '_hires.png').replace('_hires_hires.png', '_hires.png')
    : card.images.large

  return (
    <div className="relative cursor-pointer overflow-hidden rounded-2xl" style={{ width: 260, height: 364 }}>
      {/* Holo outer glow */}
      {isHolo && (
        <motion.div
          className="pointer-events-none absolute -inset-3 rounded-2xl"
          animate={{
            boxShadow: [
              '0 0 30px 8px rgba(168,85,247,0.8)',
              '0 0 45px 12px rgba(59,130,246,0.8)',
              '0 0 30px 8px rgba(236,72,153,0.8)',
              '0 0 45px 12px rgba(168,85,247,0.8)',
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      )}
      {isRare && (
        <div
          className="pointer-events-none absolute -inset-2 rounded-2xl"
          style={{ boxShadow: '0 0 28px 6px rgba(255,215,0,0.55)' }}
        />
      )}

      {!loaded && <div className="absolute inset-0 animate-pulse rounded-2xl bg-gray-700" />}

      <Image
        src={src}
        alt={card.name}
        width={260}
        height={364}
        unoptimized
        className={`relative z-[1] h-full w-full rounded-2xl object-cover shadow-2xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />

      {/* Holo rainbow shimmer overlay */}
      {isHolo && loaded && <div className="holo-shimmer" />}

    </div>
  )
}

export default function PackOpener({ setId, onBack, onPackOpened }: PackOpenerProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealedCards, setRevealedCards] = useState<PokemonCard[]>([])
  const [isFlipped, setIsFlipped] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoomedCard, setZoomedCard] = useState<PokemonCard | null>(null)

  const setInfo = SET_MAP[setId]
  const currentCard = cards[currentIndex]

  const openPack = useCallback(async () => {
    setPhase('loading')
    setError(null)
    try {
      const pack = await generatePack(setId)
      setCards(pack)
      setCurrentIndex(0)
      setRevealedCards([])
      setIsFlipped(false)
      setIsTransitioning(false)
      setPhase('revealing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open pack')
      setPhase('ready')
    }
  }, [setId])

  const handleCardClick = useCallback(() => {
    if (isTransitioning) return
    if (!isFlipped) {
      // First click: flip the card face-up
      setIsFlipped(true)
    } else {
      // Second click: send it to the strip
      setIsTransitioning(true)
    }
  }, [isTransitioning, isFlipped])

  const handleExitComplete = useCallback(() => {
    if (!isTransitioning) return
    const card = cards[currentIndex]
    const next = currentIndex + 1
    setRevealedCards((prev) => [...prev, card])
    if (next >= cards.length) {
      setPhase('done')
      onPackOpened({ cards, setId, openedAt: new Date().toISOString() })
    } else {
      setCurrentIndex(next)
      setIsFlipped(false)
      setIsTransitioning(false)
    }
  }, [isTransitioning, cards, currentIndex, setId, onPackOpened])

  const reset = useCallback(() => {
    setCards([])
    setCurrentIndex(0)
    setRevealedCards([])
    setIsFlipped(false)
    setIsTransitioning(false)
    setPhase('ready')
  }, [])

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background: `linear-gradient(135deg, ${setInfo.gradient[0]}, ${setInfo.gradient[1]}, ${setInfo.gradient[2]})`,
      }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          ← Back to Sets
        </button>
        <h2
          className="text-2xl font-bold"
          style={{ color: setInfo.accent, textShadow: `0 0 12px ${setInfo.accent}88` }}
        >
          {setInfo.name}
        </h2>
        <Link
          href="/collection"
          className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          Collection →
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-900/50 p-4 text-center text-red-300">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {/* Ready */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center py-20"
          >
            {/* Animated pack graphic with set logo */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-10 flex h-64 w-48 flex-col items-center justify-center overflow-hidden rounded-2xl border-4 shadow-2xl"
              style={{
                borderColor: setInfo.accent,
                background: `linear-gradient(160deg, ${setInfo.gradient[1]}, ${setInfo.gradient[0]})`,
                boxShadow: `0 0 40px ${setInfo.accent}66, 0 20px 60px rgba(0,0,0,0.5)`,
              }}
            >
              <img
                src={setInfo.logoUrl}
                alt={setInfo.name}
                className="max-h-28 max-w-[160px] object-contain"
                style={{ filter: `drop-shadow(0 0 12px ${setInfo.accent}cc)` }}
                draggable={false}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              {/* Fallback for logo load error */}
              <div style={{ display: 'none' }}>
                <div className="text-6xl">⚡</div>
                <div className="mt-4 text-center text-lg font-bold" style={{ color: setInfo.accent }}>
                  {setInfo.name}
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-400">Booster Pack</div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openPack}
              className="rounded-2xl px-10 py-4 text-xl font-bold text-black shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${setInfo.accent}, ${setInfo.accent}bb)`,
                boxShadow: `0 0 20px ${setInfo.accent}88`,
              }}
            >
              Open Pack!
            </motion.button>
          </motion.div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="mb-6 h-16 w-16 rounded-full border-4 border-transparent"
              style={{ borderTopColor: setInfo.accent }}
            />
            <p className="text-gray-400">Shuffling the deck...</p>
          </motion.div>
        )}

        {/* Revealing / Done */}
        {(phase === 'revealing' || phase === 'done') && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            {phase === 'revealing' && (
              <div className="mb-4 text-sm text-gray-400">
                Card {Math.min(currentIndex + 1, cards.length)} of {cards.length}
              </div>
            )}

            {/* Spotlight */}
            <div className="mb-12 flex min-h-96 items-center justify-center">
              <AnimatePresence onExitComplete={handleExitComplete}>
                {phase === 'revealing' && !isTransitioning && currentCard && (
                  <motion.div
                    key={currentIndex}
                    initial={{ y: -50, opacity: 0, scale: 0.85 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 60, opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
                    className="flex cursor-pointer flex-col items-center gap-4"
                    onClick={handleCardClick}
                  >
                    <motion.div
                      style={{
                        transformStyle: 'preserve-3d',
                        width: 260,
                        height: 364,
                      }}
                      animate={{
                        rotateY: isFlipped ? 180 : 0,
                        rotateZ: isFlipped ? [0, -6, 0] : 0,
                        y: isFlipped ? [0, -24, 0] : 0,
                        x: isFlipped ? [0, 16, 0] : 0,
                      }}
                      transition={{
                        rotateY: { duration: 0.7, type: 'spring', stiffness: 70, damping: 13 },
                        rotateZ: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                        y: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                        x: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                      }}
                    >
                      {/* Back face */}
                      <div
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          position: 'absolute',
                          inset: 0,
                        }}
                      >
                        <CardBack accent={setInfo.accent} />
                      </div>

                      {/* Front face */}
                      <div
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          position: 'absolute',
                          inset: 0,
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <SpotlightFront card={currentCard} setInfo={setInfo} />
                      </div>
                    </motion.div>

                    {/* Rarity badge — shown once flipped, lives outside the card */}
                    <AnimatePresence>
                      {isFlipped && currentCard.slot === 'holo' && (
                        <motion.div
                          key="holo-badge"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            background: [
                              'linear-gradient(90deg,rgba(168,85,247,.9),rgba(59,130,246,.9))',
                              'linear-gradient(90deg,rgba(59,130,246,.9),rgba(236,72,153,.9))',
                              'linear-gradient(90deg,rgba(236,72,153,.9),rgba(168,85,247,.9))',
                            ],
                          }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ opacity: { duration: 0.25 }, y: { duration: 0.25 }, background: { duration: 2.4, repeat: Infinity } }}
                          className="rounded-full px-4 py-1.5 text-xs font-bold text-white"
                        >
                          ✨ HOLO RARE
                        </motion.div>
                      )}
                      {isFlipped && currentCard.slot === 'rare' && (
                        <motion.div
                          key="rare-badge"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.25 }}
                          className="rounded-full px-4 py-1.5 text-xs font-bold text-white"
                          style={{
                            background: 'linear-gradient(90deg,rgba(180,130,0,.9),rgba(255,215,0,.9))',
                            boxShadow: '0 0 10px rgba(255,215,0,.7)',
                          }}
                        >
                          ⭐ RARE
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pill below the card */}
                    <motion.span
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)' }}
                    >
                      {isFlipped ? 'Click to continue →' : 'Click to reveal'}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Done */}
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-5"
                >
                  <div className="text-3xl font-extrabold text-white">Pack Complete! 🎉</div>
                  <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={reset}
                      className="rounded-xl px-8 py-3 font-bold text-black"
                      style={{
                        background: `linear-gradient(135deg, ${setInfo.accent}, ${setInfo.accent}bb)`,
                        boxShadow: `0 0 16px ${setInfo.accent}66`,
                      }}
                    >
                      Open Another Pack
                    </motion.button>
                    <Link
                      href="/collection"
                      className="rounded-xl border px-8 py-3 text-center font-bold text-white transition-colors hover:bg-white/10"
                      style={{ borderColor: setInfo.accent }}
                    >
                      View Collection
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Revealed strip */}
            {revealedCards.length > 0 && (
              <div className="w-full">
                <p className="mb-3 text-center text-xs uppercase tracking-widest text-gray-500">
                  Opened Cards
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {revealedCards.map((card, i) => (
                    <motion.div
                      key={card.id + '-' + i}
                      initial={{ scale: 0, opacity: 0, y: -20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
                    >
                      <Card card={card} compact onClick={() => setZoomedCard(card)} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {zoomedCard && <CardModal card={zoomedCard} onClose={() => setZoomedCard(null)} />}
    </div>
  )
}
