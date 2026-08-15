---
title: Design Tokens
status: draft
summary: W3C DTCG-format token set — the concrete value layer (colors, card geometry, topbar height, cascade tuning) that doc02.06 leaves abstract. Sidecar JSON is authoritative.
tags: [ui, tokens, design-tokens, values]
deps: [doc02.06]
---

# Design Tokens

doc02.06 is AUI-level — it states proportions and invariants without pixels. This doc closes the gap to implementation by listing the concrete **values** every rendered surface draws from, in the W3C Design Tokens Community Group (DTCG) format.

The authoritative artifact is the sidecar [`10-design-tokens.json`](./10-design-tokens.json). This markdown file explains **why** each group exists and what rules govern adding to it — content the JSON can't carry. If the two disagree, the JSON wins for values and this doc wins for policy.

## What belongs here

A token is a **leaf value** that appears in rendered output and is referenced from more than one place, or is load-bearing enough that a future agent might need to change it without hunting. Colors, dimensions tied to the card metaphor, the topbar height, cascade tuning numbers.

## What does not belong here

- **Layout structure.** "FreeCells go on the left" is doc02.06, not a token.
- **Component state.** Hover, pressed, dragging — that's doc02.03.
- **Behavior timings** unless they appear in styles. Animation `duration` tokens are fine; state-machine `after` timeouts are not.
- **Breakpoints beyond the one arrangement switch.** One exists: `max-aspect-ratio: 1/1` selects the compact arrangement (doc02.06, doc02.10 L6). Its overrides live in `layout.compact`. Add further breakpoints only when one earns its keep.

A value that appears exactly once, in one file, and has no cross-cutting meaning is **not** a token — it's just a number. Tokenizing everything defeats the purpose (grep-ability collapses when every hex code is an indirection).

## Groups

| Group | Purpose | Drives |
|---|---|---|
| `color` | Palette — table, topbar, card faces, rank ink, drop-feedback | `.bg-*`, `.text-*`, SVG fills |
| `card` | Card geometry — aspect ratio, width formula, derived height | `--card-w`, `--card-h` |
| `layout` | Non-card dimensions and cascade tuning | `--topbar-h`, `--board-max-w`, cascade offset |
| `font` | Typography for rank/suit glyphs | `--font-rank`, `--text-rank-corner` |

## Reference syntax

DTCG refs use `{group.name}` and resolve at transform time. The only ref in the current set is `card.height` → `card.width`, enforcing the 5:7 aspect ratio by construction.

## Relationship to Tailwind

`src/styles/tailwind.css`'s `@theme` block is the **current emitter** of these values. Eventually a transform step (Style Dictionary or a hand-rolled script) should generate that block from the JSON. Until then, the two must be edited together, with the JSON changed first. This doc gets updated alongside doc02.08 when the transform lands.

Exception: **board geometry** (card width/height, gaps, clip factor) is computed at runtime by the pure solver `src/layout/computeLayout.ts` from the `layout.compact` constants above and applied as CSS variables — the `@theme` card values are only the pre-JS fallback. The solver's constants and this JSON must stay in step, JSON first.

## Adding a token

1. Confirm it satisfies "what belongs here" above.
2. Add to `10-design-tokens.json` in the right group, DTCG shape (`$value` + `$type`).
3. If there's a natural ref, use one — duplicating a value is a smell.
4. Update `tailwind.css` to match (until automated).
5. No change to this markdown unless a new group is introduced.

## Constraints the tokens must satisfy

These are correctness rules, not just conventions. A token set that violates them is wrong:

- **Height budget.** doc02.10 L1: the arrangement's full vertical stack must fit `100dvh`. Wide: `topbar + slot row + cascade band`. Compact: `2 clipped slot rows + 2 bands`, no topbar — and the compact `card-width` formula is the exact solve of this budget (see doc02.06 §Card sizing), so the bound holds by construction while the formula and the row paddings stay in step.
- **Board width bound.** doc02.10 L2: `card.width · 12 ≤ 0.95 · viewport_width` (wide); compact analog is `card-width · 4.75 + row padding ≤ viewport_width`, again exact by construction.
- **Aspect ratio is a ref, not a duplicate.** `card.height` must be `calc({card.width} * 7 / 5)`. A token that hard-codes card height breaks the ratio invariant.

Future work (not yet tokens): explicit per-breakpoint overrides if the support matrix widens; token-level expression of "card corner must remain readable under cascade compression" (doc02.06 §cascade-offset rule 3) — currently enforced by the `cascade-offset` + `cascade-rows-visible` pair but not labeled as an invariant in the JSON.
