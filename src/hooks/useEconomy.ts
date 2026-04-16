'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'pack-opener-economy'
const STARTING_BALANCE = 10.0
export const HARD_MODE_STARTING_BALANCE = 500.0

interface Wallet {
  balance: number
}

let lastRaw: string | null = undefined as unknown as null
let cachedWallet: Wallet = { balance: STARTING_BALANCE }

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
    cachedWallet = raw ? (JSON.parse(raw) as Wallet) : { balance: STARTING_BALANCE }
  } catch {
    cachedWallet = { balance: STARTING_BALANCE }
  }
  return cachedWallet
}

const SERVER_SNAPSHOT: Wallet = { balance: STARTING_BALANCE }

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
  lastRaw = undefined as unknown as null
  listeners.forEach((cb) => cb())
}

export function useEconomy() {
  const wallet = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const deductPackCost = useCallback((price: number): boolean => {
    const current = getSnapshot()
    if (current.balance < price) return false
    writeWallet({ balance: parseFloat((current.balance - price).toFixed(2)) })
    notify()
    return true
  }, [])

  const addFunds = useCallback((amount: number) => {
    const current = getSnapshot()
    writeWallet({ balance: parseFloat((current.balance + amount).toFixed(2)) })
    notify()
  }, [])

  const resetEconomy = useCallback((amount: number = STARTING_BALANCE) => {
    writeWallet({ balance: amount })
    notify()
  }, [])

  return {
    balance: wallet.balance,
    hydrated: wallet !== SERVER_SNAPSHOT,
    deductPackCost,
    addFunds,
    resetEconomy,
  }
}
