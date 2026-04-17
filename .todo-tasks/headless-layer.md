# Headless layer — engine, stores, machines, property tests

## Motivation

The `.carta/02-design/` workspace is now complete: it specifies the FreeCell engine (doc02.02), UI state and drag machine (doc02.03), reactivity stores (doc02.04), and a property-based testing acceptance bar (doc02.07). doc02.09 maps every artifact to a source-file path. doc02.08 locks in the toolchain (pnpm, Vite, Solid, TypeScript strict, Vitest, fast-check + `@fast-check/vitest`, XState v5, Tailwind, Biome).

The repo currently holds stub files at every code-map path that throw `Error('not implemented')` so the scaffold typechecks. **This task replaces those stubs with real implementations of the entire headless layer** — every file in `src/engine/`, `src/stores/`, `src/machines/`, plus the four property test files in `tests/`. UI components are deliberately out of scope; they live behind type interfaces this task implements but produces no pixels.

Definition of done: the four property test groups in doc02.07 (ENG-1..9, HIST-1..7, UI-1..3, UI-4) all pass under `@fast-check/vitest`, and `pnpm typecheck` + `pnpm build` are clean.

## Do NOT

- Do **NOT** use `Math.random` anywhere. `deal(seed)` must be deterministic. Implement a small seeded PRNG inline (e.g. mulberry32 or sfc32 — both are public-domain, ~5 lines). doc02.02 §Engine API lists `seed: number` as the only entropy source.
- Do **NOT** throw from `applyAction` for illegal moves. Return `Result.error('illegal_move')`. Throws are reserved for engine bugs (invariant violations).
- Do **NOT** mutate `GameState` in place. Every transition returns a new immutable object — doc02.04 settles this and the snapshot strategy depends on it (pointer-copy snapshots).
- Do **NOT** add UI, JSX, components, DOM imports, or anything browser-only to this layer. The four property test files run in Node, not jsdom.
- Do **NOT** modify `src/components/`, `src/styles/`, `src/index.css`, `src/index.tsx`, `index.html`, `src/assets/`, `vite.config.ts`, `tsconfig.app.json`, `biome.json`, `package.json`, or `pnpm-lock.yaml`. They are owned by other tasks (UI scaffold, deploy, scaffolding).
- Do **NOT** add new npm dependencies. Everything needed is installed: `xstate`, `fast-check`, `@fast-check/vitest`, `solid-js`, `vitest`. If you find yourself wanting another package, reconsider — the spec is sized to what's installed.
- Do **NOT** write golden-game replay tests. doc02.07 §out-of-scope explicitly defers them; the property suite is the entire acceptance bar.
- Do **NOT** modify `.carta/02-design/02-game.json` (the game-lifecycle sidecar — it's already correct per doc02.02 §State machine). You **may** modify `.carta/02-design/03-ui-drag.json` only if XState v5's `setup({}).createMachine(json)` rejects the existing structure; if so, preserve the state names and transition labels exactly as named in doc02.03 and the existing JSON, and document the change in your PR/commit message.
- Do **NOT** hard-code the sidecar path (`.carta/02-design/...`) in more than one file. `src/machines/load.ts` is the only place that knows about that path. Other modules import via the `sidecars/*` Vite alias (already configured in `vite.config.ts` and `tsconfig.app.json`).
- Do **NOT** lower the property-test sample count below `numRuns: 10000` (doc02.07 §acceptance bar). Local watch mode may use a smaller number, but the committed test config asserts at 10k.
- Do **NOT** add comments that restate what the code does. doc02.02 / doc02.04 already explain the why; the code is the what.

## Plan

### 1. Read the design specs (in order)

Open these and keep them in working memory throughout the task. Each is short (1–3 pages):

- `.carta/MANIFEST.md` — index, for orientation only
- `.carta/02-design/02-game-state.md` (doc02.02) — `GameState`, `Card`, `Action`, invariants INV-1..4, action types ACT-1..4, engine API (`Result<T,E>`, `deal`, `legalActions`, `applyAction`, lifecycle)
- `.carta/02-design/02-game.json` — game-lifecycle sidecar (canonical XState-shaped JSON; do not modify)
- `.carta/02-design/03-ui-state.md` (doc02.03) — `UIState` schema, drop-outcome table, auto-stack-select
- `.carta/02-design/03-ui-drag.json` — drag-machine sidecar (XState-shaped; events `POINTER_DOWN`, `POINTER_MOVE`, `POINTER_UP_LEGAL`, `POINTER_UP_ILLEGAL`, `ANIMATION_END`; states `idle`, `dragging`, `snapping`, `cancelling`)
- `.carta/02-design/04-reactivity.md` (doc02.04) — stores (`gameStore`, `uiStore`, `historyStore`, `timerStore`), every memo, cross-store effects, two-value `MoveCounter`, win-stickiness vs stuck-permeability
- `.carta/02-design/07-testing-plan.md` (doc02.07) — every property to implement (ENG-1..9, HIST-1..7, UI-1..3, UI-4), the acceptance bar (N=10k under `fc.commands`)
- `.carta/02-design/08-toolchain.md` (doc02.08) — locked-in libraries (XState v5 `createActor`, `@fast-check/vitest`)
- `.carta/02-design/09-code-map.md` (doc02.09) — exact file paths and per-artifact mapping

### 2. Implement `src/engine/types.ts`

Replace the stubs with the full type set:

- `Suit` (`'H' | 'D' | 'C' | 'S'`) and `Rank` (`1..13`) — keep as already declared.
- `Card`: `{ suit: Suit; rank: Rank; id: string }` where `id` is `${suit}${rank}` (e.g. `H7`, `S13`). Provide `cardId(c: Card): string` and `parseCardId(id: string): Card` — `parseCardId` must throw `Error` on malformed input (this is a programming error, not a user error, so throw is correct).
- `GameState`: `{ cascades: Card[][]; freecells: (Card | null)[]; foundations: Record<Suit, Rank | 0>; seed: number; moveCountLifetime: number }`. The current stub is correct; keep it.
- `Action`: discriminated union over the action types in doc02.02 (`MOVE_STACK`, `NEW_GAME`, `RESTART_GAME`). doc02.02 §action types lists ACT-1..4 — note that ACT-1 (single card to cascade), ACT-2 (single card to freecell), ACT-3 (single card to foundation), and ACT-4 (stack to cascade) are all reified in the wire-level `Action` union as a single `MOVE_STACK { from: string; count: number; to: string }` per doc02.03 §auto-stack-select. The engine's internal validation distinguishes them; the wire payload does not.
- `ActionError`: union of error tags. Keep `'illegal_move' | 'unknown_source' | 'unknown_target' | 'game_over'` and add any others the implementation discovers it needs.
- `Result<T, E>`: tagged union as currently declared. Keep.
- Encode `from`/`to` location strings as `'cascade.<i>.<j>' | 'freecell.<i>' | 'foundation.<suit>'` (per doc02.03 schema example). Provide `parseLocation(s)` and `formatLocation(loc)` helpers as private — used by `applyAction` and `legalActions` internally.

### 3. Implement `src/engine/index.ts`

Replace the stubs. All functions are pure (no side effects, no hidden state). Re-export types from `./types.js` at the bottom.

- `deal(seed: number): GameState` — initial deal of all 52 cards across the 8 cascades using a deterministic shuffle seeded by `seed`. Standard FreeCell deal: cascades 0..3 get 7 cards each, cascades 4..7 get 6 cards each. Use a Fisher–Yates shuffle driven by a seeded PRNG. Foundations start at 0 for each suit; freecells all `null`; `moveCountLifetime: 0`.
- `legalActions(state: GameState): Action[]` — enumerate every `MOVE_STACK` whose preconditions hold. The set must be sound and complete in the sense of ENG-5/ENG-6 (doc02.07): every action returned applies cleanly, and every applicable action is returned. Preconditions cover the four canonical types (cascade-to-cascade with alternating-color descending, to freecell if empty, to foundation if next rank, stack moves bounded by `(empty_freecells + 1) * 2^empty_cascades` per the supermove formula).
- `applyAction(state, action): Result<GameState, ActionError>` — verify the action is in `legalActions(state)`; if not, return `Result.error('illegal_move')` without mutating state (ENG-7). On success: produce the new state, increment `moveCountLifetime`, return `Result.ok(newState)`. `MOVE_STACK` to a foundation must update `foundations[suit]` accordingly. Actions outside the catalog (e.g. unknown `from`/`to` strings) return `Result.error('unknown_source' | 'unknown_target')`.
- `isWon(state)` — all four foundations at rank 13.
- `isStuck(state)` — `legalActions(state).length === 0` and not won (per doc02.07 ENG-9).

Per doc02.07 ENG-8 ("terminal states are stable"): once `isWon(state)` is true, `applyAction(state, *)` must always return `Result.error('game_over')`.

### 4. Implement `src/engine/invariants.ts`

`assertInvariants(state)` checks INV-1..4 (doc02.02): card count = 52; uniqueness across all piles; every cascade is a valid alternating-color descending sequence (or empty/single); foundation completeness implies absence elsewhere. Throw `Error` on any violation with a message that names the invariant. Used internally by tests (ENG-1..4) but may also be called in dev/debug builds.

### 5. Implement the four stores

Replace the stubs in `src/stores/`:

- `gameStore.ts` — Solid `createSignal<GameState>` initialized to `deal(0)` (or null then set after first `NEW_GAME` — choose one and document inline). Export `gameStore` (the accessor signal) and `setGameState`. The signal is replaced wholesale on every transition; never mutate.
- `uiStore.ts` — Solid `createStore<UIState>` initialized per doc02.03 schema (drag null, modal null, snap proximityThresholdPx 30). Export `uiStore`, `setUiStore`, plus mutators `dragStart`, `dragMove`, `dragEnd`, `openModal`, `closeModal`. Mutators may directly call `setUiStore(...)` — they do not need to drive an XState actor. (The XState machine in `src/machines/uiDrag.ts` is for property-testing the transition logic in isolation; the actual UI dispatches via these mutators in the next task.)
- `historyStore.ts` — Solid `createStore<{snapshots: GameState[]; head: number}>`. Implement `pushHistory(state)` (append, truncating forward branch if `head` is not at tip), `undo()` (decrement head if `head > 0`), `redo()` (increment head if `head < snapshots.length - 1`), `clearHistory()` (reset to single-element snapshots with current state). Pointer-copy semantics; no deep cloning (doc02.04).
- `timerStore.ts` — Solid `createStore<{elapsedMs: number; running: boolean}>`. Implement `startTimer`, `pauseTimer`, `resetTimer`. Add a `tickTimer(deltaMs)` for tests and the future component-level interval driver. The actual `setInterval` lives outside this layer (a UI task wires it).

### 6. Implement `src/stores/derived.ts`

Replace stubs with real Solid `createMemo`s per doc02.04 §Derived signals. All ten memos: `legalActions` (re-export of engine fn applied to current `gameStore()`), `legalTargets` (Set<string> of pile IDs from `legalActions` filtered by current `uiStore.drag.sourceId`), `autoTarget(card)` (function — not a memo), `isWon`, `isStuck`, `isGameOver`, `canUndo` (false when `isWon`), `canRedo`, `moveCount` (from `historyStore.head`), `moveCountLifetime` (read from current `gameStore().moveCountLifetime`).

Per doc02.04 §Cross-store effects: also implement an effect that, when `gameStore` enters `isWon` or `isStuck`, calls `pauseTimer()`. This may live in `derived.ts` as a top-level `createEffect` or in a new `src/stores/effects.ts` — your choice, but document where.

### 7. Implement the machine layer

Replace the stubs in `src/machines/`:

- `load.ts` — single source of sidecar paths. Imports the two JSONs via the `sidecars/*` Vite alias (`import gameJson from 'sidecars/02-game.json'` etc.) and exports `loadSidecar(name: 'game' | 'uiDrag'): unknown`. The current stub is correct in shape; verify it compiles after types tighten.
- `game.ts` — `setup({}).createMachine(loadSidecar('game') as ...)`. Use XState v5's `setup` API for typed events (`{ type: 'DEAL' } | { type: 'READY' } | { type: 'ACTION' } | { type: 'WIN' } | { type: 'STUCK' }`). The machine itself is degenerate (5 states, no actions); the value is in the typed boundary.
- `uiDrag.ts` — same pattern for the drag machine. Events from doc02.03 §state machine: `POINTER_DOWN`, `POINTER_MOVE`, `POINTER_UP_LEGAL`, `POINTER_UP_ILLEGAL`, `ANIMATION_END`, plus the action-catalog events from doc02.05 §2 that interact with drag-phase guards (`OPEN_MENU`, `DRAG_START`). UI-2 and UI-3 (doc02.07) require these to be rejectable — model them as transitions guarded by phase, or expose a precondition function the property test can call. Either is acceptable; document the choice.

### 8. Write `tests/engine.props.test.ts`

Use `@fast-check/vitest`'s `it.prop` and `fc.commands` per doc02.07. One stateful test that:

- Generates a random `seed`, runs `deal(seed)` to produce the model state.
- `fc.commands` over an action set drawn from `legalActions(state)` (so commands are always legal). After each `applyAction`, assert ENG-1..4 (invariants), ENG-5 (legality soundness — already by construction), ENG-7 (illegal action rejection — sample one random action from outside `legalActions` and check it returns `Result.error` and state unchanged), ENG-8 (terminal stability if `isWon`), ENG-9 (consistency).
- ENG-6 (completeness within types) is a separate property: for a sample of states reached during the random walk, exhaustively enumerate all candidate `MOVE_STACK` actions over `from × to` pairs and assert that every one whose preconditions hold appears in `legalActions(state)`.

`numRuns: 10000` per doc02.07 acceptance bar. Use fast-check's default shrinking.

### 9. Write `tests/history.props.test.ts`

`fc.commands` over `{apply, undo, redo, restart, newGame}`. Assert HIST-1..7 (doc02.07): undo+redo identity, no-op undo from fresh deal, forward truncation on new branch after undo, restart clears history, win-stickiness of `canUndo`, undo-out-of-stuck allowed (the difference between win and stuck per doc02.04), counter relations (`moveCount === historyStore.head`; `moveCountLifetime` monotonically non-decreasing).

`numRuns: 10000`.

### 10. Write `tests/ui-drag.props.test.ts`

`fc.commands` over the drag machine's events (`POINTER_DOWN`, `POINTER_MOVE`, `POINTER_UP_LEGAL`, `POINTER_UP_ILLEGAL`, `ANIMATION_END`, plus `OPEN_MENU`, `DRAG_START`). Drive an XState actor created from the `uiDrag` machine (`createActor(uiDragMachine).start()`).

UI-1: any sequence ending with `POINTER_UP_*` then `ANIMATION_END` reaches `idle` within bounded steps (liveness). UI-2: when `phase !== 'idle'`, `OPEN_MENU` is rejected (precondition check returns false, OR machine remains in current state on send). UI-3: when modal is open, `DRAG_START` is rejected. The modal field lives in `uiStore`, not the machine — your test will need to thread that state in.

`numRuns: 10000`.

### 11. Write `tests/bridge.props.test.ts`

The combined stateful test from doc02.07 §UI-4. `fc.commands` produces a random sequence of engine actions and pointer events; the model maintains a synthetic `(GameState, drag.sourceId, hoveredTargetId)` triple. After every step, assert that the UI's "is legal drop?" computation (`legalTargets.has(hoveredTargetId)` against current state) agrees with `legalActions(currentState).some(a => a.from === drag.sourceId && a.to === hoveredTargetId)`.

`numRuns: 10000`.

### 12. Final pass

- Run `pnpm typecheck` — must be clean. Strict mode + `noUncheckedIndexedAccess` are on.
- Run `pnpm test` — all four property files green at N=10k.
- Run `pnpm lint` — Biome must pass. (Biome may flag style; fix in place.)
- Run `pnpm build` — must succeed (the existing component stubs render `null` so the build won't reference unfinished UI logic).

If any property fails: the failure is a real spec/impl bug, not a test bug. Read the shrunk minimal counter-example and decide whether the spec doc is wrong or the implementation is wrong. **If the spec is wrong, stop and surface it — do not silently change the spec to match the implementation.** Add a note to your result describing the conflict.

## Files to Modify

- `src/engine/types.ts` — full type definitions
- `src/engine/index.ts` — `deal`, `legalActions`, `applyAction`, `isWon`, `isStuck`
- `src/engine/invariants.ts` — `assertInvariants`
- `src/stores/gameStore.ts` — initialised signal
- `src/stores/uiStore.ts` — store + mutators
- `src/stores/historyStore.ts` — store + push/undo/redo/clear
- `src/stores/timerStore.ts` — store + start/pause/reset/tick
- `src/stores/derived.ts` — all ten memos plus pause-on-game-over effect
- `src/machines/load.ts` — sidecar import surface (verify compiles after types tighten)
- `src/machines/game.ts` — typed XState v5 machine from `02-game.json`
- `src/machines/uiDrag.ts` — typed XState v5 machine from `03-ui-drag.json`
- `tests/engine.props.test.ts` — ENG-1..9
- `tests/history.props.test.ts` — HIST-1..7
- `tests/ui-drag.props.test.ts` — UI-1..3
- `tests/bridge.props.test.ts` — UI-4
- `.carta/02-design/03-ui-drag.json` — only if XState v5 rejects current shape; preserve state and event names exactly

## Verification

```bash
set -e
cd /home/saxon/code/github/saxonthune/FreeAndOpenCell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

All five steps must succeed. `pnpm test` is the load-bearing one — it runs the four property files at N=10k, which is the doc02.07 acceptance bar for "engine is implementation-complete."

## Out of Scope

- Any UI work: no JSX in `src/components/`, no CSS, no Tailwind theme tokens, no card SVGs, no pointer event wiring, no `setInterval` for the timer. The component stubs already in place stay as-is — they render `null` so the build passes without touching them.
- GitHub Actions deploy workflow.
- DOM-level interaction tests (Testing Library, Playwright).
- Performance budgets or perf properties (doc02.07 §out-of-scope).
- Persistence / localStorage (doc02.04 §persistence — out of scope for v1).
- Solvability search.

## Notes

- **Why one big task instead of three smaller ones.** The headless layer is internally cohesive: every file in `src/engine/`, `src/stores/`, and `src/machines/` shares a contract surface (the engine's `Result` type, the store interfaces, the XState machine shapes). Splitting it would require stub interfaces between sub-tasks that the next task immediately replaces — pure churn. The UI work, in contrast, has natural seams (static layout vs. interactivity vs. modals) and will be groomed as 3–4 separate tasks once the headless layer is green.
- **Why N=10k not N=100.** doc02.07 §acceptance bar. Property tests at low N look like they're passing but routinely miss bugs the shrinker surfaces at 10k. CI minutes are cheap; spec violations leaking into the UI layer are not.
- **XState v5 + fast-check.** `createActor(machine).start()` returns an actor you drive with `actor.send(event)` and inspect with `actor.getSnapshot().value`. Both are synchronous for our machines (no `invoke`, no `after`). `fc.commands` works directly: each command is a class with `check(model)` (precondition) and `run(real, model)` (transition + assertion).
- **Vite alias for sidecars.** `vite.config.ts` already has `sidecars: ./.carta/02-design`, and `tsconfig.app.json` has the matching `paths` entry plus `resolveJsonModule: true`. JSON imports work out of the box: `import drag from 'sidecars/03-ui-drag.json'`.
- **The current stubs throw `Error('not implemented')`.** Replace, don't add a parallel implementation. The compiler will guide you — every export must keep its signature so neighbour modules continue to import correctly.
- **No barrel files.** doc02.09 §conventions forbids barrels except in `src/engine/index.ts`. Import each store and machine from its specific file.
- **If a property fails after honest implementation effort.** It's a real signal. The shrinker will give you a small counter-example. Walk it through the relevant spec doc — it's almost certainly either (a) the spec under-specifies a case, or (b) you read the spec wrong. Do not paper over by lowering N or weakening the property. Stop and document the conflict in your `.result.md`.
