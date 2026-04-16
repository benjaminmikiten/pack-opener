import { SetId, SetInfo } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const SETS: SetInfo[] = [
  {
    id: 'base1',
    name: 'Base Set',
    accent: '#FFD700',
    gradient: ['#0d0d1a', '#1a0a2e', '#0a1628'],
    logoUrl: `${BASE}/logos/base1.png`,
    price: 2.99,
    // Sealed unlimited packs sell for ~$200–500 on the secondary market (2025)
    hardModePrice: 299.99,
  },
  {
    id: 'base2',
    name: 'Jungle',
    accent: '#4CAF50',
    gradient: ['#0a1a0d', '#0d2e1a', '#091a0f'],
    logoUrl: `${BASE}/logos/base2.png`,
    price: 3.29,
    // Sealed unlimited packs average ~$175–190 (2025)
    hardModePrice: 174.99,
  },
  {
    id: 'base3',
    name: 'Fossil',
    accent: '#C0A060',
    gradient: ['#1a1a0a', '#2e2a0a', '#1a160a'],
    logoUrl: `${BASE}/logos/base3.png`,
    price: 3.29,
    // Sealed unlimited packs average ~$175–190 (2025)
    hardModePrice: 174.99,
  },
  {
    id: 'base4',
    name: 'Base Set 2',
    accent: '#60A0FF',
    gradient: ['#0d0d1a', '#1a0a2e', '#0a1628'],
    logoUrl: `${BASE}/logos/base4.png`,
    price: 3.29,
    // Reprints of Base/Jungle cards; lower collector demand (~$50–75)
    hardModePrice: 59.99,
  },
  {
    id: 'base5',
    name: 'Team Rocket',
    accent: '#FF4444',
    gradient: ['#1a0a0a', '#2e0a0a', '#1a0808'],
    logoUrl: `${BASE}/logos/base5.png`,
    price: 3.29,
    // Sealed unlimited packs sell for ~$125–175 (2025)
    hardModePrice: 149.99,
  },
  {
    id: 'gym1',
    name: 'Gym Heroes',
    accent: '#E8C84A',
    gradient: ['#0d1628', '#1a2240', '#0d1a30'],
    logoUrl: 'https://images.pokemontcg.io/gym1/logo.png',
    price: 3.49,
    // Sealed unlimited packs sell for ~$75–125 (2025)
    hardModePrice: 99.99,
  },
  {
    id: 'gym2',
    name: 'Gym Challenge',
    accent: '#C04444',
    gradient: ['#1a0d1a', '#2e1228', '#1a0d20'],
    logoUrl: 'https://images.pokemontcg.io/gym2/logo.png',
    price: 3.49,
    // Sealed unlimited packs sell for ~$75–125 (2025)
    hardModePrice: 99.99,
  },
]

export const SET_MAP: Record<SetId, SetInfo> = Object.fromEntries(
  SETS.map((s) => [s.id, s])
) as Record<SetId, SetInfo>

export const SETS_WITHOUT_ENERGY: SetId[] = ['base2', 'base3', 'base5']
