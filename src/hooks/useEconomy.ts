'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'pack-opener-economy'
const STARTING_BALANCE = 10.0
// 10 points = $3.00. A full pack (11 flips) earns $3.30 back, covering any pack price.
const POINTS_PER_REDEMPTION = 10
const DOLLARS_PER_REDEMPTION = 3.0

interface Wallet {
  balance: number
  points: number
}

// getSnapshot must return a stable reference to avoid infinite re-renders
let lastRaw: string | null = undefined as unknown as null
let cachedWallet: Wallet = { balance: STARTING_BALANCE, points: 0 }

function getSnapshot(): Wallet {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }
  if (raw === lastRaw) return cachedWallet
  lastRaw = raw
  try {
    cachedWallet = raw ? (JSON.parse(raw) as Wallet) : { balance: STARTING_BALANCE, points: 0 }
  } catch {
    cachedWallet = { balance: STARTING_BALANCE, points: 0 }
  }
  return cachedWallet
}

const SERVER_SNAPSHOT: Wallet = { balance: STARTING_BALANCE, points: 0 }

function getServerSnapshot(): Wallet {
  return SERVER_SNAPSHOT
}

function writeWallet(w: Wallet) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w))
  } catch {
    // ignore
  }
}

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify() {
  lastRaw = undefined as unknown as null // force cache invalidation
  listeners.forEach((cb) => cb())
}

export function useEconomy() {
  const wallet = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const deductPackCost = useCallback((price: number): boolean => {
    const current = getSnapshot()
    if (current.balance < price) return false
    writeWallet({ ...current, balance: parseFloat((current.balance - price).toFixed(2)) })
    notify()
    return true
  }, [])

  const earnPoint = useCallback(() => {
    const current = getSnapshot()
    writeWallet({ ...current, points: current.points + 1 })
    notify()
  }, [])

  const redeemPoints = useCallback(() => {
    const current = getSnapshot()
    const blocks = Math.floor(current.points / POINTS_PER_REDEMPTION)
    if (blocks === 0) return
    writeWallet({
      balance: parseFloat((current.balance + blocks * DOLLARS_PER_REDEMPTION).toFixed(2)),
      points: current.points - blocks * POINTS_PER_REDEMPTION,
    })
    notify()
  }, [])

  const redeemableBlocks = Math.floor(wallet.points / POINTS_PER_REDEMPTION)

  return {
    balance: wallet.balance,
    points: wallet.points,
    redeemableAmount: redeemableBlocks * DOLLARS_PER_REDEMPTION,
    hydrated: wallet !== SERVER_SNAPSHOT,
    deductPackCost,
    earnPoint,
    redeemPoints,
  }
}
