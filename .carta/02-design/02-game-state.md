---
title: Game state
status: draft
summary: GameState shape, invariants, legal-action types
tags: [game, state, schema]
deps: [doc02.01]
---

# Game state

## Artifact: `GameState`

The data shape that fully describes a FreeCell position.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GameState",
  "type": "object",
  "required": ["cascades", "freecells", "foundations"],
  "properties": {
    "cascades": {
      "type": "array",
      "minItems": 8,
      "maxItems": 8,
      "items": { "type": "array", "items": { "$ref": "#/definitions/card" } }
    },
    "freecells": {
      "type": "array",
      "minItems": 4,
      "maxItems": 4,
      "items": { "oneOf": [{ "$ref": "#/definitions/card" }, { "type": "null" }] }
    },
    "foundations": {
      "type": "array",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "oneOf": [
          { "$ref": "#/definitions/card" },
          { "type": "null" }
        ]
      },
      "description": "Four interchangeable foundation slots. Each slot is either empty (null) or pinned to a suit by the ace that was placed there; the card value is the top card of that pile (suit + highest placed rank)."
    }
  },
  "definitions": {
    "card": {
      "type": "object",
      "required": ["suit", "rank"],
      "properties": {
        "suit": { "enum": ["H", "D", "C", "S"] },
        "rank": { "type": "integer", "minimum": 1, "maximum": 13 }
      }
    }
  }
}
```

## Invariants

| ID | Invariant | Notes |
|---|---|---|
| INV-1 | Total card count is always 52 | cascades + non-null freecells + non-null foundations |
| INV-2 | No card appears twice | uniqueness over `(suit, rank)` |
| INV-3 | In any cascade, adjacent cards alternate color and descend by rank | red ↔ black; `rank[i+1] == rank[i] − 1` |
| INV-4 | For each non-null foundation slot `f`, ranks `1..f.rank` of `f.suit` are placed on that pile and absent from cascades/freecells | slots are pinned to a suit by their first card (an ace) |

ACT-2 is atomic. Automatic promotion of subsequently-eligible cards is not a new action type — it is a UI-driven loop that dispatches ACT-2 per card while `isAutoPromotable` holds, so each promotion is its own history entry and undo rewinds one card. The sweep runs after every successful move (ACT-1/2/3/4), since any of them can expose a newly-promotable top-of-pile card. See doc02.04 for the effect wiring.

The four foundation slots start empty and are interchangeable. Dropping an ace onto any empty slot binds that slot to the ace's suit for the rest of the game. Only cards of that suit, in ascending rank, can then be placed on that pile. This is a consequence of ACT-2 + INV-2, not a separate invariant.

## Legal action types

| ID | Action | Preconditions | Effect |
|---|---|---|---|
| ACT-1 | Move card to empty freecell | source is top of any pile; target freecell is `null` | freecell ← source; remove from origin |
| ACT-2 | Move card to foundation | source is top of any pile; target foundation slot `i` is either (a) empty and `source.rank === 1` (ace), or (b) non-null with `foundations[i].suit === source.suit` and `foundations[i].rank === source.rank − 1` | `foundations[i]` ← `source`; remove from origin |
| ACT-3 | Move card to cascade | source is top of pile; target cascade top has opposite color and rank `= source.rank + 1`, OR target cascade is empty | append source to target |
| ACT-4 | Move N-card sequence between cascades | sequence valid per INV-3; head accepted by target per ACT-3; `N ≤ (1 + free freecells) × 2^(empty cascades)` | move all N cards |

## Location encoding

Location strings are the public contract between engine, stores, DOM `data-*` attributes, and the drag-input slot registry. All source and target ids use one of these forms.

| String | Meaning | Used where |
|---|---|---|
| `cascade.<col>` | Append target — cascade column `col` (0..7) | ACT-3/ACT-4 target |
| `cascade.<col>.<row>` | Source — cards from `row` to end of column `col` | ACT-1/2/3/4 source |
| `freecell.<i>` | Freecell slot `i` (0..3), as source or target | ACT-1 target; also source |
| `foundation.<i>` | Foundation slot `i` (0..3), as target | ACT-2 target |

Foundation location strings address positional slots (`foundation.0`..`foundation.3`); the suit of a slot is determined by the first ace placed there and is recovered via `state.foundations[i].suit`.

## Derived predicates

Pure functions over `GameState`. Live alongside `legalActions` / `applyAction`. The reactivity layer (doc02.04) memoizes them.

| Function | Body | Used by |
|---|---|---|
| `isWon(state)` | `state.foundations.every(f => f !== null && f.rank === 13)` | `WinOverlay` (doc02.05) |
| `isStuck(state)` | `legalActions(state).length === 0 && !isWon(state)` | `LoseOverlay` (doc02.05) |
| `autoTarget(card, state)` | first legal target in priority order: (1) foundation slot, (2) non-empty cascade whose top accepts `card`, (3) empty cascade, (4) empty freecell; else `null`. Priority 2-before-3 preserves empty-column value (empty cascades amplify supermove capacity per ACT-4) | `Card` double-click handler |
| `autoFoundationFloor(state)` | `min(f?.rank ?? 0 for f in foundations) + 1` — the highest rank eligible for automatic promotion | `isAutoPromotable` |
| `isAutoPromotable(card, state)` | ACT-2 is legal for `card` AND `card.rank ≤ autoFoundationFloor(state)`. Aces qualify trivially (floor ≥ 1) | post-ACT-2 auto-promotion sweep (doc02.04) |

`isStuck` uses the immediate-legal-moves definition: "no move exists right now." It does *not* attempt to detect deeper unsolvable positions (which would require search). In practice the player rarely reaches an immediate-stuck state in FreeCell; the overlay is a fallback, not a guarantee of solvability.

## State machine

See the doc02.02 sidecar `02-game.json` for the lifecycle (`idle → dealing → playing → won | lost`). `dealing` transitions instantly to `playing` (no animation per product decision). `lost` is entered when `isStuck` becomes true; both `won` and `lost` are terminal for a session and pause the timer (doc02.04). `lost` is *not* sticky — undoing back into a position with legal moves returns the game to `playing`. `won` is sticky: once reached, undo is disabled (doc02.04).

The machine is intentionally coarse — almost all logic is in `legalActions` and `applyAction`, not in transitions.

## Card identity

Each card's stable id is its suit+rank string where rank is the integer 1..13: `"H7"`, `"S13"`, `"D1"`, `"C10"`. Uniqueness is guaranteed by the deck (one of each). This is the key used for SolidJS `<For>` lists and the `data-card-id` DOM attribute.

## Engine API

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function legalActions(state: GameState): Action[];

function applyAction(state: GameState, action: Action): Result<GameState, ActionError>;

function deal(seed: number): GameState;
```

- `applyAction` returns `Result` rather than throwing. Illegal actions are an *expected* outcome (e.g. an in-flight drag becomes illegal because state moved under it), not an exception. UI dispatches into `applyAction` and branches on `ok`.
- `deal` takes a seed (32-bit integer). The seed is surfaced to the user as a "game number" — visible in the menu, included on shareable URLs, and accepted by `NEW_GAME` to reproduce a specific deal. The PRNG is the deterministic Mersenne-Twister-equivalent or similar; choice of algorithm is an implementation detail but it must be stable across versions so the same seed always yields the same deal.

## Open questions

- Snapshot memory representation — full `GameState` clones (default; see doc02.04) or `(seed, action[])` replay. Replay is cheaper but breaks if `applyAction` is non-deterministic.
