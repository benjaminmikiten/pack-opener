# Pokemon TCG Pack Opener

A web app that simulates opening classic Pokemon Trading Card Game booster packs. Real card data, authentic rarity odds, and satisfying flip animations — just like cracking packs at the kitchen table in 1999.

## Features

- **5 classic WOTC sets** — Base Set, Jungle, Fossil, Base Set 2, Team Rocket
- **Authentic pack composition** — 11 cards in correct reveal order (energy → commons → uncommons → rare/holo)
- **Real card data** from the [Pokemon TCG API](https://api.pokemontcg.io/v2)
- **33% holo pull rate** reflecting real-world odds
- **3D flip animations** with holographic shimmer on holo rares
- **Persistent collection** — browse, search, filter, and sort every card you've pulled
- **Optional economy system** — spend virtual currency to open packs, earn points per flip
- **Accessibility** — animations can be disabled; keyboard + touch support throughout

## Tech Stack

| | |
|---|---|
| Framework | Next.js (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Animations | Framer Motion |
| Language | TypeScript |
| Testing | Vitest + React Testing Library |
| Data | Pokemon TCG API |
| Storage | Browser localStorage |
| Deployment | Static export (GitHub Pages compatible) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm test        # run tests
npm run lint    # lint
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and layout
│   ├── page.tsx          # Home (set selection / pack opening)
│   └── collection/       # Collection browser
├── components/           # UI components
│   ├── PackOpener.tsx    # Card reveal interface
│   ├── SetSelector.tsx   # Set selection grid
│   ├── Card.tsx          # Individual card (flip animation)
│   ├── CollectionView.tsx
│   ├── CardModal.tsx     # Fullscreen card detail with 3D tilt
│   └── NavBar.tsx        # Nav + settings
├── hooks/                # State management hooks
│   ├── useCollection.ts
│   ├── useEconomy.ts
│   └── useSettings.ts
├── lib/                  # Core logic
│   ├── packGenerator.ts  # Pack composition algorithm
│   ├── api.ts            # Pokemon TCG API + caching
│   ├── sets.ts           # Set metadata
│   └── collection.ts     # localStorage persistence
└── types/                # TypeScript interfaces
```
