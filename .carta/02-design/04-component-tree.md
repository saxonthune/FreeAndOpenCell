---
title: Component tree
status: draft
summary: SolidJS component tree and per-component contracts
tags: [ui, components]
deps: [doc02.02, doc02.03]
---

# Component tree

What rendering artifacts are needed to display a FreeCell game?

## Tree

```
<App>
  <GameBoard>
    <FreecellRow>
      <FreecellSlot> × 4
    </FreecellRow>
    <FoundationRow>
      <FoundationSlot> × 4
    </FoundationRow>
    <CascadeArea>
      <CascadeColumn> × 8
        <Card> × N
    </CascadeArea>
    <DragGhost>           <!-- floats above tree, follows pointer -->
    <WinOverlay>          <!-- conditional -->
  </GameBoard>
</App>
```

## Per-component contract

| Component | Reads | Emits |
|---|---|---|
| `App` | — | container |
| `GameBoard` | `isWon` (memo) | container |
| `FreecellSlot` | `GameState.freecells[i]`, `legalTargets` | `pointerdown`, `pointerup` |
| `FoundationSlot` | `GameState.foundations[i]`, `legalTargets` | `pointerup` |
| `CascadeColumn` | `GameState.cascades[i]`, `legalTargets` | `pointerup` |
| `Card` | one card; `UIState.drag.sourceId` (to render as placeholder when dragged) | `pointerdown` |
| `DragGhost` | `UIState.drag.pointer`, the dragged card | none |
| `WinOverlay` | `isWon` | `pointerdown` (new game) |

Each slot has a stable `data-pile-id` attribute matching the `sourceId` / `targetId` encoding from doc02.03.

## Open questions

- Animation layer: dedicated component, or per-card CSS transitions?
- `WinOverlay`: child of `GameBoard` (covers play area) or sibling of `App` (covers everything)?
- Top bar (new game, undo, timer): not yet specified — defer until a feature demands it.
