import { SetId, SetInfo } from '@/types'

export const SETS: SetInfo[] = [
  {
    id: 'base1',
    name: 'Base Set',
    accent: '#FFD700',
    gradient: ['#0d0d1a', '#1a0a2e', '#0a1628'],
    logoUrl: 'https://images.pokemontcg.io/base1/logo.png',
  },
  {
    id: 'base2',
    name: 'Jungle',
    accent: '#4CAF50',
    gradient: ['#0a1a0d', '#0d2e1a', '#091a0f'],
    logoUrl: 'https://images.pokemontcg.io/base2/logo.png',
  },
  {
    id: 'base3',
    name: 'Fossil',
    accent: '#C0A060',
    gradient: ['#1a1a0a', '#2e2a0a', '#1a160a'],
    logoUrl: 'https://images.pokemontcg.io/base3/logo.png',
  },
  {
    id: 'base4',
    name: 'Base Set 2',
    accent: '#60A0FF',
    gradient: ['#0d0d1a', '#1a0a2e', '#0a1628'],
    logoUrl: 'https://images.pokemontcg.io/base4/logo.png',
  },
  {
    id: 'base5',
    name: 'Team Rocket',
    accent: '#FF4444',
    gradient: ['#1a0a0a', '#2e0a0a', '#1a0808'],
    logoUrl: 'https://images.pokemontcg.io/base5/logo.png',
  },
]

export const SET_MAP: Record<SetId, SetInfo> = Object.fromEntries(
  SETS.map((s) => [s.id, s])
) as Record<SetId, SetInfo>

export const SETS_WITHOUT_ENERGY: SetId[] = ['base2', 'base3', 'base5']
