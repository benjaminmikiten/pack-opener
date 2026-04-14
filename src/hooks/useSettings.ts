'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'pack-opener-settings'

interface Settings {
  economyEnabled: boolean
}

const DEFAULT: Settings = { economyEnabled: true }

let lastRaw: string | null = undefined as unknown as null
let cachedSettings: Settings = { ...DEFAULT }

function getSnapshot(): Settings {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }
  if (raw === lastRaw) return cachedSettings
  lastRaw = raw
  try {
    cachedSettings = raw ? (JSON.parse(raw) as Settings) : { ...DEFAULT }
  } catch {
    cachedSettings = { ...DEFAULT }
  }
  return cachedSettings
}

const SERVER_SNAPSHOT: Settings = { ...DEFAULT }

function getServerSnapshot(): Settings {
  return SERVER_SNAPSHOT
}

function writeSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
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

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setEconomyEnabled = useCallback((enabled: boolean) => {
    writeSettings({ ...getSnapshot(), economyEnabled: enabled })
    notify()
  }, [])

  return {
    economyEnabled: settings.economyEnabled,
    setEconomyEnabled,
  }
}
