'use client'

import { useState, useCallback } from 'react'
import { CollectionEntry, PackResult } from '@/types'
import { getCollection, addPackToCollection, clearCollection } from '@/lib/collection'

export function useCollection() {
  const [collection, setCollection] = useState<CollectionEntry[]>(() => getCollection())

  const addPack = useCallback((pack: PackResult) => {
    addPackToCollection(pack)
    setCollection(getCollection())
  }, [])

  const clear = useCallback(() => {
    clearCollection()
    setCollection([])
  }, [])

  return { collection, addPack, clear }
}
