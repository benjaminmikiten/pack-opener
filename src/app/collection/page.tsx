'use client'

import { useCollection } from '@/hooks/useCollection'
import CollectionView from '@/components/CollectionView'

export default function CollectionPage() {
  const { collection, sell, gradeCard, clear } = useCollection()

  return <CollectionView collection={collection} onSell={sell} onGrade={gradeCard} onClear={clear} />
}
