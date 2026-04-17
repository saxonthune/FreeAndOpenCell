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

## Method

We follow artifact-driven development (ADD) — see `~/Documents/clown-train/drafts/computation/reality-of-software/artifact-driven development.md`. Specs identify the artifacts the product actually requires; they do not simulate domain entities.

## Boundary

This group specifies *what* is needed. A separate session handles *how* (toolchain, build, test runner, deploy). Don't bake infrastructure choices into these docs.

## Contents

- doc02.01 Architecture — the artifact map and the layering
- doc02.02 Game state — `GameState` shape, invariants, legal-action types
- doc02.03 UI state — drag/snap/hover state and its boundary with game state
- doc02.04 Component tree — SolidJS components and what each consumes
- doc02.05 Reactivity — stores, derived signals, re-render granularity

State machines referenced by these docs live in `.statemachines/` at the repo root, as JSON placeholders for now.
