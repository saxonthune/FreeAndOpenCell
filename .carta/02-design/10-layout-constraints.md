---
title: Layout Constraints
status: draft
summary: Named inequalities the rendered layout must satisfy — the enforcement layer beneath doc02.06's AUI diagram and doc02.09's token values.
tags: [ui, layout, constraints, invariants]
deps: [doc02.06, doc02.09]
---

# Layout Constraints

doc02.06 states the AUI structure (which region is above which). doc02.09 supplies concrete values (card width formula, topbar height). This doc states the **inequalities those values must satisfy** — the invariants that turn "looks fine on my screen" into a checkable property.

Each constraint has:

- A **name** (`L1`, `L2`, …) — so a bug report can say "violates L3".
- A **rule** — a mathematical inequality in symbolic terms (tokens, viewport units). No pixels.
- A **why** — the failure mode it prevents. Without the why, edge cases can't be judged.

Conventions: `card_w` and `card_h` refer to the resolved values of doc02.09 `card.width` and `card.height`. `viewport_w` and `viewport_h` are the dynamic viewport (`100dvw`/`100dvh`). `n` is a cascade column's card count; FreeCell's theoretical maximum is 19.

## Supported viewports

doc02.06 now defines **two arrangements** (wide and compact), switched at aspect ratio 1:1. Constraints L1–L5 below are written for the **wide** arrangement and must hold across its range:

- **Landscape mobile:** 800×400 → iPhone-class small side
- **Desktop:** 1024×600 → oldest supported
- **Wide desktop:** up to 3840×2160

The **compact** arrangement covers square-or-taller viewports (portrait mobile, ~ 360×640 → 430×932). It has its own height budget (two cascade bands, two pocket-clipped slot rows at `0.75·card_h`, no topbar — controls live in a chevron-toggled overlay) but the same family of constraints — L1/L3/L4 apply per-band with `card_w` resolved from the compact formula, and L1's topbar term drops out. L6 states the switch point itself.

## Constraints

### L1 — Height budget

    topbar_h + padding_v + card_h · (1 + offset · min(n − 1, rows_visible)) ≤ viewport_h

**Why:** the board must fit in one screen without scrolling. The padding term covers the two `py-2` stripes between regions. The cascade term uses `min(…)` to reflect doc02.06's compression rule — beyond `rows_visible`, offset shrinks rather than stack growing. A violation means the bottom cascade card is clipped or forced off-screen. *Caught by:* the 2026-04-18 regression where `card_h` was bound to `13vh`, leaving ~40dvh of dead space on 800×400.

### L2 — Board width bound

    card_w · 12 ≤ 0.95 · viewport_w

**Why:** the top row is 8 cards plus 6 inner gaps (`0.5·card_w`) plus one group gap (`1·card_w`) = 12 card-widths (matches the current `--board-max-w`). The `0.95` margin prevents edge-kissing on narrow viewports. A violation produces horizontal overflow or clipped edge columns. *Current status:* the token formula `card_w = min(8dvw, …)` yields `12·card_w = 96dvw` at the width-bound — slightly over 95%. Either tighten `card_w`'s width coefficient to `7.9dvw` or relax this constraint to `≤ 0.96`.

### L3 — Cascade tail visibility

    card_h · (1 + offset · (n − 1)) ≤ cascade_region_h    for n ≤ 19

**Why:** under full compression (n=19), the last card must still render inside its `CascadeArea`. `offset` is computed by doc02.09's `cascade-offset` formula so that `offset · (n − 1) ≤ rows_visible`. Violation = the bottom of a long cascade escapes the column's flex region and overlaps siblings or the viewport bottom.

### L4 — Rank corner readable

    offset · card_h ≥ rank_corner_size · 1.2

**Why:** doc02.06 requires the rank+suit corner of every card in a cascade to remain visible. `offset · card_h` is the vertical strip of the upper card that stays uncovered; it must clear the rank glyph with a small margin. Violation = cards in long cascades become unreadable. *Currently:* `offset` at max compression is `rows_visible / (n−1) = 4.4/18 ≈ 0.244`. With `card_h` at its floor (18dvh at `viewport_h = 400` → 72px), the uncovered strip is ~17.6px; `rank_corner_size` is `1.1rem` ≈ 17.6px. Margin is 0 — L4 is *exactly* at the boundary and will fail under any font scaling. Flag for follow-up. **Compact:** the `rows_visible = 2.6` band budget (chosen to maximize card size, doc02.06) means max-compression offset is `1.6/18 ≈ 0.089` — an extreme column (n approaching 19) violates L4 outright. Accepted trade: such columns are rare in play, and the larger `card_h` softens it; revisit if deep stacks prove unreadable.

### L5 — Drop-target non-overlap

    bbox(region_a) ∩ bbox(region_b) = ∅    ∀ a ≠ b

where `region` is any of `FreecellSlot[i]`, `FoundationSlot[s]`, `CascadeArea[i]`.

**Why:** doc02.03's bounding-box overlap rule determines drop outcomes. If two drop targets overlap, the rule is ambiguous — the cursor position falls into two rects and the "winner" becomes an implementation accident. This is structural (doc02.06 enforces it via flex layout), but it belongs in this list so a future change can't accidentally violate it.

### L6 — Arrangement switch never shrinks cards

    switch to compact  ⟹  card_w_compact(viewport) ≥ card_w_wide(viewport)

with the two arrangements' size formulas (doc02.09; paddings elided):

    card_w_wide    = min( k_w · viewport_w , h_w · viewport_h , cap )     k_w = 0.08,   h_w = 0.17
    card_w_compact = min( k_c · viewport_w , h_c · viewport_h , cap )     k_c ≈ 0.24,   h_c ≈ 0.107

where the compact coefficients are derived, not chosen: `k_c = 1/(4 + 3·gap_min)` (4 columns at minimum gap) and `h_c = 1/(1.4·(2·0.75 + 2·rows_visible))` (two pocket-clipped slot rows + two bands, no topbar; `rows_visible = 2.6` — sized so a fresh deal's 7-card columns show uncompressed at the default offset, `1 + 0.25·6 = 2.5 < 2.6`, while longer columns rely on offset compression).

**Why:** the compact arrangement (doc02.06) exists only to make cards *bigger* on narrow viewports. It must not engage where it would make them smaller. In portrait, `card_w_wide` is width-bound (`k_w · viewport_w`) and `card_w_compact` is height-bound (`h_c · viewport_h`); compact wins whenever

    h_c · viewport_h ≥ k_w · viewport_w   ⟺   viewport_w / viewport_h ≤ h_c / k_w ≈ 1.33

The switch is aspect ≤ 1:1, decided in one place: `computeLayout` (`src/layout/computeLayout.ts`) returns the arrangement together with the sizes, and everything downstream — the mounted DOM (`isCompact` in `src/stores/layout.ts`), the CSS variables, the pocket clip — derives from that one result, so the arrangement and the size formulas cannot disagree. Since the true crossover sits at ~1.33, the 1:1 switch is a **conservative policy floor**, not the exact crossover: everywhere compact engages (aspect ≤ 1) it strictly satisfies the inequality, and in the 1.0–1.33 band wide is kept even though compact would be marginally larger, because landscape-shaped viewports read better with one cascade row. Any change to the compact budget terms (clip factor, `rows_visible`, gap ratios) moves the crossover — re-derive `h_c / k_w` and confirm it stays ≥ 1, or move the switch. L5's mounting rule (drop targets are keyed by pile id — mounting both arrangements double-registers) is why the switch must remain a single decision rather than independent CSS and JS tunings.

## Checking

Geometry is now solved by the pure function `src/layout/computeLayout.ts`, so the formula-level constraints are asserted directly in `src/layout/computeLayout.test.ts` over the supported-viewport matrix: L1 (height budget), L2 (width bound), the aspect-ratio invariant, the gap clamp, and L6 (compact ≥ wide wherever compact engages). What remains future work:

- L1/L2/L3 at the **rendered-DOM** level: mount `<GameBoard />` under jsdom per viewport and assert computed bounding rects — guards against the components consuming the solver's variables incorrectly.
- L4: static — a single computed value from tokens. Can be a plain assertion in a test file or a comment on doc02.09.
- L5: Playwright or jsdom geometry check over representative board states.

For the unrendered parts, this doc is the contract and the PR review is the enforcement. New layout-affecting PRs should cite which constraints they touched.

## Not in this doc

- **Which element gets which CSS property.** That's implementation.
- **Breakpoints / media queries.** None exist yet. When they do, constraints likely gain a `∀ viewport ∈ matrix` quantifier rather than forking per-breakpoint.
- **Animation / transition rules.** Out of scope for static layout.
- **Accessibility invariants** (tap target size, focus order). Separate concern — belongs in its own doc when it earns one.
