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
  "required": ["drag", "modal", "snap"],
  "properties": {
    "drag": {
      "oneOf": [
        { "type": "null", "description": "implicit phase: idle" },
        {
          "type": "object",
          "required": ["phase", "sourceId", "pointer"],
          "properties": {
            "phase":            { "enum": ["pressing", "dragging", "snapping", "cancelling"] },
            "sourceId":         { "type": "string", "description": "encoded location, e.g. 'cascade.3.5', 'freecell.0'" },
            "span":             { "type": "integer", "minimum": 1, "default": 1 },
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
    "modal": {
      "enum": ["menu", "about", null],
      "description": "Which (if any) modal layer is visible. Mutually exclusive."
    },
    "snap": {
      "type": "object",
      "properties": {
        "proximityThresholdPx":  { "type": "integer", "default": 30 },
        "dragStartThresholdPx":  { "type": "integer", "default": 5 }
      }
    }
  }
}
```

`drag === null` is shorthand for `phase === 'idle'`. The action catalog (doc02.05 §2) uses `drag.phase === 'idle'` as the canonical idiom.

## Ephemeral vs persistent

| Field | Ephemeral? | Notes |
|---|---|---|
| `drag.*` | yes | resets to `null` after every drag completion |
| `modal` | yes | resets to `null` on close |
| `snap.proximityThresholdPx` | no (config) | could become a user preference later |
| `snap.dragStartThresholdPx` | no (config) | distance (px) pointer must travel before press promotes to drag |

Anything game-affecting (move applied, undo) lives in `GameState`, not here. Ending a drag triggers a `GameState` action; the drag itself does not.

## State machine

See the doc02.03 sidecar `03-ui-drag.json` for the drag lifecycle: `idle → pressing → dragging → (snapping | cancelling) → idle`.

### Press vs drag

A pointer-down that never moves enough to cross `snap.dragStartThresholdPx` (5 px) is a click, not a drag. During `pressing` the DOM is unchanged — the card element is not removed from its slot. This DOM stability is what allows the browser to dispatch native `click` and `dblclick` events on the card. If we entered `dragging` immediately on pointer-down (as before this change), the card element would be destroyed and recreated between click #1 and click #2, preventing the browser from ever firing `dblclick`. The `pressing` phase exists solely to hold pointer-down state without mutating the DOM until the threshold is crossed.

## Bridge to game logic

The drag machine queries the game engine but never writes to it:

- On `POINTER_DOWN`: compute the movable span beneath the pointer (auto-stack-select; see below), store `sourceId` and `span`, enter `dragging`.
- On `POINTER_MOVE`: update `pointer`; recompute `hoveredTargetId` from the bounding-box overlap rule below.
- On `POINTER_UP`: resolve `targetId` and outcome per the drop-outcome table; if legal, dispatch a single `MOVE_STACK { from, count, to }` action via `applyAction`.

## Drop-outcome table

Drop targets are resolved by **bounding-box overlap** between the dragged card's rect and each slot's rect at pointer-up. No proximity-radius math; targets are non-overlapping in layout (doc02.06) so each pointer position resolves to at most one candidate slot.

| Dragged-card rect | `legalActions` includes move | Outcome | Drag transition |
|---|---|---|---|
| overlaps exactly one slot | yes | apply move; ghost snaps to slot | `POINTER_UP_LEGAL → snapping → idle` |
| overlaps exactly one slot | no | reject; ghost returns to source | `POINTER_UP_ILLEGAL → cancelling → idle` |
| overlaps multiple slots | any legal | pick the slot with the **largest overlap area**; if still tied, deterministic priority `foundation > freecell > cascade` (auto-foundation is the highest-value placement) | `POINTER_UP_LEGAL → snapping → idle` |
| overlaps multiple slots | none legal | reject | `POINTER_UP_ILLEGAL → cancelling → idle` |
| overlaps no slot | n/a | reject | `POINTER_UP_ILLEGAL → cancelling → idle` |

`snap.proximityThresholdPx` is reserved for the snapping animation easing distance — *not* for legality resolution. Legality is purely overlap-based. `snap.dragStartThresholdPx` gates the press→drag promotion and is a different concept: it determines whether a pointer-down becomes a drag at all. `pressing` never reaches drop resolution.

## Auto-stack-select on grab

When the user begins a drag on a card mid-cascade, the engine computes the longest *movable suffix* starting at that card (continuous alternating-color, descending-rank run from the grabbed card to the bottom of the column) and the drag carries the entire span. The whole drop becomes one `MOVE_STACK` action — one entry in the undo history — even though FreeCell rules formally execute it as N single-card moves. Validity of the supermove uses ACT-4 from doc02.02.

## Input modes

- **Pointer (mouse + touch)**: unified via the Pointer Events API. Drag works identically on desktop mouse and on landscape touch. No touch-specific state.
- **Keyboard**: not supported in v1.
- **Mobile portrait**: out of scope. The 8-cascade layout requires landscape aspect; portrait may render broken.

## Open questions

- Pre-drag highlight (showing legal targets before pointer-down): part of `UIState` or computed on demand?
