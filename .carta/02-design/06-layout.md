---
title: Layout
status: draft
summary: AUI-level layout sketch — relative proportions for top bar, freecell/foundation row, cascades; no pixels, no CSS.
tags: [ui, layout, aui]
deps: [doc02.05]
---

# Layout

Modality-independent layout (Cameleon AUI; doc03.02). Sizes are **relative** — proportions of viewport or of card dimensions. Concrete units (px, rem, vh, CSS grids) are CUI-level decisions made at implementation.

The layout has **two arrangements**, chosen by viewport aspect ratio:

- **Wide** (default) — viewport wider than tall. Desktop (≥ 1024×600) and landscape mobile (~ 800×400). One top row of 8 slots, one row of 8 cascades.
- **Compact** — viewport square-or-taller (portrait mobile). The 8 cascades split into two rows of 4 so all cards can be larger; foundations and freecells stack as two slot rows at the top. There is no persistent `TopBar`: its controls live behind a chevron toggle at the top-right that overlays the control bar over the foundation row. Slot rows are **pocket-clipped** — each slot shows only the top ~75% of a card, with a translucent fade at the cut so the card reads as sitting in a pocket. This returns half a card-height of vertical space to the cascade bands.

The switch is **not** an arbitrary breakpoint: it is the aspect ratio at which the compact card-sizing formula stops being smaller than the wide one and starts being larger. See doc02.10 (constraint **L6**) for the derivation. At exactly 1:1 the two formulas resolve to the same card size; the compact arrangement applies for aspect ≤ 1:1.

## Vertical stacking — wide

Top to bottom:

| Region | Approx height | Notes |
|---|---|---|
| `TopBar` | ~8% of viewport height | houses `MenuButton`, `UndoButton`, `RedoButton`, `NewGameButton` (only while `isWon`), `MoveCounter`, `Timer` |
| Top row: `FreecellSlot[0..3]` (left) ‖ `FoundationSlot[0..3]` (right) | ~1 card height + small padding | single horizontal row spanning the full width |
| `CascadeArea[0..7]` | remainder | 8 columns, evenly spaced |

## Vertical stacking — compact

Top to bottom:

| Region | Approx height | Notes |
|---|---|---|
| `FoundationSlot[0..3]` | ~0.75 card height + small padding | 4 pocket-clipped slots, left-aligned; control tiles float at the right edge |
| `FreecellSlot[0..3]` | ~0.75 card height + small padding | 4 pocket-clipped slots, left-aligned — directly below foundations |
| `CascadeArea[0..3]` | one band | 4 columns |
| `CascadeArea[4..7]` | one band | 4 columns |

There is no `TopBar` row. A vertical stack of three tiles floats at the top-right edge, alongside the slot rows: the chevron toggle, then **undo**, then **redo** — so undo/redo are always one tap away without opening the control bar. Tapping the chevron overlays the control bar (menu, "FAOC" title → about, new game while won, move counter, timer) over the foundation row; tapping again dismisses it. The overlay is absolutely positioned and does not participate in the vertical stack.

The two cascade bands share the remaining height equally. All cards (slots and cascades) render at one common size in both arrangements — the goal is to maximize that size at the current aspect ratio.

`DragGhost`, `MenuOverlay`, `AboutModal`, `LoseOverlay` are absolutely positioned siblings (doc02.05 §6) — they don't participate in the vertical stack. Slot/cascade drop-target registration is keyed by pile id (`registerSlot`), so only one arrangement may be mounted at a time — the renderer switches DOM rather than overlaying both.

## Top row split (wide)

In the wide arrangement, the top row places freecells on the **left half**, foundations on the **right half**. This is the FreeCell convention (Microsoft FreeCell, most digital implementations).

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

In the compact arrangement, the slot rows stack at the top — foundations, then freecells — above the two cascade bands. No top bar; the chevron (⌄) at top-right toggles the control-bar overlay:

```
┌───────────────────────────┐
│ [♥] [♦] [♣] [♠]       (⌄) │  ← foundations (pocket-clipped) + chevron
│                       (↺) │  ← undo tile
│ [f0] [f1] [f2] [f3]   (↻) │  ← freecells (pocket-clipped) + redo tile
├───────────────────────────┤
│   C0   C1   C2   C3        │
│   ▮    ▮    ▮    ▮         │  ← cascade band A
│   ▮    ▮    ▮               │
├───────────────────────────┤
│   C4   C5   C6   C7        │
│   ▮    ▮    ▮    ▮         │  ← cascade band B
│   ▮    ▮    ▮               │
└───────────────────────────┘

chevron open — control bar overlays the foundation row:
┌───────────────────────────┐
│ [Menu]  FAOC  42(47)  (⌃) │  ← control-bar overlay
│ …foundations beneath… (↺) │
```

## Card sizing

Card dimensions are derived from available space, not fixed; a single card size applies to every slot and cascade card. The aspect ratio is a standard playing card, ~ 5:7 (width:height). The size is the largest that satisfies both a width bound and a height bound for the active arrangement:

Geometry is computed by a **pure layout solver** (`src/layout/computeLayout.ts`): viewport dimensions in, explicit pixel values out (`card_w`, `card_h`, gaps, clip factor, rows budget), applied as CSS variables. `card_h = card_w · 7/5` is computed in the solver, so the aspect ratio holds by construction. The solver is the single source of truth for both the sizes *and* the arrangement switch, and being pure it is unit-tested directly against doc02.10's constraints.

- **Wide:** `card_w = min(0.08·viewport_w, 0.17·viewport_h, cap)` — width bound from 8 cascade columns plus the top-row group gap; height bound so topbar + one slot row + the cascade band fit.
- **Compact:** the largest card satisfying three bounds, then leftover width poured into the gaps (prior art: desktop solitaire engines size cards to the min of the width/height solves and spread columns across the full playfield):

      width bound:    4·card_w + 3·gap_min + margins = viewport_w
      height bound:   2·(clip·card_h) + 2·(rows·card_h) + padding stripes = viewport_h
      slot-row bound: foundations row + chevron reserve ≤ viewport_w

      card_w = min(width bound, height bound, slot-row bound, cap)
      gap    = clamp((viewport_w − margins − 4·card_w) / 3,  gap_min·card_w,  gap_max·card_w)

  The gap clamp is deliberately tight (`gap_max = 0.12·card_w`): columns sit close together as one tableau, and when the height bound wins (the common phone case) the spare width becomes symmetric edge margins rather than scattered column spacing. There is no topbar term — compact has no persistent top bar.

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
