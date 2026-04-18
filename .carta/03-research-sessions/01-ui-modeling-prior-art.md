---
title: UI modeling — prior art and library survey
status: active
summary: Does our spec-driven UI approach have a name and prior work? Surveys libraries and academic tradition.
tags: [research, ui, state-machines, property-testing, formal-methods]
deps: [doc01, doc02.01, doc02.03]
---

# UI modeling — prior art and library survey

**Date:** 2026-04-17.
**Driving question:** can we describe a UI rigorously enough to prove certain classes of bugs can't happen, before writing component code?

## Context

While drafting doc02 design specs, a series of questions surfaced that didn't have obvious code-level answers:

- Can solitaire games be modeled as state machines?
- How do you formally declare properties that a UI must uphold?
- How do you keep game-logic concerns separate from UI-interaction concerns, and compose their specs?
- How do you enumerate every action the user can take on the screen?
- Is this a known approach with a name?

This session answers those by surveying libraries and looking upstream into the academic tradition.

## Core findings

### 1. Game state as an implicit state machine

A solitaire game *is* a state machine, but best modeled **implicitly**: the state is the data (`GameState`), and transitions are derived by a function `legalActions(state) → Action[]`. You don't enumerate named states ("State 47"); you write predicates over the data shape.

### 2. Properties as universally-quantified predicates

A **property** (formally) is `∀ s ∈ S : P(s)` — a statement true over all reachable states, not just tested examples. Three categories relevant to this project:

- **Safety (invariants)** `□P` — "card count is always 52"
- **Preconditions/postconditions (Hoare)** `{Q} Action {R}` — "if freecell is empty, after move-to-freecell it holds the source card"
- **Metamorphic / reversibility** `g(f(x)) = x` — "apply-then-undo equals the original state"

**Property-based testing (PBT)** (fast-check, Hypothesis, QuickCheck) is the practical tool: a generator creates thousands of random states and checks the property holds, shrinking counterexamples.

### 3. Separation of concerns — three layers

- **Game engine**: pure TS. `GameState`, `legalActions`, `applyAction`. No UI, no DOM.
- **UI orchestration**: drag/snap state machine. Queries the engine (never mutates it); dispatches actions on legal drop.
- **Rendering**: SolidJS components. Subscribe to both stores, emit user events, render derived affordances.

### 4. Enumerating user actions — three orthogonal things

The question "what can the user do?" conflates three distinct concerns:

| Thing | Example | Where it lives |
|---|---|---|
| **Actions** (user-initiated) | open menu, drag a card | finite enumerable catalog |
| **Modal structure** (availability) | "no menu during drag" | state machine (small, ~3 states) |
| **Affordances & responses** | snap threshold, red glow on invalid target, ghost card | derived pure functions of `(GameState, UIState)` |

The output is `availableActions(GameState, UIState) → Action[]` — a function over state, not a static list. Modal exclusion (drag ⇒ no menu) is what a state machine captures cleanly that a predicate list doesn't.

### 5. Not new — 40 years of prior work

This approach has several overlapping names.

| Tradition | Era | Idea |
|---|---|---|
| **Statecharts** (Harel) | 1987 | Hierarchical state machines with orthogonal regions — ancestor of most reactive-UI formalisms |
| **Model-Based UI Development (MBUID)** | 1990s+ | Specify UI abstractly, generate or verify before implementation. W3C published a spec family |
| **ConcurTaskTrees (CTT)** (Paternò) | 1990s | Hierarchical decomposition of "what the user can do" — literally a task/action catalog |
| **Formal Methods for Interactive Systems (FMIS)** | 1990s+ | Workshops on proving UI properties via model checking |
| **UI Description Languages** (USIXML, OpenUIDL) | 2000s | Declarative UI specs meant for verification or retargeting |
| **Property-based testing of UIs** | 2010s+ | Practical modern equivalent (fast-check, QuickCheck) |

## Property classes worth proving for FreeCell

| Class | Example |
|---|---|
| Safety | The menu is never openable while a drag is in progress |
| Liveness | Every drag eventually returns to `idle` (no stuck UI) |
| Completeness | Every affordance the UI offers leads somewhere (no dead ends) |
| Consistency | If the UI says a drop target is legal, the game engine agrees |

## Library survey

### Property-based testing

- **fast-check** — the TypeScript industry standard. Generates, shrinks; has a model-based mode for stateful systems. First choice.
- **JSVerify** — older alternative, less actively maintained.
- **TypeFuzz** — newer, integrates with Vitest/Jest; built-in model-based testing.

### State machines / UI orchestration

- **XState** (+ Stately.ai) — framework-agnostic statecharts; `state.nextEvents` gives available events from current state. Closest off-the-shelf answer to "list of UI actions now."
- **Zag.js** — per-component state machines for common UI patterns (drag, menu, combobox). Powers Chakra UI.
- **@sys/ui-state** — pure UI state orchestration; deterministic playback for testing. Strict separation of logic from rendering.
- **@prismui/core** — modular, event-driven UI state runtime.

### Interaction primitives (handling, not enumeration)

- **React Aria** (Adobe) — declarative, accessible interaction behaviors. About *how* to handle actions, not how to enumerate them.
- **Ariakit** — similar niche, unstyled accessible primitives.

### Command / action registries

- **cmdk**, **kbar** — command palette pattern. Central registry of invokable commands; keyboard-centric (doesn't model pointer/drag).

### Spec-driven frameworks

- **fmodel-decider** — Given-When-Then DSL in TypeScript; executable specs.
- **speckeeper** — validates drift between TypeScript specs and external artifacts (OpenAPI, tests).

### Formal model checking

- **Quint** — TypeScript-adjacent syntax over TLA+-style formalism. Exhaustively proves `∀ reachable states P(s)`.
- **TLA+** (Lamport) — the gold-standard formal specification language. Steep curve; production-proven at AWS.
- **Alloy** — bounded model checker for structural invariants. GUI visualizer, fast (SAT-based).

### Test-time UI enumeration (a posteriori, not spec)

- **Testing Library** `getAllByRole` — enumerates interactive elements from a rendered DOM. Useful for accessibility audits, but not a spec artifact.

## What to adopt for FreeCell

The pragmatic slice that covers ~80% of the value:

1. **Statechart vocabulary** for the modal machine — already reflected in `.statemachines/ui-drag.json` (doc02.03).
2. **Task-model vocabulary** (CTT-style) for the action catalog — to be drafted as doc02.05.
3. **fast-check, model-based mode** for deriving `availableActions(state)` and exhaustively exercising reachable action sequences — informs doc02.02 invariants.
4. **Quint** as an experiment — encode the 4 game-state invariants (doc02.02) and let it exhaustively check them. Defer decision until after the first implementation pass.

XState vs Zag vs custom is deferred to implementation; the design specs stay tool-agnostic.

## Open threads

- Adopt **CTT** naming convention for the action catalog, or invent local naming?
- Try **Quint** on doc02.02 invariants as a one-off experiment — does the proving effort pay off vs. fast-check alone?
- How to unify the game lifecycle machine (`.statemachines/game.json`) and the UI drag machine (`.statemachines/ui-drag.json`) when computing `availableActions` — product of two machines, or single orchestrator?
- Should affordance rules (green glow, red glow, ghost card) be declared as data (machine-readable, generator-friendly) or left to CSS classes computed inside components?

## Sources

### Academic / formalisms

- [Introduction to Model-Based User Interfaces (W3C)](https://www.w3.org/TR/mbui-intro/)
- [User Interface Modeling (Wikipedia)](https://en.wikipedia.org/wiki/User_Interface_Modeling)
- [Statecharts: A Visual Formalism for Complex Systems — Harel 1987 (PDF)](https://www.state-machine.com/doc/Harel87.pdf)
- [Modeling Reactive Systems with Statecharts (Harel)](https://www.weizmann.ac.il/math/harel/modeling-reactive-systems-statecharts)
- [A Survey of Papers from FMIS Workshops](https://enac.hal.science/hal-02364845/document)
- [Using Model Checking for Validation of UI Systems (Springer)](https://link.springer.com/chapter/10.1007/978-3-7091-3693-5_16)
- [Formal models for user interface design artefacts (Springer)](https://link.springer.com/article/10.1007/s11334-008-0049-0)
- [OpenUIDL (ACM)](https://dl.acm.org/doi/abs/10.1145/3397874)
- [USIXML](http://www.usixml.org/en/what-is-usixml.html?IDC=236)

### Formal verification tools

- [TLA+ (Wikipedia)](https://en.wikipedia.org/wiki/TLA%2B)
- [A primer on formal verification and TLA+ (Jack Vanlightly)](https://jack-vanlightly.com/blog/2023/10/10/a-primer-on-formal-verification-and-tla)
- [Use of Formal Methods at Amazon Web Services (Lamport, PDF)](https://lamport.azurewebsites.net/tla/formal-methods-amazon.pdf)

### Property-based testing

- [fast-check (GitHub)](https://github.com/dubzzz/fast-check)
- [Model-based testing — fast-check docs](https://fast-check.dev/docs/advanced/model-based-testing/)
- [Applying Property-Based Testing to User Interfaces (Om Next wiki)](https://github.com/omcljs/om/wiki/Applying-Property-Based-Testing-to-User-Interfaces)

### State machines

- [XState — events and transitions (Stately)](https://stately.ai/docs/transitions)
- [XState — StateMachine API](https://xstate.js.org/api/interfaces/statemachine.html)
- [Zag.js — what is a machine?](https://zagjs.com/overview/whats-a-machine)
- [Zag.js (GitHub)](https://github.com/chakra-ui/zag)

### Interaction primitives & accessibility

- [React Aria (Adobe)](https://react-aria.adobe.com/)
- [Testing Library — ByRole](https://testing-library.com/docs/queries/byrole/)

### Design patterns

- [Command pattern in TypeScript (Refactoring.Guru)](https://refactoring.guru/design-patterns/command/typescript/example)
- [Command pattern for context menu actions at scale (DEV)](https://dev.to/humberd/context-menu-actions-at-scale-command-pattern-in-a-real-life-scenario-9o0)

### Project context

- Local draft: `~/Documents/clown-train/drafts/computation/reality-of-software/artifact-driven development.md` — the ADD philosophy underlying this project's methodology
