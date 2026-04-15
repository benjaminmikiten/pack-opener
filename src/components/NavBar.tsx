'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '@/hooks/useSettings'
import { useEconomy } from '@/hooks/useEconomy'

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
      style={{ background: enabled ? '#facc15' : '#374151' }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0px)' }}
      />
    </button>
  )
}

export default function NavBar() {
  const { economyEnabled, setEconomyEnabled, animationsEnabled, setAnimationsEnabled } = useSettings()
  const { balance, hydrated, resetEconomy } = useEconomy()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const showBalance = economyEnabled && hydrated

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link
            href="/"
            className="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
          >
            ⚡ Pack Opener
          </Link>

          {/* Center: balance */}
          <AnimatePresence>
            {showBalance && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl px-3 py-1.5 text-sm font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                💰 ${balance.toFixed(2)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: nav links + settings */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/collection" className="text-sm text-gray-400 transition-colors hover:text-white">
              Collection
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-gray-500 transition-colors hover:text-white"
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Settings modal */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed left-1/2 top-24 z-50 w-full max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 p-6 shadow-2xl"
              style={{ background: '#111827' }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Settings</h2>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-500 transition-colors hover:text-white"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Economy Mode</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      Packs cost money. Sell cards to earn money back.
                    </div>
                  </div>
                  <Toggle enabled={economyEnabled} onChange={setEconomyEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Animations</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      Card flips, transitions, and motion effects.
                    </div>
                  </div>
                  <Toggle enabled={animationsEnabled} onChange={setAnimationsEnabled} />
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="mb-2">
                    <div className="text-sm font-medium text-white">Reset Economy</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      Restore balance to $10.00.
                    </div>
                  </div>
                  <button
                    onClick={resetEconomy}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300"
                    style={{ border: '1px solid rgba(248,113,113,0.3)' }}
                  >
                    Reset to $10.00
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
