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
      "items": { "type": "integer", "minimum": 0, "maximum": 13 },
      "description": "Index 0..3 → suit H,D,C,S. Value is the highest rank placed (0 = empty)."
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
| INV-1 | Total card count is always 52 | cascades + non-null freecells + foundations |
| INV-2 | No card appears twice | uniqueness over `(suit, rank)` |
| INV-3 | In any cascade, adjacent cards alternate color and descend by rank | red ↔ black; `rank[i+1] == rank[i] − 1` |
| INV-4 | `foundations[suit] = N` means ranks 1..N of that suit are placed | scalar tracks the highest placed rank |

## Legal action types

| ID | Action | Preconditions | Effect |
|---|---|---|---|
| ACT-1 | Move card to empty freecell | source is top of any pile; target freecell is `null` | freecell ← source; remove from origin |
| ACT-2 | Move card to foundation | source is top of any pile; `foundations[source.suit] == source.rank − 1` | foundation increments; remove source |
| ACT-3 | Move card to cascade | source is top of pile; target cascade top has opposite color and rank `= source.rank + 1`, OR target cascade is empty | append source to target |
| ACT-4 | Move N-card sequence between cascades | sequence valid per INV-3; head accepted by target per ACT-3; `N ≤ (1 + free freecells) × 2^(empty cascades)` | move all N cards |

## Derived predicates

Pure functions over `GameState`. Live alongside `legalActions` / `applyAction`. The reactivity layer (doc02.04) memoizes them.

| Function | Body | Used by |
|---|---|---|
| `isWon(state)` | `state.foundations.every(n => n === 13)` | `WinOverlay` (doc02.05) |
| `isStuck(state)` | `legalActions(state).length === 0 && !isWon(state)` | `LoseOverlay` (doc02.05) |
| `autoTarget(card, state)` | foundation pile id where `card` legally lands, or `null` | `Card` double-click handler |

`isStuck` uses the immediate-legal-moves definition: "no move exists right now." It does *not* attempt to detect deeper unsolvable positions (which would require search). In practice the player rarely reaches an immediate-stuck state in FreeCell; the overlay is a fallback, not a guarantee of solvability.

## State machine

See the doc02.02 sidecar `02-game.json` for the lifecycle (`idle → dealing → playing → won | lost`). `dealing` transitions instantly to `playing` (no animation per product decision). `lost` is entered when `isStuck` becomes true; both `won` and `lost` are terminal for a session and pause the timer (doc02.04). `lost` is *not* sticky — undoing back into a position with legal moves returns the game to `playing`. `won` is sticky: once reached, undo is disabled (doc02.04).

The machine is intentionally coarse — almost all logic is in `legalActions` and `applyAction`, not in transitions.

## Card identity

Each card's stable id is its suit+rank string: `"H7"`, `"SK"`, `"DA"` (rank `1` → `"A"`, `11` → `"J"`, `12` → `"Q"`, `13` → `"K"`). Uniqueness is guaranteed by the deck (one of each). This is the key used for SolidJS `<For>` lists and the `data-card-id` DOM attribute.

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
