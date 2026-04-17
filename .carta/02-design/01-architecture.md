---
title: Architecture
status: draft
summary: Artifact-driven framing; what artifacts compose the FreeCell product
tags: [architecture, add]
deps: []
---

# Architecture

## Framing

This project follows **artifact-driven development** (ADD). See `~/Documents/clown-train/drafts/computation/reality-of-software/artifact-driven development.md` for the full philosophy.

> The software implements the product, and nothing else.

We do not simulate domain entities ("a Game has a Deck and Players who take Turns"). We identify the artifacts the product actually requires, and compose them. The central question for every spec in this group is:

> **What is needed to implement this feature?**

An answer is a list of artifacts and their contracts. Nothing more.

## Top-level artifacts

For FreeCell, the artifacts decompose along two axes — game and interaction:

| Artifact | What it is | Where it lives | Spec |
|---|---|---|---|
| `GameState` | data shape of a FreeCell position | pure TS module | doc02.02 |
| `legalActions(state)` | function: state → list of valid actions | pure TS module | doc02.02 |
| `applyAction(state, action)` | function: state + action → new state | pure TS module | doc02.02 |
| Game state machine | game lifecycle (deal → play → win) | `.statemachines/game.json` | doc02.02 |
| `UIState` | transient interaction state | reactive store | doc02.03 |
| Drag state machine | drag/snap/cancel transitions | `.statemachines/ui-drag.json` | doc02.03 |
| Component tree | rendered surface | SolidJS components | doc02.04 |
| Reactive bindings | signals/memos that flow state to components | SolidJS primitives | doc02.05 |

## Layering

```
SolidJS components (doc02.04)
        │ subscribe via
        ▼
Reactive stores (doc02.05) ── reads ──► GameState (doc02.02)
        │                                    ▲
        │ pointer events                     │ applyAction
        ▼                                    │
   UIState (doc02.03) ──── on legal drop ────┘
```

The game engine knows nothing about the UI. The UI calls `legalActions` / `applyAction` and never mutates `GameState` directly.

## Out of scope

A separate session handles:

- Toolchain, build, deploy
- Test runner, linting, formatting
- Repo scaffolding
- Choice of state-machine library (XState, Zag, custom). The `.statemachines/*.json` files are tool-agnostic placeholders.
