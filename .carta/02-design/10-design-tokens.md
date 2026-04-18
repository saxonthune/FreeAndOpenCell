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
- **Per-suit asset paths.** Assets live in `src/assets/` and are enumerated in doc02.09.
- **Breakpoints.** None exist yet (doc02.06 asserts no orientation gate). Add only when a breakpoint earns its keep.

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

## Adding a token

1. Confirm it satisfies "what belongs here" above.
2. Add to `10-design-tokens.json` in the right group, DTCG shape (`$value` + `$type`).
3. If there's a natural ref, use one — duplicating a value is a smell.
4. Update `tailwind.css` to match (until automated).
5. No change to this markdown unless a new group is introduced.

## Constraints the tokens must satisfy

These are correctness rules, not just conventions. A token set that violates them is wrong:

- **Card height ≤ 28vh.** Derived from doc02.06's height budget: `topbar(8vh) + freecell row(card-h + padding) + cascade(~2.1 · card-h) ≤ 100vh`. The `card.width` formula must resolve such that `card.height ≤ 28vh` on the smallest supported landscape viewport (~800×400). Current formula (`min(11vw, calc(24vh * 5 / 7))`) gives `card.height = min(15.4vw, 24vh)` — satisfies the bound.
- **Board width ≤ 95% of viewport.** `card.width · 11.5 ≤ 0.95 · viewport_width` across the supported range. With the current formula this fails only at viewports narrower than ~725px *and* taller than they are wide — outside the support matrix.
- **Aspect ratio is a ref, not a duplicate.** `card.height` must be `calc({card.width} * 7 / 5)`. A token that hard-codes card height breaks the ratio invariant.

Future work (not yet tokens): explicit per-breakpoint overrides if the support matrix widens; token-level expression of "card corner must remain readable under cascade compression" (doc02.06 §cascade-offset rule 3) — currently enforced by the `cascade-offset` + `cascade-rows-visible` pair but not labeled as an invariant in the JSON.
