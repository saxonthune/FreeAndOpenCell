---
title: Component partition — prior art and inventory method
status: draft
summary: What artifacts make a good component partition fall out? Parnas, DSM, Cameleon, Suh, Simon.
tags: [research, ui, components, partition, modularity]
deps: [doc02.05, doc03.01]
---

# Component partition — prior art and inventory method

**Date:** 2026-04-17.
**Driving question:** what artifacts, when inventoried, cause a well-partitioned component tree to fall out? Is this a known problem with known methods, or is component-tree design irreducibly taste?

## Context

An earlier component-tree draft was written from intuition (since superseded by doc02.05). While cross-checking it against doc02.04 (reactivity), the question surfaced: can we state a rule that, if followed, forces a good partition? This session answers yes — there is a well-understood method spanning 50+ years of software-engineering and HCI research, and its pragmatic output is a set of six inventories whose tabulation makes the tree mechanical (now doc02.05).

## Core finding

A "good" component partition is one that is **near-decomposable** (Simon) and **information-hiding** (Parnas): each component hides one design decision likely to change, and its interface reveals only what callers need. The method for arriving at such a partition is to make dependency structure explicit, then cluster by minimizing cross-module edges.

Four traditions converge, each contributing a different piece:

| Tradition | Contribution |
|---|---|
| **Parnas 1972** — *On the Criteria To Be Used in Decomposing Systems into Modules* | The criterion. Each module hides one design decision likely to change. Rejects flowchart-style decomposition (sequencing by processing steps). The interface should reveal as little as possible about internals. |
| **Design Structure Matrix** (Steward; Eppinger) | The math. Build a square matrix of inter-element dependencies; a partitioning algorithm reorders rows/columns so most edges fall below the diagonal. Clusters become modules. Directly applicable with rows = regions, columns = state slices + actions. |
| **Model-Based UI / Cameleon Reference Framework** (W3C) | The levels. Task model → Abstract UI → Concrete UI → Final UI. The AUI layer is the modality-independent decomposition — where partition is decided, *before* widget choice. |
| **Axiomatic Design** (Suh) | The quality test. A design is "good" when the mapping from functional requirements to design parameters is diagonal. Off-diagonal entries flag leaked abstractions. |
| **Simon 1962/1969** — *The Architecture of Complexity* | The diagnostic vocabulary. Near-decomposability (strong intra, weak inter). High/low-frequency separation — maps directly to reactivity hotspots. The empty-world hypothesis — most pairs don't interact; don't model the interactions that don't exist. |

## From research to the six inventories

Each inventory in doc02.05 encodes one claim from the research:

| Inventory | Research claim |
|---|---|
| 1. State shape | Parnas: the state a component hides *is* the design decision it owns. |
| 2. Action catalog (trigger → DOM region) | Cameleon/MBUID: task model → AUI. Each task's trigger surface is the region that implements it. |
| 3. Mutation-rate map | Simon: separate high-frequency from low-frequency dynamics; near-decomposability at the rate layer. |
| 4. Read set per region | DSM: the matrix whose partitioning reveals clusters. Read sets are rows; state slices are columns. |
| 5. Affordance rules per region | Parnas: colocate the rule with the state it hides. A cross-region affordance signals a missing parent. |
| 6. Orthogonal regions | Harel statecharts: orthogonal regions are independent by construction. Also Simon's empty-world hypothesis. |

## Cameleon layer map

The Cameleon Reference Framework names the layers we've been building:

| Cameleon layer | Our artifact |
|---|---|
| Task model | Action catalog (doc02.05 §2; may grow into its own doc) |
| Abstract UI (AUI) | Component tree (doc02.05) — modality-independent regions |
| Concrete UI (CUI) | SolidJS component implementations (not yet written) |
| Final UI (FUI) | Rendered DOM |

The specs we've written so far sit at AUI. Widget choice (SolidJS idioms, `<button>` vs custom element) belongs to CUI and is handled at implementation; design docs stay tool-agnostic.

## Method in one paragraph

Write the six inventories as tables. Treat rows as candidate components. Merge two rows when their read sets and affordance owners overlap; split a row when any of its fields sits in a higher mutation-rate tier; arrange orthogonal rows as siblings rather than nesting them. The tree is the result. "Good partition" is testable: count off-diagonal cells in the (region × state-slice) matrix (Suh); count cross-region affordance rules (Parnas); count rate-tier violations (Simon). Low counts → good tree.

## What to adopt for FreeCell

1. **doc02.05 — component tree (inventory-derived).** Written this session as the operational output.
2. **Keep Cameleon layer names in mind.** Don't let CUI concerns (SolidJS idioms, CSS classes) leak into AUI docs.
3. **Defer DSM tooling.** For ~20 regions, a markdown table is enough. Revisit if the tree grows past ~50 components.
4. **Use Suh's diagonal test as a review heuristic.** When reviewing a proposed component, count off-diagonal entries in its (reads × writes) matrix — high counts flag leaked abstractions.

## Open threads

- Is there a lightweight DSM-style linter that could scan the six tables and flag off-diagonal overlap automatically? Would be a natural speckeeper (doc03.01) target.
- CTT (ConcurTaskTrees) vs the flat action catalog — worth revisiting once the catalog grows past ~10 entries or acquires nested tasks.
- Does doc02.04 (reactivity) want a Parnas-style review? Store choice (SolidJS signals vs stores vs signal-of-immutable) is a "design decision likely to change" — it should be hidden behind one component's interface, not leak into sibling components.

## Sources

### Software modularity

- [On the Criteria To Be Used in Decomposing Systems into Modules — Parnas 1972 (CACM)](https://dl.acm.org/doi/10.1145/361598.361623)
- [Original PDF (1971 tech report)](https://prl.khoury.northeastern.edu/img/p-tr-1971.pdf)
- [The morning paper summary](https://blog.acolyer.org/2016/09/05/on-the-criteria-to-be-used-in-decomposing-systems-into-modules/)

### Design Structure Matrix

- [Design Structure Matrix (Wikipedia)](https://en.wikipedia.org/wiki/Design_structure_matrix)
- [DSM Suite — overview and partitioning](https://dsmsuite.github.io/dsm_overview.html)
- [Design Structure Matrix — ScienceDirect topic page](https://www.sciencedirect.com/topics/computer-science/design-structure-matrix)
- [DSMweb — Dependency and Structure Modelling community](https://dsmweb.org/)

### Model-Based UI / Cameleon

- [MBUI — Abstract User Interface Models (W3C)](https://www.w3.org/TR/abstract-ui/)
- [Introduction to Model-Based User Interfaces (W3C)](https://www.w3.org/TR/mbui-intro/)
- [Cameleon Reference Framework (W3C community wiki)](https://www.w3.org/community/uad/wiki/Cameleon_Reference_Framework)
- [Model-Based UI XG Final Report (W3C)](https://www.w3.org/2007/uwa/editors-drafts/mbui/latest/Model-Based-UI-XG-FinalReport.html)

### Hierarchic complexity

- Simon, H. A. — *The Architecture of Complexity* (1962); *The Sciences of the Artificial* (1969). Local skill summary: `~/.claude/skills/book-summary/simon-architecture-of-complexity.md`

### Axiomatic design

- Suh, N. P. — *The Principles of Design* (1990); *Axiomatic Design: Advances and Applications* (2001). Reference only; not a live citation from this session.
