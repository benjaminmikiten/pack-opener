'use client'

import { useState, useCallback } from 'react'
import { SetId, PackResult } from '@/types'
import { SET_MAP } from '@/lib/sets'
import SetSelector from '@/components/SetSelector'
import PackOpener from '@/components/PackOpener'
import { useCollection } from '@/hooks/useCollection'
import { useEconomy } from '@/hooks/useEconomy'

export default function Home() {
  const [selectedSet, setSelectedSet] = useState<SetId | null>(null)
  const { addPack } = useCollection()
  const economy = useEconomy()

  const handleSelectSet = useCallback(
    (setId: SetId) => {
      const price = SET_MAP[setId].price
      const ok = economy.deductPackCost(price)
      if (ok) setSelectedSet(setId)
    },
    [economy]
  )

  const handleBack = useCallback(() => {
    setSelectedSet(null)
  }, [])

  const handlePackOpened = useCallback(
    (pack: PackResult) => {
      addPack(pack)
    },
    [addPack]
  )

  if (selectedSet) {
    return (
      <PackOpener
        setId={selectedSet}
        onBack={handleBack}
        onPackOpened={handlePackOpened}
        onFlip={economy.earnPoint}
      />
    )
  }

  return (
    <SetSelector
      onSelectSet={handleSelectSet}
      balance={economy.balance}
      points={economy.points}
      redeemableAmount={economy.redeemableAmount}
      onRedeem={economy.redeemPoints}
      hydrated={economy.hydrated}
    />
  )
}
