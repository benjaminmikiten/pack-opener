'use client'

import { useState, useCallback } from 'react'
import { SetId, PackResult } from '@/types'
import { SET_MAP } from '@/lib/sets'
import SetSelector from '@/components/SetSelector'
import PackOpener from '@/components/PackOpener'
import { useCollection } from '@/hooks/useCollection'
import { useEconomy } from '@/hooks/useEconomy'
import { useSettings } from '@/hooks/useSettings'

export default function Home() {
  const [selectedSet, setSelectedSet] = useState<SetId | null>(null)
  const [selectedPackPrice, setSelectedPackPrice] = useState(0)
  const { addPack } = useCollection()
  const { balance, hydrated, deductPackCost } = useEconomy()
  const { economyEnabled, hardModeEnabled } = useSettings()

  const handleSelectSet = useCallback(
    (setId: SetId) => {
      const set = SET_MAP[setId]
      const price = hardModeEnabled ? set.hardModePrice : set.price
      if (economyEnabled) {
        const ok = deductPackCost(price)
        if (!ok) return
      }
      setSelectedPackPrice(price)
      setSelectedSet(setId)
    },
    [economyEnabled, hardModeEnabled, deductPackCost]
  )

  const handleBack = useCallback(() => setSelectedSet(null), [])

  const handlePackOpened = useCallback((pack: PackResult) => addPack(pack), [addPack])

  if (selectedSet) {
    return (
      <PackOpener
        setId={selectedSet}
        onBack={handleBack}
        onPackOpened={handlePackOpened}
        packPrice={selectedPackPrice}
      />
    )
  }

  return (
    <SetSelector
      onSelectSet={handleSelectSet}
      balance={balance}
      hydrated={hydrated}
      economyEnabled={economyEnabled}
      hardModeEnabled={hardModeEnabled}
    />
  )
}
