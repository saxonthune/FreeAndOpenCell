---
title: Layout
status: draft
summary: AUI-level layout sketch — relative proportions for top bar, freecell/foundation row, cascades; no pixels, no CSS.
tags: [ui, layout, aui]
deps: [doc02.05]
---

# Layout

Modality-independent layout (Cameleon AUI; doc03.02). Sizes are **relative** — proportions of viewport or of card dimensions. Concrete units (px, rem, vh, CSS grids) are CUI-level decisions made at implementation.

The layout has no aspect-ratio assumption. It must remain usable on a typical desktop viewport (≥ 1024×600) and on a landscape mobile viewport (~ 800×400). Portrait orientation is permitted to render broken — no orientation gate (product decision).

## Vertical stacking

Top to bottom:

| Region | Approx height | Notes |
|---|---|---|
| `TopBar` | ~8% of viewport height | houses `MenuButton`, `UndoButton`, `RedoButton`, `MoveCounter`, `Timer` |
| Top row: `FreecellSlot[0..3]` (left) ‖ `FoundationSlot[0..3]` (right) | ~1 card height + small padding | single horizontal row spanning the full width |
| `CascadeArea[0..7]` | remainder | 8 columns, evenly spaced |

`DragGhost`, `MenuOverlay`, `AboutModal`, `WinOverlay`, `LoseOverlay` are absolutely positioned siblings (doc02.05 §6) — they don't participate in the vertical stack.

## Top row split

Within the top row, freecells occupy the **left half**, foundations the **right half**. This is the FreeCell convention (Microsoft FreeCell, most digital implementations).

```
┌─────────────────────────────────────────────────────────────┐
│  [Menu] [Undo] [Redo]            42 (47)            03:14   │  ← TopBar
├─────────────────────────────────────────────────────────────┤
│  [F0] [F1] [F2] [F3]              [♥] [♦] [♣] [♠]           │  ← top row
├─────────────────────────────────────────────────────────────┤
│   C0    C1    C2    C3    C4    C5    C6    C7              │
│   ▮     ▮     ▮     ▮     ▮     ▮     ▮     ▮               │
│   ▮     ▮     ▮     ▮     ▮     ▮     ▮                     │
│   ▮     ▮     ▮     ▮     ▮     ▮     ▮                     │  ← cascade area
│   …     …     …     …     …     …                           │
└─────────────────────────────────────────────────────────────┘
```

## Card sizing

Card dimensions are derived from available width, not fixed:

- Card width ≈ `viewport_width / 9` (8 cascade columns + small gutter), capped so card height ≤ ~25% of viewport height on desktop.
- Card aspect ratio: standard playing card, ~ 5:7 (width:height).

## Cascade card offset

Cards within a cascade overlap vertically. Offset from the top of one card to the top of the next is expressed as a **percentage of card height**:

| Column length | Offset per card |
|---|---|
| ≤ N cards | `defaultOffset` (e.g. ~25% of card height — fully readable rank) |
| > N cards | linearly compressed so the bottom card stays within `CascadeArea` bounds |

`N` is the longest column the layout can show without compression. The exact value is a CUI tuning knob; the spec only requires that:

1. Compression is **smooth** — no abrupt jump as a column grows.
2. Even at maximum compression (column of 19 cards, the FreeCell maximum), all cards remain at least partly visible and the *top of each card* (rank+suit corner) is never occluded by the card below it.
3. The rank+suit corner of every card must be visible enough to read.

## Drop-target bounds

Each interactive region (`FreecellSlot[i]`, `FoundationSlot[s]`, `CascadeArea[i]`) carries a single rect that is its drop-target rect (used by the bounding-box overlap rule, doc02.03 drop-outcome table). For cascades, the rect is the union of the column's current cards — empty cascades retain the full column rect so they remain droppable.

Adjacent regions must not overlap; the bounding-box rule depends on it.

## Open questions

- Whether "card width capped to keep height ≤ 25% of viewport" should be expressed as a hard ratio (e.g. `aspect-ratio: 5/7` plus a max-height) or by computing the smaller of width-based and height-based sizes. Implementation detail.
- Whether the top row's split is exactly 50/50 or biased (e.g. freecells slightly narrower). 50/50 is the default.
