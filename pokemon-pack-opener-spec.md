# Pokemon TCG Pack Opener — Feature Spec

A web app that simulates opening classic WOTC-era Pokemon TCG booster packs. Real card data, statistically accurate pack composition, persistent collection, optional economy, and a card-by-card animated reveal.

---

## Table of Contents

1. [Supported Sets](#supported-sets)
2. [Pack Generation](#pack-generation)
3. [Card Reveal](#card-reveal)
4. [Collection](#collection)
5. [Economy System](#economy-system)
6. [Settings](#settings)
7. [Visual Design](#visual-design)
8. [Animations](#animations)
9. [Data & API](#data--api)
10. [Routing & Pages](#routing--pages)
11. [Keyboard & Touch](#keyboard--touch)
12. [Storage](#storage)

---

## Supported Sets

Five classic WOTC sets are available:

| Display Name | API ID   | Cards | Commons | Uncommons | Rares | Holo Rares | Pack Price |
|-------------|----------|-------|---------|-----------|-------|------------|------------|
| Base Set    | `base1`  | 102   | 32      | 32        | 16    | 16         | $2.99      |
| Jungle      | `base2`  | 64    | 16      | 16        | 16    | 16         | $3.29      |
| Fossil      | `base3`  | 62    | 16      | 16        | 15    | 15         | $3.29      |
| Base Set 2  | `base4`  | 130   | 42      | 42        | 20    | 20         | $3.29      |
| Team Rocket | `base5`  | 83    | 24      | 24        | 17    | 17         | $3.29      |

Each set has a unique color accent and gradient used throughout the UI when that set is active.

---

## Pack Generation

### Composition

Every pack contains exactly **11 cards** in a fixed slot structure:

| Slot      | Count | Source |
|-----------|-------|--------|
| Energy    | 1     | Random Basic Energy card |
| Common    | 6     | Random sample, no duplicates |
| Uncommon  | 3     | Random sample, no duplicates |
| Rare/Holo | 1     | 33% holo, 67% non-holo |

### Energy Sourcing

Jungle (`base2`), Fossil (`base3`), and Team Rocket (`base5`) do not include Basic Energy cards in their API set data. For packs from these sets, the energy card is pulled from Base Set (`base1`).

### Rarity Odds

The rare slot uses a **33% holo / 67% non-holo** split, reflecting real-world WOTC print run pull rates (not a naive 50/50 pool split).

### Card Rarity Mapping

| API `rarity` value | Pack slot |
|--------------------|-----------|
| `"Common"` | Common |
| `"Uncommon"` | Uncommon |
| `"Rare"` | Non-holo rare |
| `"Rare Holo"` | Holo rare |
| `"Rare Secret"` | Holo rare |
| *(no rarity + supertype Energy + subtype Basic)* | Energy |

### Reveal Order

Cards are always presented in this order, matching the physical experience of flipping through a pack:

1. Energy
2. Commons (×6)
3. Uncommons (×3)
4. Rare or Holo Rare

---

## Card Reveal

### Modes

**Sequential (default):** Cards are revealed one at a time. The user clicks or taps each face-down card to flip it. A 3D rotation animation plays, and the card face is shown. Rarity badges appear after flip.

**Instant ("Rip It Open"):** All cards are revealed simultaneously without individual flips. Triggered by keyboard shortcut `R` on the pack complete screen or via the "Rip It Open" button.

### Phases

The pack opener moves through four phases:

| Phase | Description |
|-------|-------------|
| `ready` | Initial state before opening — shows "Open Pack" button |
| `loading` | API fetch in progress — shows spinner |
| `revealing` | Cards shown face-down, flipped one by one |
| `done` | All cards revealed — shows action buttons |

### Pack Complete Screen

After all cards are flipped, two actions are offered:

- **Open Another Pack** — opens a new pack of the same set (deducts cost if economy is on)
- **Back to Sets** — returns to the set selector

These buttons are always stacked vertically.

### Keyboard Shortcut

Pressing `R` on the pack complete screen triggers "Rip It Open" — revealing all cards at once without individual flips.

---

## Collection

### Overview

Every card opened is saved to a persistent collection. The collection persists across sessions via localStorage.

### Collection Browser

Located at `/collection`. Displays all collected cards as a responsive grid.

### Filtering

| Filter | Options |
|--------|---------|
| Set | All Sets, Base Set, Jungle, Fossil, Base Set 2, Team Rocket |
| Rarity | All Rarities, Holo Rare, Rare, Uncommon, Common, Energy |
| Search | Text search on card name (case-insensitive) |

### Sorting

| Sort Option | Behavior |
|-------------|----------|
| Newest First | Most recently opened cards shown first (default) |
| Oldest First | Reverse chronological order |
| Name A→Z | Alphabetical by card name |
| Name Z→A | Reverse alphabetical |
| Rarity (High→Low) | Holo Rares first, then Rares, Uncommons, Commons, Energy |

### Card Modal

Clicking any card in the collection opens a fullscreen modal with:

- Large card image
- Card name and rarity badge
- 3D parallax tilt effect (responds to mouse movement and touch)
- Close via `Escape` key or clicking outside

### Clear Collection

A "Clear Collection" button (with confirmation) permanently removes all collected cards.

---

## Economy System

The economy system is optional and can be toggled on or off in settings.

### Starting State

| Resource | Starting Value |
|----------|---------------|
| Balance  | $10.00 |
| Points   | 0 |

### Pack Cost

Opening a pack deducts its price from the balance:

- Base Set: **$2.99**
- All other sets: **$3.29**

If economy is enabled and the balance is insufficient, the pack cannot be opened.

### Points

Each individual card flip earns **1 point**. A full pack of 11 cards earns 11 points per pack.

### Redemption

Every **10 points** can be redeemed for **$3.00** added to the balance. This happens automatically when the threshold is reached.

At 11 flips per pack ($3.30 value per full pack), opening packs earns enough to cover their cost over time.

### Display

When economy is enabled, the set selector shows:
- Current balance (e.g. `$8.71`)
- Current points (e.g. `7 pts`)

### Reset

A "Reset Economy" button in settings restores balance to $10.00 and points to 0.

---

## Settings

Settings are accessible via a gear icon in the navigation bar. A modal is displayed with the following toggles:

| Setting | Description | Default |
|---------|-------------|---------|
| Economy Mode | Enable/disable the balance and points system | Off |
| Animations | Enable/disable all motion animations | On |

Settings persist across sessions via localStorage.

---

## Visual Design

### Set Themes

Each set has a unique color identity applied to backgrounds, gradients, and accents:

| Set | Accent Color | Background Gradient |
|-----|-------------|---------------------|
| Base Set | Gold (`#FFD700`) | `#0d0d1a` → `#1a0a2e` → `#0a1628` |
| Jungle | Green (`#4CAF50`) | `#0a1a0d` → `#0d2e1a` → `#091a0f` |
| Fossil | Tan (`#C0A060`) | `#1a1a0a` → `#2e2a0a` → `#1a160a` |
| Base Set 2 | Blue (`#60A0FF`) | `#0d0d1a` → `#1a0a2e` → `#0a1628` |
| Team Rocket | Red (`#FF4444`) | `#1a0a0a` → `#2e0a0a` → `#1a0808` |

### Card Sizing by Slot

| Slot | Width | Notes |
|------|-------|-------|
| Energy | 100px | Slightly faded (opacity 0.85) |
| Common | 120px | Standard |
| Uncommon | 118px | Standard |
| Rare | 150px | Gold glow shadow, gold `⭐ RARE` badge |
| Holo Rare | 158px | Animated purple/blue/pink glow, `✨ HOLO RARE` badge, uses hi-res image |

### Rarity Badges

- **Holo Rare:** `✨ HOLO RARE` — animated gradient label cycling purple → pink → cyan
- **Rare:** `⭐ RARE` — static gold gradient label

### Card Hover

All cards respond to hover with: `translateY(-14px) rotate(2deg) scale(1.06)`, using spring easing (`cubic-bezier(.34, 1.56, .64, 1)`).

---

## Animations

### Framer Motion

| Animation | Details |
|-----------|---------|
| Card flip | `rotateY(0° → 180°)` with spring physics; front/back faces use `backfaceVisibility: hidden` |
| Rarity badge gradient | 2.4s cycling loop |
| Holo glow | Box-shadow pulses between purple, blue, and pink |
| Phase transitions | Scale + opacity via `AnimatePresence` |
| Staggered reveal | Cards animate in with delay based on index |

### CSS Animations

| Animation | Details |
|-----------|---------|
| `holoShimmer` | Rainbow gradient background sweep across holo card, 4s loop |
| Skeleton loaders | `animate-pulse` on image placeholders during load |
| Gradient text | `bg-clip-text` with transparent color on titles |

### Disabling Animations

When animations are disabled in settings, `MotionConfig` is set to `reducedMotion: 'always'`, which globally stops all Framer Motion animations. CSS animations are also suppressed.

---

## Data & API

### Source

All card data is fetched from the **Pokemon TCG API** (free, no auth required for basic use):

```
https://api.pokemontcg.io/v2/cards?q=set.id:{SET_ID}&pageSize=250&select=id,name,rarity,supertype,subtypes,images
```

### Image URLs

```
Small:    https://images.pokemontcg.io/{set_id}/{card_number}.png
Hi-res:   https://images.pokemontcg.io/{set_id}/{card_number}_hires.png
```

Holo rare cards use the hi-res image variant.

### Caching

API responses are cached in memory (`Map<SetId, PokemonCard[]>`) for the duration of the session. Subsequent pack openings from the same set do not re-fetch.

### TypeScript Interfaces

```typescript
interface PokemonCard {
  id: string
  name: string
  rarity?: string
  supertype?: string
  subtypes?: string[]
  images: { small: string; large: string }
  slot?: 'energy' | 'common' | 'uncommon' | 'rare' | 'holo'
}

interface SetInfo {
  id: SetId
  name: string
  accent: string        // hex color
  gradient: string[]    // 3-color background gradient
  logoUrl: string
  price: number
}

interface CollectionEntry {
  card: PokemonCard
  setId: SetId
  openedAt: string      // ISO timestamp
}
```

---

## Routing & Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Shows set selector. When a set is chosen, transitions to pack opener inline. |
| `/collection` | Collection | Filterable, sortable grid of all collected cards. |

---

## Keyboard & Touch

| Trigger | Action |
|---------|--------|
| `R` key (pack complete screen) | Rip It Open — reveal all cards at once |
| `Escape` | Close card modal |
| Mouse move over card modal | 3D parallax tilt |
| Touch move over card modal | 3D parallax tilt (mobile) |

---

## Storage

All state is persisted to `localStorage` with no server-side component.

| Key | Contents |
|-----|----------|
| `pokemon-pack-opener-collection` | `CollectionEntry[]` — all opened cards |
| `pack-opener-economy` | `{ balance: number, points: number }` |
| `pack-opener-settings` | `{ economyEnabled: boolean, animationsEnabled: boolean }` |
