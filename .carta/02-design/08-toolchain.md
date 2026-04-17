---
title: Toolchain
status: draft
summary: Implementation-bridge spec — locked-in libraries and runtime choices that move the design specs into code
tags: [toolchain, implementation, decisions]
deps: [doc02.01, doc02.07]
---

# Toolchain

This doc bridges the tool-agnostic design specs (doc02.01–07) and source code. Every entry is a binding decision — not a survey. When the design says "the engine returns a `Result`" or "tests are property-based", this doc names the actual library and version line that implements it.

The methodology rule (CLAUDE.md, doc02.00) keeps libraries out of design specs. They land here instead, in one place, so the design layer stays portable and the implementation layer has a single source of truth.

## Locked-in stack

| Concern | Choice | Why this and not the alternatives |
|---|---|---|
| Package manager | **pnpm** (`packageManager` pinned in `package.json`) | Strict by default (no phantom deps), fast, content-addressed store. `npm` is the boring fallback; `bun` mixes runtime + manager and we don't need a JS runtime. Use `pnpm <script>` and `pnpm exec <bin>` — never `npx`. |
| Runtime / Node | Node ≥ 22 (`.nvmrc`) | Vite 8 + Vitest 4 require modern Node. |
| Bundler / dev server | **Vite 8** | SolidJS first-class via `vite-plugin-solid`; HMR is fast; static-site build is one command. |
| UI framework | **SolidJS 1.9** | Fine-grained reactivity matches doc02.04's per-pile granularity rule for free; signals + stores map directly to `gameStore` (signal-of-immutable) and `uiStore` (deep proxy). |
| Language | **TypeScript ~6** with `strict: true` and `noUncheckedIndexedAccess` | The engine's types are the spec's enforcement mechanism (doc02.02 schemas → TS types). Indexed-access strictness catches `cascades[i]`-may-be-undefined bugs that are easy to miss with 8 columns and 4 freecells. `exactOptionalPropertyTypes` is **not** enabled — the noise/value ratio is poor for our shape. |
| State-machine runtime | **XState v5** (`createActor`) | Selected on the "easiest to test from the command line" criterion — XState v5's `createActor()` runs headless in plain Node with no DOM and no setup; sequences of `actor.send()` calls are trivial to drive from Vitest. Zag is more UI-coupled; hand-rolling forfeits the visualizer and the typed event API. The two state-machine sidecars (`02-game.json`, `03-ui-drag.json`) stay XState-shaped JSON; the implementation imports them and feeds them to `setup({}).createMachine(json)`. |
| Test runner | **Vitest 4** (jsdom env, `@solidjs/testing-library`, `@testing-library/jest-dom`) | Default for Vite/Solid; fast watch mode; jsdom env covers component tests. Property tests (engine + machines) run in the Node env and don't touch jsdom. |
| Property tests | **fast-check** + **`@fast-check/vitest`** integration | doc02.07 acceptance bar (`fc.commands`, N=10k) is a fast-check API. The Vitest integration gives `it.prop`-style ergonomics and proper failure reporting. |
| Lint + format | **Biome 2.4** | One tool, fast, no plugin sprawl. Run via `pnpm lint` / `pnpm format`. `.carta` and `.carta.json` are excluded; `node_modules`, `dist`, `coverage` likewise. |
| CSS | **Tailwind CSS** with **strict theming** | Layout (doc02.06) is small but pixel-sensitive (cascade offsets, drop-target rects). All sizes/colors/spacing come from the configured Tailwind theme; arbitrary values (`w-[123px]`) are forbidden by lint rule. This pushes design tokens into one file (`tailwind.config.ts`) and keeps card-size tuning in one place. |
| Card faces | **me.uk/cards** standard 52-card SVG deck | Public-domain SVG faces (white background, sharp glyphs); no licensing footnote needed. Imported as static SVG assets and referenced by `card.id` (suit+rank, e.g. `H7.svg`). Custom artwork is out of scope for v1. |
| Deployment | **GitHub Pages** | Static-only output from `vite build`; deploy via GitHub Actions on push to `main`. No backend, no env vars, no CDN tier to pick. The repo is already on GitHub. |

## Discovery, not hard-coding

Per a design-time note: scripts and binaries should be **discovered** rather than hard-referenced when possible.

- Run scripts by name (`pnpm test`, `pnpm dev`) — the script body in `package.json` is the source of truth, not a path memorised elsewhere.
- Run one-off binaries via `pnpm exec <bin>` — pnpm resolves the binary in the local `node_modules/.bin` so versions stay in sync with the lockfile. Don't paste full paths.
- For the state-machine sidecars: discover them as same-prefix siblings of the host `.md` file. Don't hard-code `.carta/02-design/02-game.json` in source — import via a path that follows the bundle layout (e.g. a `loadStateMachine(host)` helper) so a future `carta move` doesn't break imports.

## Out of scope for this doc

- **CI specifics** — GitHub Actions workflow file is repo plumbing, not a design decision. The choice that *matters* (GitHub Pages target) is recorded above.
- **Runtime polyfills** — Node ≥ 22 + ES2023 target covers everything we use.
- **Bundle-size budgets** — performance properties were ruled out at the testing-plan level (doc02.07 §out of scope).
- **Card-back artwork, animations, sound** — visual polish lives in implementation, not in this doc.

## Open questions

- **Tailwind v3 vs v4.** v4 is the latest but the config story is still settling; v3 is rock-solid and the strict-theme story is well-documented. Default to v4 unless installation friction shows up.
- **State-machine sidecar load helper signature.** Sketched but not written — settle once the first machine consumer exists.
- **fast-check shrink budget.** N=10k runs is set (doc02.07); shrink-time CI budget is not. Tune on first failing property.
