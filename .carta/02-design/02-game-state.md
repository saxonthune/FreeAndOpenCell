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

## State machine

See `.statemachines/game.json` for the lifecycle (`idle → dealing → playing → won`). The machine is intentionally coarse — almost all logic is in `legalActions` and `applyAction`, not in transitions.

## Open questions

- Card identity for stable render keys: `${suit}${rank}` string, or numeric ID 0..51?
- Deal randomness: seeded (reproducible / shareable game IDs) or `Math.random()`?
- Stuck/loss detection: compute eagerly after each action, or only on demand?
- Should `applyAction` return the new state, or also a delta/event for animation hooks?
