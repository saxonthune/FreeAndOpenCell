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

Constraints must hold across this range — outside it, violations are acceptable and orientation-gating is not required (per doc02.06):

- **Landscape mobile:** 800×400 → iPhone-class small side
- **Desktop:** 1024×600 → oldest supported
- **Wide desktop:** up to 3840×2160

Portrait mobile is explicitly *not* in the support matrix.

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

**Why:** doc02.06 requires the rank+suit corner of every card in a cascade to remain visible. `offset · card_h` is the vertical strip of the upper card that stays uncovered; it must clear the rank glyph with a small margin. Violation = cards in long cascades become unreadable. *Currently:* `offset` at max compression is `rows_visible / (n−1) = 4.4/18 ≈ 0.244`. With `card_h` at its floor (18dvh at `viewport_h = 400` → 72px), the uncovered strip is ~17.6px; `rank_corner_size` is `1.1rem` ≈ 17.6px. Margin is 0 — L4 is *exactly* at the boundary and will fail under any font scaling. Flag for follow-up.

### L5 — Drop-target non-overlap

    bbox(region_a) ∩ bbox(region_b) = ∅    ∀ a ≠ b

where `region` is any of `FreecellSlot[i]`, `FoundationSlot[s]`, `CascadeArea[i]`.

**Why:** doc02.03's bounding-box overlap rule determines drop outcomes. If two drop targets overlap, the rule is ambiguous — the cursor position falls into two rects and the "winner" becomes an implementation accident. This is structural (doc02.06 enforces it via flex layout), but it belongs in this list so a future change can't accidentally violate it.

## Checking

These are worth asserting in an executable form when the test harness grows beyond unit-level:

- L1, L2, L3: a Vitest + jsdom sweep over the supported-viewport matrix — set `document.documentElement.clientWidth/Height`, mount `<GameBoard />`, assert computed bounding rects.
- L4: static — a single computed value from tokens, not viewport-dependent. Can be a plain assertion in a test file or a comment on doc02.09.
- L5: Playwright or jsdom geometry check over representative board states.

Until that harness exists, this doc is the contract and the PR review is the enforcement. New layout-affecting PRs should cite which constraints they touched.

## Not in this doc

- **Which element gets which CSS property.** That's implementation.
- **Breakpoints / media queries.** None exist yet. When they do, constraints likely gain a `∀ viewport ∈ matrix` quantifier rather than forking per-breakpoint.
- **Animation / transition rules.** Out of scope for static layout.
- **Accessibility invariants** (tap target size, focus order). Separate concern — belongs in its own doc when it earns one.
