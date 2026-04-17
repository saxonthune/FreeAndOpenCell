---
title: Testing plan
status: draft
summary: Property-based test plan — engine invariants, history laws, UI-machine liveness. Acceptance bar for "engine is done."
tags: [testing, properties, fast-check]
deps: [doc02.02, doc02.03, doc02.04, doc03.01]
---

# Testing plan

What must be true, and how we prove it. The acceptance bar for "engine is implementation-complete" is: every property below holds under fast-check `fc.commands` for **N = 10,000 runs** with default shrinking enabled. No golden-game replay test is needed in v1 (deferred — the property suite covers it).

The three tradition mappings (safety / Hoare / metamorphic) come from doc03.01. Each row below names which tradition the property belongs to.

## Layer 1 — engine properties

Run as fast-check stateful tests (`fc.commands`) where the model is the engine itself: start from `deal(seed)`, generate a random walk through `legalActions`, apply each chosen action, assert all invariants hold after every step.

| ID | Tradition | Property | Statement |
|---|---|---|---|
| ENG-1 | safety | INV-1 holds always | `cards(state).length === 52` after every action |
| ENG-2 | safety | INV-2 holds always | every card appears exactly once across cascades + freecells + foundations |
| ENG-3 | safety | INV-3 holds always | every cascade is a valid alternating-color descending sequence (or a single card, or empty) |
| ENG-4 | safety | INV-4 holds always | for every suit `s`, ranks `1..foundations[s]` are absent from cascades and freecells |
| ENG-5 | Hoare | `legalActions` is sound | every action returned by `legalActions(s)` returns `ok` from `applyAction(s, a)` |
| ENG-6 | Hoare | `legalActions` is complete (within types) | for every action type ACT-1..ACT-4, if the preconditions hold for some source/target in `s`, that action appears in `legalActions(s)` |
| ENG-7 | Hoare | illegal actions are rejected | for any action *not* in `legalActions(s)`, `applyAction(s, a)` returns `{ ok: false }` and `state` is unchanged |
| ENG-8 | safety | terminal states are stable | once `isWon(s)` is true, no action changes state; engine stops accepting moves |
| ENG-9 | safety | `isStuck` and `isWon` consistency | if `isStuck(s)` then `legalActions(s).length === 0`; if `isWon(s)` then `isStuck(s)` is false (definitionally) |

## Layer 2 — history properties

Wrap the engine in `historyStore` and exercise the action set `{apply, undo, redo, restart}`.

| ID | Tradition | Property | Statement |
|---|---|---|---|
| HIST-1 | metamorphic | undo+redo identity | for any reachable history, `undo()` then `redo()` produces the same `gameStore` value |
| HIST-2 | safety | undo from fresh deal is no-op | immediately after `NEW_GAME`, `canUndo` is false; calling `undo()` does nothing |
| HIST-3 | safety | new branch truncates forward | after any `undo()` followed by an `apply`, `canRedo` is false |
| HIST-4 | metamorphic | restart clears history | after `RESTART_GAME`, `canUndo` and `canRedo` are both false; `historyStore.snapshots.length === 1` |
| HIST-5 | safety | undo respects win-stickiness | once `isWon` is true, `canUndo` is false (per doc02.04) |
| HIST-6 | safety | undo out of stuck is allowed | `isStuck` does not force `canUndo` false; undoing into a state with legal moves clears `lost` |
| HIST-7 | metamorphic | counters | `moveCount === historyStore.head`; `moveCountLifetime` is monotonically non-decreasing across the game |

## Layer 3 — UI-machine properties

Run the drag state machine in isolation (no DOM), driven by random `POINTER_*` event sequences.

| ID | Tradition | Property | Statement |
|---|---|---|---|
| UI-1 | liveness | drag eventually returns to idle | for any sequence ending with `POINTER_UP_*` then `ANIMATION_END`, the machine reaches `idle` within bounded steps |
| UI-2 | safety | no menu during drag | for any sequence in which `drag.phase !== 'idle'`, `OPEN_MENU` is rejected (precondition fails) |
| UI-3 | safety | no drag during modal | for any state with `modal !== null`, `DRAG_START` is rejected |
| UI-4 | consistency | UI legality matches engine | for any reachable `(GameState, drag.sourceId, hoveredTargetId)`, the UI's "is legal drop?" computation agrees with `legalActions(state).some(a => a matches)` |

UI-4 is the bridge property — it crosses layers and is the most likely place for bugs (UI says "green outline" but engine rejects on apply, or vice versa). It runs as a stateful test combining engine and UI machines under shared random input.

## Acceptance bar

| Layer | Criterion |
|---|---|
| Engine (ENG-1..9) | all pass under `fc.commands`, N=10k runs, default shrinking |
| History (HIST-1..7) | all pass under `fc.commands`, N=10k runs |
| UI machine (UI-1..3) | all pass under `fc.commands`, N=10k runs |
| Bridge (UI-4) | passes under combined stateful test, N=10k runs |

When all four bars are met, the engine + reactivity layer is implementation-complete. CUI work (SolidJS components, CSS) can begin earlier in parallel since it consumes the engine through stable types.

## Out of scope for v1

- **Golden-game replay test** — recording a known winning sequence and replaying it. Deferred; the property suite already exercises winnable trajectories implicitly.
- **DOM-level interaction tests** (Testing Library, Playwright). The bridge property (UI-4) gives most of the value without paying the slowness/flake cost. May be added later for visual regression.
- **Solvability search** — proving that a given deal is winnable. Out of scope; FreeCell is famously ~99.9999% solvable and we accept the rare unwinnable deal (the `lost` state catches it).
- **Performance properties** (e.g. "applyAction completes in < 1ms"). Not specified at AUI level.

## Tooling

- **fast-check** — first choice (doc03.01 §library survey). Built-in `fc.commands` for stateful testing; default shrinker handles minimisation.
- Test runner: TBD at implementation (Vitest is the default for Solid).
- **Quint** (doc03.01) experiment — encode INV-1..4 in Quint and compare exhaustive proof vs. fast-check sampling. Out of scope for v1; tracked as a future research session.

## Open questions

- Should the test plan grow to include CUI-level tests (component snapshot, accessibility audits) once components exist, or stay strictly engine-level? Default: stay engine-level, add a doc02.08 if CUI testing becomes its own concern.
- N = 10,000 is a starting point. Tune based on shrink time and CI budget.
