# Pokémon Pack Opener — Technical Spec

A web app that simulates opening a classic WOTC-era Pokémon TCG booster pack. Fetches real card data from a public API, generates a statistically correct pack, and presents the cards in authentic reveal order.

---

## Card Data Source

All card data comes from the **Pokémon TCG API** — free, no auth required for basic use:

```
https://api.pokemontcg.io/v2/cards?q=set.id:{SET_ID}&pageSize=250&select=id,name,rarity,supertype,subtypes,images
```

Card image URLs follow this pattern (also returned by the API):
```
Small:  https://images.pokemontcg.io/{set_id}/{card_number}.png
Large:  https://images.pokemontcg.io/{set_id}/{card_number}_hires.png
```

---

## Supported Sets

| Display Name | API Set ID | Cards | Commons | Uncommons | Rares | Holo Rares |
|-------------|-----------|-------|---------|-----------|-------|------------|
| Base Set    | `base1`   | 102   | 32      | 32        | 16    | 16         |
| Jungle      | `base2`   | 64    | 16      | 16        | 16    | 16         |
| Fossil      | `base3`   | 62    | 16      | 16        | 15    | 15         |
| Base Set 2  | `base4`   | 130   | 42      | 42        | 20    | 20         |
| Team Rocket | `base5`   | 83    | 24      | 24        | 17    | 17         |

Team Rocket also has 1 Rare Secret card (treat as a Rare Holo for pack generation purposes).

---

## Card Rarity Field Values

The API returns a `rarity` string field on each card. The values used in pack generation:

| `rarity` value | Slot in pack |
|----------------|-------------|
| `"Common"`     | Common slot |
| `"Uncommon"`   | Uncommon slot |
| `"Rare"`       | Non-holo rare slot |
| `"Rare Holo"`  | Holo rare slot |
| `"Rare Secret"`| Treat as holo rare |
| *(no rarity)*  | Basic Energy (identified by `supertype == "Energy"` and `subtypes` containing `"Basic"`) |

---

## Pack Composition

Every classic booster pack contains exactly **11 cards**:

| Slot       | Count | Notes |
|------------|-------|-------|
| Energy     | 1     | One random Basic Energy card |
| Common     | 6     | 6 randomly sampled Common cards (no duplicates) |
| Uncommon   | 3     | 3 randomly sampled Uncommon cards (no duplicates) |
| Rare/Holo  | 1     | Either a Rare or Rare Holo (see odds below) |

**Important:** Jungle (`base2`), Fossil (`base3`), and Team Rocket (`base5`) do not include Basic Energy cards in their set data in the API. For packs from these sets, pull the energy card from Base Set (`base1`) — the Basic Energy cards are the same cards that appeared in all classic packs.

---

## Rarity Odds

Each pack contains exactly one rare slot. The split between holo and non-holo:

- **33% chance** of Rare Holo (roughly 1 in 3 packs)
- **67% chance** of non-holo Rare

Implementation:
```python
if random.random() < 0.33:
    rare = random.choice(holo_rares)
else:
    rare = random.choice(non_holo_rares)
```

Note: Base Set and Base Set 2 both have equal numbers of holos and non-holos in the card pool, but the physical print run made holos appear less frequently — the 33% figure reflects the real-world pull rate, not a naive 50/50 pool split.

---

## Card Reveal Order

Cards are presented left-to-right (or top-to-bottom on mobile) in this order, mimicking how you'd flip through a physical pack with the rare face-down at the front:

1. **Energy** (1 card) — the "back" of the pack, revealed first
2. **Commons** (6 cards)
3. **Uncommons** (3 cards)
4. **Rare / Holo Rare** (1 card) — the big reveal, shown last

---

## Visual Design Reference

The working prototype uses a dark themed HTML page with per-set color accents:

| Set         | Background gradient                    | Accent color |
|-------------|----------------------------------------|--------------|
| Base Set    | `#0d0d1a` → `#1a0a2e` → `#0a1628`    | `#FFD700` (gold) |
| Jungle      | `#0a1a0d` → `#0d2e1a` → `#091a0f`    | `#4CAF50` (green) |
| Fossil      | `#1a1a0a` → `#2e2a0a` → `#1a160a`    | `#C0A060` (tan) |
| Base Set 2  | `#0d0d1a` → `#1a0a2e` → `#0a1628`    | `#60A0FF` (blue) |
| Team Rocket | `#1a0a0a` → `#2e0a0a` → `#1a0808`    | `#FF4444` (red) |

**Card sizing:**
- Energy: 100px wide, slightly faded (opacity 0.85)
- Common: 120px wide
- Uncommon: 118px wide
- Non-holo Rare: 150px wide, gold glow shadow, gold name label
- Holo Rare: 158px wide, animated purple/blue/pink glow, uses `_hires.png` image

**Holo animation:** CSS `box-shadow` pulse cycling between purple and pink tones, ~2.4s loop.

**Holo badge:** Animated gradient label above the card reading "✨ HOLO RARE", cycling through purple → pink → cyan.

**Rare badge:** Static gold gradient label reading "⭐ RARE".

**Hover effect on all cards:** `translateY(-14px) rotate(2deg) scale(1.06)` with a spring easing (`cubic-bezier(.34, 1.56, .64, 1)`).

---

## Working Reference Implementation

A working Python script (`open_pack.py`) was already built and validated. Core logic:

```python
import subprocess, json, random
from pathlib import Path

HOLO_CHANCE = 0.33

def fetch_cards(set_id):
    url = f"https://api.pokemontcg.io/v2/cards?q=set.id:{set_id}&pageSize=250&select=id,name,rarity,supertype,subtypes,images"
    result = subprocess.run(["curl", "-s", "--max-time", "30", url], capture_output=True, text=True)
    return json.loads(result.stdout)["data"]

def generate_pack(set_id):
    cards = fetch_cards(set_id)

    # Energy from base1 for sets that don't have their own
    if set_id in ("base2", "base3", "base5"):
        energy_pool = fetch_cards("base1")
        energy_cards = [c for c in energy_pool if c.get("supertype") == "Energy" and "Basic" in c.get("subtypes", [])]
    else:
        energy_cards = [c for c in cards if c.get("supertype") == "Energy" and "Basic" in c.get("subtypes", [])]

    holos    = [c for c in cards if c.get("rarity") in ("Rare Holo", "Rare Secret")]
    rares    = [c for c in cards if c.get("rarity") == "Rare"]
    uncommons = [c for c in cards if c.get("rarity") == "Uncommon"]
    commons   = [c for c in cards if c.get("rarity") == "Common"]

    # Rare slot
    if holos and (not rares or random.random() < HOLO_CHANCE):
        rare = random.choice(holos)
        rare["_slot"] = "holo"
    else:
        rare = random.choice(rares if rares else holos)
        rare["_slot"] = "rare"

    # Build pack in reveal order
    pack = []
    pack.append({**random.choice(energy_cards), "_slot": "energy"})
    pack += [{**c, "_slot": "common"}   for c in random.sample(commons, min(6, len(commons)))]
    pack += [{**c, "_slot": "uncommon"} for c in random.sample(uncommons, min(3, len(uncommons)))]
    pack.append(rare)
    return pack
```

---

## Validated Test Results

The implementation was tested against all 3 target prompts with 100% assertion pass rate:

| Test prompt | Set used | Pull | Real API images? | Correct 11-card pack? |
|-------------|----------|------|-----------------|----------------------|
| "Open a pack of Pokémon cards for me!" | Base Set (random) | Item Finder (Rare) | ✅ | ✅ |
| "I want to crack open a Team Rocket booster pack." | Team Rocket (`base5`) | Rocket's Sneak Attack (Holo Rare) | ✅ | ✅ |
| "Give me a Fossil pack" | Fossil (`base3`) | Raichu (Holo Rare) | ✅ | ✅ |

---

## Suggested App Features

Beyond the basic pack opener, natural extensions include:

- **Set selector UI** — let user choose or randomize the set before opening
- **Pack animation** — card-by-card flip reveal with staggered timing
- **Pull history** — track what you've pulled across multiple packs in a session
- **"Open another pack"** button — re-runs the generation without a page reload
- **Share your pull** — screenshot-friendly card spread view
- **Holo shimmer effect** — CSS background gradient animation on the holo card image itself (rainbow foil simulation)
