'use client'

import { MotionConfig } from 'framer-motion'
import { useSettings } from '@/hooks/useSettings'

export default function AnimationProvider({ children }: { children: React.ReactNode }) {
  const { animationsEnabled } = useSettings()
  return (
    <MotionConfig reducedMotion={animationsEnabled ? 'never' : 'always'}>
      {children}
    </MotionConfig>
  )
}
