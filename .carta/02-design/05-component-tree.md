---
title: Component tree
status: draft
summary: SolidJS component tree derived from six partition inventories — state shape, action catalog, mutation rates, read sets, affordances, orthogonal regions.
tags: [ui, components, inventory]
deps: [doc02.02, doc02.03, doc02.04, doc03.02]
---

# Component tree

The rendered surface of the FreeCell app, derived as the output of six inventories. See doc03.02 for the research basis (Parnas, DSM, Cameleon, Suh, Simon).

> **Read order.** §1–§6 are the inventories (the inputs). §7 is the resulting tree (the output). When the tree changes, the inventories must change first.

## Principle

The component tree is an **output**, not an input. It is what falls out when you tabulate:

1. What state exists.
2. What the user can do, and where.
3. How often each field changes.
4. Which region reads what.
5. Which region owns which affordance.
6. Which regions run concurrently.

Each inventory below is one of these. The §7 tree is the result.

## 1. State shape

Already captured. Top-level fields in each store are the first-cut component regions.

- `gameStore` — `cascades[8]`, `freecells[4]`, `foundations[4]` (doc02.02)
- `uiStore` — `drag`, `modal`, `snap` (doc02.03)
- `historyStore` — `snapshots[]`, `head` (doc02.04)
- `timerStore` — `elapsedMs`, `running` (doc02.04)

Each top-level field is a candidate top-level region.

## 2. Action catalog — trigger → DOM region

Every user-initiatable action, with the DOM region that emits it. The DOM-region column is the partition signal: group rows by region → candidate component.

| Action id | Trigger | DOM region | Payload | UI preconditions | Game preconditions |
|---|---|---|---|---|---|
| `OPEN_MENU` | click | `MenuButton` | — | `modal === null` ∧ `drag.phase === 'idle'` | — |
| `CLOSE_MENU` | click | `MenuOverlay` (backdrop or × button) | — | `modal === 'menu'` | — |
| `NEW_GAME` | click | `MenuOverlay` → "New game"; `WinOverlay`; `LoseOverlay` | `{ seed? }` | varies by source | — |
| `RESTART_GAME` | click | `MenuOverlay` → "Restart" | — | `modal === 'menu'` | — |
| `OPEN_ABOUT` | click | `MenuOverlay` → "About" | — | `modal === 'menu'` | — |
| `CLOSE_ABOUT` | click | `AboutModal` (backdrop or × button) | — | `modal === 'about'` | — |
| `UNDO` | click | `UndoButton` | — | `canUndo` ∧ `drag.phase === 'idle'` | — |
| `REDO` | click | `RedoButton` | — | `canRedo` ∧ `drag.phase === 'idle'` | — |
| `DOUBLE_CLICK_CARD` | dblclick | `Card` (top of pile) | `{ sourceId }` | `drag.phase === 'idle'` | `autoTarget(card) !== null` (foundation only) |
| `DRAG_START` | pointerdown | `Card` | `{ sourceId, span }` | `drag.phase === 'idle'` ∧ `modal === null` | `span` derived by auto-stack-select (doc02.03) — must be ≥ 1 movable card |
| `DRAG_MOVE` | pointermove | `Viewport` | `{ pointer }` | `drag.phase === 'dragging'` | — |
| `DRAG_END` | pointerup | `Viewport` | `{ targetId \| null }` | `drag.phase === 'dragging'` | branches per drop-outcome table (doc02.03); if legal, dispatches a single `MOVE_STACK` engine action (one undo-history entry regardless of `span`) |

Once the catalog stabilises it may grow into its own doc with TS discriminated-union derivation; for now it lives here.

## 3. Mutation-rate map

For each state field, how often it's written. Rate cliffs are partition lines.

| Field | Writer | Rate |
|---|---|---|
| `uiStore.drag.pointer` | `DRAG_MOVE` handler | ~60 Hz during drag |
| `uiStore.drag.hoveredTargetId` | `DRAG_MOVE` handler | up to ~10 Hz |
| `uiStore.drag.phase` | drag machine transitions | 2–3× per drag |
| `uiStore.drag.sourceId`, `drag.span` | `DRAG_START`, `DRAG_END` | 2× per drag |
| `uiStore.modal` | `OPEN_*`, `CLOSE_*` | rare |
| `gameStore` (whole) | `applyAction`, `UNDO`, `REDO` | per move |
| `historyStore.head` | `applyAction`, `UNDO`, `REDO` | per move |
| `historyStore.snapshots[]` | `applyAction` (push) | per move |
| `timerStore.elapsedMs` | timer tick (during play) | 1 Hz |
| `timerStore.running` | game lifecycle, `NEW_GAME`, `RESTART_GAME` | rare |

**Rule.** Any field written at >30 Hz must sit behind its own component boundary. `drag.pointer` is the only such field, which forces `DragGhost` to be isolated from the cascade re-render path. `drag.hoveredTargetId` is written at ~10 Hz and has no visual consumer (see §5); it's read only on `POINTER_UP` for drop resolution.

## 4. Read set per candidate region

For each region, the state slices it consumes. Disjoint rows → independent components; overlap indicates either a shared memo (fine) or a missing parent (merge).

| Region | Reads |
|---|---|
| `TopBar` | container only |
| `MenuButton` | `uiStore.modal`, `uiStore.drag.phase` (to disable during drag/modal) |
| `UndoButton` | `canUndo` memo |
| `RedoButton` | `canRedo` memo |
| `MoveCounter` | `moveCount` memo |
| `Timer` | `timerStore.elapsedMs` |
| `FreecellSlot[i]` | `gameStore.freecells[i]` |
| `FoundationSlot[s]` | `gameStore.foundations[s]` |
| `CascadeArea[i]` | `gameStore.cascades[i]` |
| `Card` | one card (prop), `uiStore.drag.sourceId` (placeholder when self is being dragged) |
| `DragGhost` | `uiStore.drag.pointer`, `drag.sourceId`, `drag.span` |
| `MenuOverlay` | `uiStore.modal === 'menu'` |
| `AboutModal` | `uiStore.modal === 'about'` |
| `WinOverlay` | `isWon` memo |
| `LoseOverlay` | `isStuck` memo, `isWon` memo |

Overlap on `isWon`, `isStuck`, etc. is mediated by shared memos (doc02.04) — not a merge signal.

## 5. Affordance rules per region

Visual/interaction feedback each region owns, written as a derived pure function over store state. Affordances scoped to one region force that region to exist as a component.

| Region | Affordance | Rule |
|---|---|---|
| `MenuButton` | enabled/disabled | `modal === null` ∧ `drag.phase === 'idle'` |
| `UndoButton` | enabled/disabled | `canUndo` |
| `RedoButton` | enabled/disabled | `canRedo` |
| `Card` | hover cursor change | `drag.phase === 'idle'` ∧ card is top of pile |
| `DragGhost` | follow pointer with offset | position = `drag.pointer − dragStartOffset` |
| `DragGhost` | snap ease toward nearest legal target within threshold | `nearestLegalTarget(legalTargets, drag.pointer, snap.proximityThresholdPx)` |
| `MenuOverlay` | show/hide | `modal === 'menu'` |
| `AboutModal` | show/hide | `modal === 'about'` |
| `WinOverlay` | fade-in on win | `isWon` |
| `LoseOverlay` | fade-in on stuck | `isStuck` ∧ ¬`isWon` |

If an affordance "crosses" regions, that's a signal the regions share a parent that owns the rule.

### No drag-target affordances

Earlier drafts included green "valid drop" outlines on `FreecellSlot` / `FoundationSlot` and a red-flash "invalid drop" feedback on `CascadeArea`. These are deliberately **not** part of the design:

- Traditional solitaire clients (Microsoft, GNOME, KDE, the web staples) don't pre-highlight legal drops; the player is expected to know the rules.
- Extra outlines compete with card art for attention and flatten the game's tactile feel.
- Illegal-drop flashing is punitive rather than informative — the ghost snap-back animation already communicates the outcome.

The remaining drag affordances (`DragGhost` pointer-follow; `DragGhost` snap-ease on release) are sufficient feedback. The `legalTargets` memo is retained in code as a candidate for future polish but has no consumer in the v1 design.

## 6. Orthogonal regions

Regions that run concurrently without direct interaction.

| Region A | Region B | Relation |
|---|---|---|
| `MenuOverlay` | `AboutModal` | mutually exclusive — single `modal` field, only one value at a time |
| modal layer | drag | mutually exclusive — `modal !== null` disables `DRAG_START` and `OPEN_MENU` |
| `WinOverlay` | `LoseOverlay` | mutually exclusive — `isWon` and `isStuck` cannot both hold (`isStuck` requires `!isWon`) |
| `Timer` | everything else | orthogonal — runs on its own 1 Hz tick, stops only on `isGameOver` |
| `TopBar` (sub-tree) | game playing area | orthogonal layout — separate display region; coupling only via `historyStore` and `timerStore` (read), `UNDO`/`REDO` (dispatch) |
| game lifecycle (`game.json`) | drag machine | loosely coupled — game transitions only fire on `DRAG_END`-legal |

Orthogonal pairs sit as siblings in the tree, never as ancestor/descendant.

## 7. Resulting tree

Applying the derivation procedure below to §1–§6 yields:

```
<App>
  <GameBoard>                        // container
    <TopBar>                         // container
      <MenuButton>                   // reads uiStore.modal, drag.phase
      <UndoButton>                   // reads canUndo
      <RedoButton>                   // reads canRedo
      <MoveCounter>                  // reads moveCount
      <Timer>                        // reads timerStore.elapsedMs
    <FreecellSlot[i]> × 4            // reads gameStore.freecells[i]
    <FoundationSlot[s]> × 4          // reads gameStore.foundations[s]
    <CascadeArea[i]> × 8             // reads gameStore.cascades[i]
      <Card> × N                     // one card (prop); emits pointerdown, dblclick
    <DragGhost>                      // reads uiStore.drag.{pointer, sourceId, span}
    <MenuOverlay (modal === 'menu')>     // reads uiStore.modal
    <AboutModal (modal === 'about')>     // reads uiStore.modal
    <WinOverlay (isWon)>                  // reads isWon
    <LoseOverlay (isStuck && !isWon)>     // reads isStuck, isWon
  </GameBoard>
</App>
```

### Per-component contracts

| Component | Reads | Emits | Action ids dispatched |
|---|---|---|---|
| `App` | — | — | — |
| `GameBoard` | — | container | — |
| `TopBar` | — | container | — |
| `MenuButton` | `uiStore.modal`, `drag.phase` | `click` | `OPEN_MENU` |
| `UndoButton` | `canUndo` | `click` | `UNDO` |
| `RedoButton` | `canRedo` | `click` | `REDO` |
| `MoveCounter` | `moveCount` | — | — |
| `Timer` | `timerStore.elapsedMs` | — | — |
| `FreecellSlot[i]` | `gameStore.freecells[i]` | `pointerdown`, `pointerup` | `DRAG_START`, `DRAG_END` |
| `FoundationSlot[s]` | `gameStore.foundations[s]` | `pointerup` | `DRAG_END` |
| `CascadeArea[i]` | `gameStore.cascades[i]` | `pointerdown`, `pointerup` | `DRAG_START`, `DRAG_END` |
| `Card` | one card (prop), `uiStore.drag.sourceId` | `pointerdown`, `dblclick` | `DOUBLE_CLICK_CARD` (delegates `pointerdown` to parent) |
| `DragGhost` | `uiStore.drag.{pointer, sourceId, span}` | — | — |
| `MenuOverlay` | `uiStore.modal` | `click` | `CLOSE_MENU`, `NEW_GAME`, `RESTART_GAME`, `OPEN_ABOUT` |
| `AboutModal` | `uiStore.modal` | `click` | `CLOSE_ABOUT` |
| `WinOverlay` | `isWon` | `click` | `NEW_GAME` |
| `LoseOverlay` | `isStuck`, `isWon` | `click` | `NEW_GAME` |

Each slot has a stable `data-pile-id` attribute matching the `sourceId` / `targetId` encoding from doc02.03.

### Derivation procedure

This is the audit trail. Anyone editing the tree must walk these steps:

1. Start from **read-set rows** (§4). Each row is a component candidate.
2. **Merge** two candidates iff (a) their read sets overlap heavily and (b) they share an affordance owner.
3. **Split** a candidate iff any of its fields sits in a higher mutation-rate tier (§3). The high-frequency field moves to its own child component. (Forces `DragGhost` out of the cascade area.)
4. **Arrange siblings** per the orthogonality table (§6). Orthogonal pairs never nest. (`MenuOverlay`, `AboutModal`, `WinOverlay`, `LoseOverlay`, `DragGhost` sit as siblings, not nested inside the playing area.)
5. **Cross-check**: every row of the action catalog (§2) names a region that appears in the tree; no orphan regions, no uncovered actions.

When the tree changes, the inventories must change first.

## Quality checks

Three counts, each drawn from one research tradition (doc03.02):

- **Off-diagonal cells** (Suh). In the (region × state-slice) matrix, count entries outside the diagonal clusters. Low count = clean partition.
- **Cross-region affordance rules** (Parnas). An affordance that references state owned by a different region = leaked abstraction.
- **Rate-tier violations** (Simon). A component that subscribes to both a >30 Hz field and a low-frequency field = forced re-render waste.

## Open questions

- `DOUBLE_CLICK_CARD` autotarget — foundation-only (current spec). Should there ever be an auto-cascade fallback as a v2 affordance?
- When the action catalog grows past ~15 entries, does it deserve its own doc? (Currently 12 rows in §2.)
- Mobile portrait CSS handling: layout may render broken in portrait (no orientation gate per product decision). Worth a CSS-level no-op note here, or leave entirely to CUI implementation?
