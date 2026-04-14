'use client'

import { useCollection } from '@/hooks/useCollection'
import CollectionView from '@/components/CollectionView'

export default function CollectionPage() {
  const { collection, clear } = useCollection()

  return <CollectionView collection={collection} onClear={clear} />
}
