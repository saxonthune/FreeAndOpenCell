---
title: UI state
status: draft
summary: Transient interaction state (drag, snap, hover) and its boundary with game state
tags: [ui, state, schema]
deps: [doc02.01, doc02.02]
---

# UI state

## Artifact: `UIState`

Transient interaction state. Lives in a reactive store. Never persisted. Never mutates `GameState` directly.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UIState",
  "type": "object",
  "properties": {
    "drag": {
      "oneOf": [
        { "type": "null" },
        {
          "type": "object",
          "required": ["sourceId", "pointer"],
          "properties": {
            "sourceId":         { "type": "string", "description": "encoded location, e.g. 'cascade.3.5', 'freecell.0'" },
            "pointer":          {
              "type": "object",
              "required": ["x", "y"],
              "properties": { "x": { "type": "number" }, "y": { "type": "number" } }
            },
            "hoveredTargetId":  { "type": ["string", "null"] }
          }
        }
      ]
    },
    "snap": {
      "type": "object",
      "properties": {
        "proximityThresholdPx": { "type": "integer", "default": 30 }
      }
    }
  }
}
```

## Ephemeral vs persistent

| Field | Ephemeral? | Notes |
|---|---|---|
| `drag.*` | yes | resets to `null` after every drag completion |
| `snap.proximityThresholdPx` | no (config) | could become a user preference later |

Anything game-affecting (move applied, undo) lives in `GameState`, not here. Ending a drag triggers a `GameState` action; the drag itself does not.

## State machine

See `.statemachines/ui-drag.json` for the drag lifecycle: `idle → dragging → (snapping | cancelling) → idle`.

## Bridge to game logic

The drag machine queries the game engine but never writes to it:

- On `POINTER_DOWN`: store `sourceId`, enter `dragging`.
- On `POINTER_MOVE`: update `pointer`; recompute `hoveredTargetId` from DOM.
- On `POINTER_UP`: if `legalActions(GameState)` contains a move from `sourceId` to `hoveredTargetId` AND pointer is within `snap.proximityThresholdPx` of the target, dispatch `POINTER_UP_LEGAL` and call `applyAction`. Otherwise dispatch `POINTER_UP_ILLEGAL`.

## Open questions

- Touch and keyboard input: equivalent state shape, or parallel machines?
- Pre-drag highlight (showing legal targets before pointer-down): part of `UIState` or computed on demand?
- Drag of an N-card sequence: encoded in `sourceId` as a range, or a separate `dragSpan` field?
