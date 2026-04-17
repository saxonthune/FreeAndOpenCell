---
title: Reactivity
status: draft
summary: Stores, derived signals, and re-render granularity
tags: [ui, reactivity]
deps: [doc02.02, doc02.03, doc02.04]
---

# Reactivity

What reactive primitives are needed to flow state changes to the component tree?

## Stores

| Store | Type | Holds | Mutators |
|---|---|---|---|
| `gameStore` | SolidJS store | `GameState` (doc02.02) | `applyAction(action)` is the only mutator |
| `uiStore` | SolidJS store | `UIState` (doc02.03) | `dragStart`, `dragMove`, `dragEnd` |

## Derived signals (memos)

| Memo | Computed from | Used by |
|---|---|---|
| `legalActions` | `gameStore` | drop targets to test legality on pointerup |
| `legalTargets` | `legalActions`, `uiStore.drag.sourceId` | slots, for "valid drop" highlight class |
| `isWon` | `gameStore.foundations` | `GameBoard`, `WinOverlay` |

## Granularity rule

Components subscribe to the smallest slice they render. `FreecellSlot` reads `freecells[i]`, not the whole `gameStore`. This is the boundary that decides what re-renders when `applyAction` runs.

`legalTargets` is a `Set<string>` of pile IDs, so a slot's "is-valid-target" check is `O(1)` and only the affected slots re-render when the dragged card changes.

## Open questions

- `GameState` representation: SolidJS store (deep proxy) or signal-of-immutable-object? The first gives finer-grained reactivity; the second is easier to snapshot for undo.
- Undo/redo: separate stack store, or derived from a log of past actions?
- Persistence (localStorage save/restore): an effect on `gameStore`, or a sibling store?
