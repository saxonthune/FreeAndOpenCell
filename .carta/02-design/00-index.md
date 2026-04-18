---
title: Design
status: draft
summary: Specs that answer "what is needed to implement this feature?" — composable artifacts, not simulations
tags: [design, index]
deps: []
---

# Design

## Purpose

This group holds the specs that an implementing session (human or AI) consumes to build FreeCell. The central question every doc in this group answers is:

> **What is needed to implement this feature?**

An answer is a list of artifacts and their contracts.

## Methodology

We follow **artifact-driven development (ADD)** — see `~/Documents/clown-train/drafts/computation/reality-of-software/artifact-driven development.md`. Specs identify the artifacts the product actually requires; they do not simulate domain entities.

### Artifact sequence

Each spec reduces uncertainty for the one after it. By the time you write a new doc, every input it needs should already be sourced from an upstream artifact — if you're guessing, you're missing a prior doc.

```
Vision (doc01)
  → Architecture (doc02.01)
    → Game state   (doc02.02 + sidecar 02-game.json)
    → UI state     (doc02.03 + sidecar 03-ui-drag.json)
      → Reactivity  (doc02.04 — stores, memos)
        → Component tree (doc02.05 — six inventories → tree)
          → Implementation
```

The component tree (doc02.05) aggregates everything upstream — it's the last spec layer before code. The tree itself is mechanically derived from six inventories; see doc02.05 §7 for the procedure and doc03.02 for the research basis.

### When to add a new doc vs grow an existing one

- **Grow** an existing doc/inventory when the addition has the same shape as existing rows (one more catalog entry, one more memo, one more affordance rule).
- **Add a new doc** when the topic introduces its own deps, has its own update cadence, or generates ≥ ~1 page of artifacts (tables, schemas) that would crowd the host doc.
- **Add a new inventory** to doc02.05 only with a research basis (doc03.02 has the four lineages — Parnas, DSM, Cameleon, Suh, plus Simon as the diagnostic). Don't invent inventory categories ad hoc.

## Out of scope for design

These belong to implementation, not these specs:

- Toolchain, build, deploy, test runner, linting
- Repo scaffolding
- Choice of state-machine library — state-machine sidecars (`02-game.json`, `03-ui-drag.json`) stay tool-agnostic
- Pixel-perfect layout, colors, typography (CSS specifics)

Tooling questions surfaced during design land in the relevant doc's "Open questions" section, then defer.

## Contents

- doc02.01 Architecture — the artifact map and the layering
- doc02.02 Game state — `GameState` shape, invariants, legal-action types
- doc02.03 UI state — drag/snap/hover state and its boundary with game state
- doc02.04 Reactivity — stores, derived signals, re-render granularity
- doc02.05 Component tree — six inventories that derive the tree, plus the tree itself
- doc02.06 Layout — AUI-level layout (regions, proportions, cascade compression)
- doc02.07 Testing plan — property-test acceptance bar for the engine

State machines referenced by these docs live as carta sidecars next to their host doc — JSON placeholders for now: `02-game.json` (doc02.02), `03-ui-drag.json` (doc02.03).
