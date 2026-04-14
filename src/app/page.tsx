'use client'

import { useState, useCallback } from 'react'
import { SetId, PackResult } from '@/types'
import SetSelector from '@/components/SetSelector'
import PackOpener from '@/components/PackOpener'
import { useCollection } from '@/hooks/useCollection'

export default function Home() {
  const [selectedSet, setSelectedSet] = useState<SetId | null>(null)
  const { addPack } = useCollection()

  const handleSelectSet = useCallback((setId: SetId) => {
    setSelectedSet(setId)
  }, [])

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
      />
    )
  }

  return <SetSelector onSelectSet={handleSelectSet} />
}
