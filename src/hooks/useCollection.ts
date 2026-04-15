'use client'

import { useState, useCallback } from 'react'
import { CollectionStore, PackResult } from '@/types'
import { getCollection, addPackToCollection, sellCards, clearCollection } from '@/lib/collection'
import { useEconomy } from './useEconomy'

export function useCollection() {
  const [collection, setCollection] = useState<CollectionStore>(() => getCollection())
  const { addFunds } = useEconomy()

  const addPack = useCallback((pack: PackResult) => {
    addPackToCollection(pack)
    setCollection(getCollection())
  }, [])

  const sell = useCallback(
    (cardIds: string[]) => {
      const { store, totalValue } = sellCards(cardIds)
      setCollection(store)
      if (totalValue > 0) addFunds(totalValue)
    },
    [addFunds]
  )

  const clear = useCallback(() => {
    clearCollection()
    setCollection({})
  }, [])

  return { collection, addPack, sell, clear }
}
