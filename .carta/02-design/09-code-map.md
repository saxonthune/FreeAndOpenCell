---
title: Code map
status: draft
summary: One-to-one map from design artifacts (engine fns, stores, components, machines) to source file paths — the bridge from spec to scaffold
tags: [implementation, scaffold, files]
deps: [doc02.01, doc02.02, doc02.03, doc02.04, doc02.05, doc02.07, doc02.08]
---

# Code map

This doc names every file the implementation will own. It exists so a fresh todo-task agent doesn't re-improvise file layout — every artifact in the design specs has a home, and parallel agents importing each other find the same paths.

The choices below are layout-only: granularity (single file vs split), grouping (flat vs nested), and naming. They are deliberately conservative — flatter and coarser than a mature codebase, because the engine is small and over-grouping a small codebase costs more than it saves.

## Source tree

```
src/
  engine/
    index.ts              ← deal, legalActions, applyAction, isWon, isStuck (single file per doc02.09 §settled)
    types.ts              ← GameState, Card, Action, ActionError, Result<T,E>
    invariants.ts         ← INV-1..4 runtime checks (used by ENG-1..4 property tests; debug builds may assert)
  stores/
    gameStore.ts          ← signal-of-immutable GameState (doc02.04)
    uiStore.ts            ← SolidJS deep-proxy UIState (doc02.03)
    historyStore.ts       ← snapshots[] + head, undo/redo/restart (doc02.04)
    timerStore.ts         ← elapsedMs + running, 1 Hz tick (doc02.04)
    derived.ts            ← shared memos: legalActions, legalTargets, autoTarget, isWon, isStuck, isGameOver, canUndo, canRedo, moveCount, moveCountLifetime
    dispatch.ts           ← user-action orchestrators: doMove, newGame, restartGame, doUndo, doRedo (added in task 02 `ui-reactive-wire`)
  machines/
    load.ts               ← generic sidecar loader: load(hostDocRef) → XState machine config JSON
    game.ts               ← imports 02-game.json sidecar + setup({}).createMachine(...)
    uiDrag.ts             ← imports 03-ui-drag.json sidecar + setup({}).createMachine(...)
  components/             ← flat, one file per component (doc02.05 §7)
    App.tsx
    GameBoard.tsx
    TopBar.tsx
    MenuButton.tsx
    UndoButton.tsx
    RedoButton.tsx
    MoveCounter.tsx
    Timer.tsx
    FreecellSlot.tsx
    FoundationSlot.tsx
    CascadeArea.tsx
    Card.tsx
    DragGhost.tsx
    MenuOverlay.tsx
    AboutModal.tsx
    WinOverlay.tsx
    LoseOverlay.tsx
  assets/
    cards/                ← me.uk SVG deck, named by Card.id (e.g. H7.svg, SK.svg, DA.svg)
  styles/
    tailwind.css          ← `@import "tailwindcss"` + `@theme` block (v4 CSS-first config; no `tailwind.config.ts`)
  index.tsx               ← mount: render(() => <App />, root)
  index.css               ← imports styles/tailwind.css
tests/
  engine.props.test.ts    ← ENG-1..9 (doc02.07)
  history.props.test.ts   ← HIST-1..7
  ui-drag.props.test.ts   ← UI-1..3
  bridge.props.test.ts    ← UI-4 (engine + ui-drag stateful test)
  components/             ← optional unit/component tests when added (no v1 acceptance bar)
public/
  favicon.svg, icons.svg  ← already present
vite.config.ts
vitest configuration is inlined in vite.config.ts
```

## Artifact → file

The mapping from each design artifact to where it lives. Cross-reference for agents.

### Engine (doc02.02)

| Artifact | File | Export |
|---|---|---|
| `GameState` type | `src/engine/types.ts` | `type GameState` |
| `Card` type, `id` keying | `src/engine/types.ts` | `type Card`, helpers `cardId(c)`, `parseCardId(s)` |
| `Action` discriminated union | `src/engine/types.ts` | `type Action`, `type ActionError` |
| `Result<T,E>` | `src/engine/types.ts` | `type Result<T,E>` |
| `deal(seed)` | `src/engine/index.ts` | `function deal` |
| `legalActions(state)` | `src/engine/index.ts` | `function legalActions` |
| `applyAction(state, action)` | `src/engine/index.ts` | `function applyAction` |
| `isWon(state)` / `isStuck(state)` | `src/engine/index.ts` | `function isWon`, `function isStuck` |
| INV-1..4 runtime checks | `src/engine/invariants.ts` | `function assertInvariants(state)` |

### Stores + memos (doc02.04)

| Artifact | File | Export |
|---|---|---|
| `gameStore` | `src/stores/gameStore.ts` | `gameStore`, `setGameState` |
| `uiStore` | `src/stores/uiStore.ts` | `uiStore`, mutators (`dragStart`, `dragMove`, `dragEnd`, `openModal`, `closeModal`) |
| `historyStore` | `src/stores/historyStore.ts` | `historyStore`, `pushHistory`, `undo`, `redo`, `clearHistory` |
| `timerStore` | `src/stores/timerStore.ts` | `timerStore`, `startTimer`, `pauseTimer`, `resetTimer` |
| All shared memos | `src/stores/derived.ts` | `legalActions`, `legalTargets`, `autoTarget`, `isWon`, `isStuck`, `isGameOver`, `canUndo`, `canRedo`, `moveCount`, `moveCountLifetime` |

### State machines (doc02.02 + doc02.03 sidecars)

| Artifact | File | Notes |
|---|---|---|
| Game lifecycle JSON | `.carta/02-design/02-game.json` | sidecar of doc02.02 (canonical source) |
| Drag/snap JSON | `.carta/02-design/03-ui-drag.json` | sidecar of doc02.03 (canonical source) |
| Sidecar loader | `src/machines/load.ts` | discovers same-prefix sibling of host doc; do not hard-code path |
| Game machine instance | `src/machines/game.ts` | XState v5 `setup({}).createMachine(json)` |
| Drag machine instance | `src/machines/uiDrag.ts` | XState v5 `setup({}).createMachine(json)` |

### Components (doc02.05 §7)

One file per component, flat under `src/components/`. Names match the component-tree exactly. Per-component contracts (reads, emits, dispatched actions) come from doc02.05 §7 "Per-component contracts".

### Tests (doc02.07)

| Property group | File |
|---|---|
| ENG-1..9 (engine) | `tests/engine.props.test.ts` |
| HIST-1..7 (history) | `tests/history.props.test.ts` |
| UI-1..3 (drag machine) | `tests/ui-drag.props.test.ts` |
| UI-4 (bridge) | `tests/bridge.props.test.ts` |

All four files use `@fast-check/vitest` (`it.prop`, `fc.commands`) per doc02.08.

## Conventions

- **Imports.** Absolute imports rooted at `src/` via `tsconfig.app.json` `paths` (e.g. `import { gameStore } from 'stores/gameStore'`). No deep relative chains (`../../../`).
- **One artifact per file** for stores, components, and machines. The single exception is the engine (`src/engine/index.ts`) which is settled as one file because the functions share private helpers and are conceptually inseparable.
- **Co-located types.** Engine types live in `src/engine/types.ts`. Component prop types live in the component file. There is no top-level `src/types/` directory.
- **No barrel files** beyond `src/engine/index.ts`. Stores, machines, and components are imported by name from their specific file. Barrels create import cycles in Solid's reactivity-tracked modules.
- **Test placement.** Property tests under `tests/`, not co-located. Component tests (if added later) under `tests/components/`. Vitest discovers both via globs.
- **Asset naming.** Card SVGs under `src/assets/cards/` named by `Card.id` (e.g. `H7.svg`). The renderer composes the path: ``import(`/src/assets/cards/${card.id}.svg`)`` or a Vite glob import.
- **Sidecar discovery.** `src/machines/load.ts` reads the sidecar JSON via Vite's `?raw` or JSON import; it never hard-codes the `.carta/02-design/` path more than once. If the bundle moves under `carta`, only this loader needs updating.

## Files outside the design specs

These are needed but not derived from any artifact:

| File | Purpose |
|---|---|
| `package.json` | dep manifest (already exists) |
| `pnpm-lock.yaml` | lockfile (already exists) |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TS configs (already exist; strict + `noUncheckedIndexedAccess` per doc02.08) |
| `vite.config.ts` | Vite config (already exists; add `vite-plugin-solid`, Tailwind v4, base path for GitHub Pages) |
| `vitest.setup.ts` | jsdom + jest-dom matchers (already exists) |
| ~~`tailwind.config.ts`~~ | N/A — Tailwind v4 uses CSS-first config via `@theme` in `src/styles/tailwind.css`. No config file. |
| `biome.json` | already exists (excludes `.carta`, `.carta.json`) |
| `index.html` | Vite entry (already exists) |
| `.github/workflows/deploy.yml` | GitHub Pages deploy on push to main |
| `README.md` | already exists |

## What's deliberately not here

- **Engine internals.** `deal`'s shuffle algorithm, `legalActions`'s ranking pass, `applyAction`'s mutation helpers — all private inside `src/engine/index.ts`. They're implementation, not artifacts.
- **Component internals.** Prop drilling, JSX structure, CSS classes — owned by each component file, not pre-specified.
- **Build outputs.** `dist/`, `coverage/`, `node_modules/` — gitignored; not part of the map.

## Open questions

- **Loader implementation.** `src/machines/load.ts` is sketched but not designed. Settle on the first machine consumer.
- **Vite path alias** (`paths` in tsconfig + `resolve.alias` in vite). Default to `src/*` → `./src/*` unless friction shows.
- **Vite glob import vs static SVG imports for cards.** Glob import (`import.meta.glob`) keeps cards lazy and tree-shakes trivially; settle when the `Card` component is built.
