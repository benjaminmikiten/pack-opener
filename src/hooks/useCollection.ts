'use client'

import { useState, useCallback } from 'react'
import { CollectionStore, PackResult } from '@/types'
import {
  getCollection,
  addPackToCollection,
  sellCards,
  gradeCardInCollection,
  clearCollection,
} from '@/lib/collection'
import { useEconomy } from './useEconomy'

export function useCollection() {
  const [collection, setCollection] = useState<CollectionStore>(() => getCollection())
  const { addFunds } = useEconomy()

  const addPack = useCallback((pack: PackResult) => {
    addPackToCollection(pack)
    setCollection(getCollection())
  }, [])

  const sell = useCallback(
    (items: Array<{ storeKey: string; count: number }>) => {
      const { store, totalValue } = sellCards(items)
      setCollection(store)
      if (totalValue > 0) addFunds(totalValue)
    },
    [addFunds]
  )

  const gradeCard = useCallback((storeKey: string, grade: number) => {
    const { store } = gradeCardInCollection(storeKey, grade)
    setCollection(store)
  }, [])

  const clear = useCallback(() => {
    clearCollection()
    setCollection({})
  }, [])

  return { collection, addPack, sell, gradeCard, clear }
}
