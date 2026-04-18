---
title: Reactivity
status: draft
summary: Stores, derived signals, and re-render granularity
tags: [ui, reactivity]
deps: [doc02.02, doc02.03]
---

# Reactivity

What reactive primitives are needed to flow state changes to the component tree (doc02.05)?

## Stores

| Store | Type | Holds | Mutators |
|---|---|---|---|
| `gameStore` | signal of immutable `GameState` | current `GameState` (doc02.02) | replaced wholesale by `applyAction(state, action)`; never mutated in place |
| `uiStore` | SolidJS store (deep proxy) | `UIState` (doc02.03) | `dragStart`, `dragMove`, `dragEnd`, `openModal`, `closeModal` |
| `historyStore` | SolidJS store | `{ snapshots: GameState[], head: number }` — undo/redo stack | `push(state)` on apply; `undo()` / `redo()` move `head`; `truncateForward()` on push after undo |
| `timerStore` | SolidJS store | `{ elapsedMs: number, running: boolean }` | `tick`, `start`, `pause`, `reset` |

`gameStore` is a **signal of an immutable object**, not a deep proxy. The decision settles doc02.04's prior open question — full undo/redo (doc02.05 catalog) requires snapshotting, and snapshotting an immutable object is a free pointer-copy. The granularity cost is paid by per-pile memos (`cascade(i)`, `freecell(i)`, etc.) rather than by store proxying.

## Derived signals (memos)

| Memo | Computed from | Used by |
|---|---|---|
| `legalActions` | `gameStore` | drop targets to test legality on pointerup |
| `legalTargets` | `legalActions`, `uiStore.drag.sourceId` | (v1: no consumer — retained for potential future drop-highlight polish; see doc02.05 §5) |
| `autoTarget(card)` | `gameStore` | `Card` double-click handler (doc02.02) |
| `isWon` | `gameStore.foundations` | `WinOverlay`, game-lifecycle transition |
| `isStuck` | `legalActions`, `isWon` | `LoseOverlay`, game-lifecycle transition |
| `isGameOver` | `isWon`, `isStuck` | `timerStore` pause trigger |
| `canUndo` | `historyStore.head`, `isWon` | `UndoButton` enabled/disabled (false when `isWon`) |
| `canRedo` | `historyStore.head`, `historyStore.snapshots.length` | `RedoButton` enabled/disabled |
| `moveCount` | `historyStore.head` | `MoveCounter` canonical (current-branch) display |
| `moveCountLifetime` | counter inside `applyAction` (reset on `NEW_GAME` / `RESTART_GAME`) | `MoveCounter` parenthesised (lifetime) display |

## Cross-store effects

| Trigger | Effect |
|---|---|
| `applyAction` returns `ok` | `historyStore.push(newState)`; `truncateForward` if `head` was not at tip |
| `historyStore.undo()` / `redo()` | `gameStore` ← `snapshots[head]`; timer not affected (per product decision) |
| `gameStore` enters `isWon` | `timerStore.pause()`; `canUndo` is forced `false` (no undoing out of a win) |
| `gameStore` enters `isStuck` | `timerStore.pause()`; `canUndo` remains as-is — the user can undo back into a playable position |
| `NEW_GAME` or `RESTART_GAME` action | `historyStore` cleared, `timerStore.reset()` then `start()` |
| Page load | fresh `deal(seed)` and empty stores — no persistence |

`historyStore.snapshots` is unbounded — FreeCell games top out around a couple hundred moves and snapshots are pointer-copies of immutable `GameState` (doc02.02), so memory is not a concern.

## Move counter — two values

`MoveCounter` displays `head` as the canonical count and a parenthesised monotonic count. Two memos drive it:

| Memo | Computed from | Behaviour on undo |
|---|---|---|
| `moveCount` | `historyStore.head` | decreases |
| `moveCountLifetime` | counter incremented inside `applyAction` and reset by `NEW_GAME` / `RESTART_GAME` | never decreases mid-game |

Display format: `47 (52)` — current branch length, lifetime moves in parens. The lifetime number gives the player a sense of "effort spent" even while exploring undo branches.

## Persistence

Game state does not survive a page reload. Refresh = new deal. Out of scope for v1; can be added later as a sibling `persistenceStore` that snapshots `gameStore` + `historyStore` + `timerStore` + `seed` to localStorage.

## Granularity rule

Components subscribe to the smallest slice they render. `FreecellSlot[i]` reads `freecells[i]`, not the whole `gameStore`. Per-pile memos (`cascade(i)`, `freecell(i)`, `foundation(i)`) wrap `gameStore()` so only affected slots re-render when `applyAction` runs.

(The `legalTargets` memo exists as an `O(1)` slot-lookup helper but has no v1 consumer; drop resolution in `dragInput` queries `legalActions()` directly.)

`timerStore.elapsedMs` ticks at 1 Hz — well below the >30 Hz threshold (doc02.05 §3) — so it does not force special granularity beyond the `Timer` component subscribing to it.

## Open questions

- None blocking implementation. Persistence is deferred to v2; snapshot representation is settled (full pointer-copies of immutable `GameState`).
