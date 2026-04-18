# .carta/ Manifest

Machine-readable index for AI navigation. Read this file first, then open only the docs relevant to your query.

**Retrieval strategy:** See doc00.04 for AI retrieval patterns.

## Column Definitions

- **Ref**: Cross-reference ID (`docXX.YY.ZZ`)
- **File**: Path relative to title directory
- **Summary**: One-line description for semantic matching
- **Tags**: Keywords for file-path→doc mapping
- **Deps**: Doc refs to check when this doc changes
- **Refs**: Reverse deps — docs that list this one in their Deps (computed automatically)
- **Attachments**: Non-md files sharing the doc's numeric prefix. Sidecar artifacts that travel with the doc during structural operations. Purely filesystem-derived; not a frontmatter field.

Orphaned attachments (non-md files with no corresponding root .md) are reported as warnings on stderr during regeneration and do not appear in this table.

## 00-codex — Codex

| Ref | File | Summary | Tags | Deps | Refs | Attachments |
|-----|------|---------|------|------|------|-------------|

| doc00.00 | `00-index.md` | Meta-documentation — how to read this workspace | index, meta | — | — | — |
| doc00.01 | `01-about.md` | Why this workspace exists, how to read it, two-sources-of-truth theory | docs, meta, theory | — | — | — |
| doc00.02 | `02-maintenance.md` | Doc lifecycle — unfolding philosophy, development loop, versioning, epochs | docs, maintenance, philosophy | — | — | — |
| doc00.03 | `03-conventions.md` | Cross-reference syntax, frontmatter schema, file naming, writing style | docs, conventions | — | — | — |
| doc00.04 | `04-ai-retrieval.md` | How AI agents navigate this workspace — hierarchical retrieval, MANIFEST usage, token budgets | docs, ai, retrieval | — | — | — |

## 02-design — Design

| Ref | File | Summary | Tags | Deps | Refs | Attachments |
|-----|------|---------|------|------|------|-------------|

| doc02.00 | `00-index.md` | Specs that answer "what is needed to implement this feature?" — composable artifacts, not simulations | design, index | — | — | — |
| doc02.01 | `01-architecture.md` | Artifact-driven framing; what artifacts compose the FreeCell product | architecture, add | — | doc02.02, doc02.03, doc02.08, doc03.01 | — |
| doc02.02 | `02-game-state.md` | GameState shape, invariants, legal-action types | game, state, schema | doc02.01 | doc02.03, doc02.04, doc02.05, doc02.07 | game.json |
| doc02.03 | `03-ui-state.md` | Transient interaction state (drag, snap, hover) and its boundary with game state | ui, state, schema | doc02.01, doc02.02 | doc02.04, doc02.05, doc02.07, doc03.01 | ui-drag.json |
| doc02.04 | `04-reactivity.md` | Stores, derived signals, and re-render granularity | ui, reactivity | doc02.02, doc02.03 | doc02.05, doc02.07 | — |
| doc02.05 | `05-component-tree.md` | SolidJS component tree derived from six partition inventories — state shape, action catalog, mutation rates, read sets, affordances, orthogonal regions. | ui, components, inventory | doc02.02, doc02.03, doc02.04, doc03.02 | doc02.06, doc03.02 | — |
| doc02.06 | `06-layout.md` | AUI-level layout sketch — relative proportions for top bar, freecell/foundation row, cascades; no pixels, no CSS. | ui, layout, aui | doc02.05 | doc02.09, doc02.10 | — |
| doc02.07 | `07-testing-plan.md` | Property-based test plan — engine invariants, history laws, UI-machine liveness. Acceptance bar for "engine is done." | testing, properties, fast-check | doc02.02, doc02.03, doc02.04, doc03.01 | doc02.08 | — |
| doc02.08 | `08-toolchain.md` | Implementation-bridge spec — locked-in libraries and runtime choices that move the design specs into code | toolchain, implementation, decisions | doc02.01, doc02.07 | — | — |
| doc02.09 | `09-design-tokens.md` | W3C DTCG-format token set — the concrete value layer (colors, card geometry, topbar height, cascade tuning) that doc02.06 leaves abstract. Sidecar JSON is authoritative. | ui, tokens, design-tokens, values | doc02.06 | doc02.10 | json |
| doc02.10 | `10-layout-constraints.md` | Named inequalities the rendered layout must satisfy — the enforcement layer beneath doc02.06's AUI diagram and doc02.09's token values. | ui, layout, constraints, invariants | doc02.06, doc02.09 | — | — |

## 03-research-sessions — Research sessions

| Ref | File | Summary | Tags | Deps | Refs | Attachments |
|-----|------|---------|------|------|------|-------------|

| doc03.00 | `00-index.md` | Log of research sessions exploring open questions surfaced by design — prior art, libraries, methodology | research, index | — | — | — |
| doc03.01 | `01-ui-modeling-prior-art.md` | Does our spec-driven UI approach have a name and prior work? Surveys libraries and academic tradition. | research, ui, state-machines, property-testing, formal-methods | doc01, doc02.01, doc02.03 | doc02.07, doc03.02 | — |
| doc03.02 | `02-component-partition-prior-art.md` | What artifacts make a good component partition fall out? Parnas, DSM, Cameleon, Suh, Simon. | research, ui, components, partition, modularity | doc02.05, doc03.01 | doc02.05 | — |

## Tag Index

Quick lookup for file-path→doc mapping:

| Tag | Relevant Docs |
|-----|---------------|
| `add` | doc02.01 |
| `ai` | doc00.04 |
| `architecture` | doc02.01 |
| `aui` | doc02.06 |
| `components` | doc02.05, doc03.02 |
| `constraints` | doc02.10 |
| `conventions` | doc00.03 |
| `decisions` | doc02.08 |
| `design` | doc02.00 |
| `design-tokens` | doc02.09 |
| `docs` | doc00.01, doc00.02, doc00.03, doc00.04 |
| `fast-check` | doc02.07 |
| `formal-methods` | doc03.01 |
| `game` | doc02.02 |
| `implementation` | doc02.08 |
| `index` | doc00.00, doc02.00, doc03.00 |
| `invariants` | doc02.10 |
| `inventory` | doc02.05 |
| `layout` | doc02.06, doc02.10 |
| `maintenance` | doc00.02 |
| `meta` | doc00.00, doc00.01 |
| `modularity` | doc03.02 |
| `partition` | doc03.02 |
| `philosophy` | doc00.02 |
| `properties` | doc02.07 |
| `property-testing` | doc03.01 |
| `reactivity` | doc02.04 |
| `research` | doc03.00, doc03.01, doc03.02 |
| `retrieval` | doc00.04 |
| `schema` | doc02.02, doc02.03 |
| `state` | doc02.02, doc02.03 |
| `state-machines` | doc03.01 |
| `testing` | doc02.07 |
| `theory` | doc00.01 |
| `tokens` | doc02.09 |
| `toolchain` | doc02.08 |
| `ui` | doc02.03, doc02.04, doc02.05, doc02.06, doc02.09, doc02.10, doc03.01, doc03.02 |
| `values` | doc02.09 |
