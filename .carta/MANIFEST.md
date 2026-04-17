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
| doc02.01 | `01-architecture.md` | Artifact-driven framing; what artifacts compose the FreeCell product | architecture, add | — | doc02.02, doc02.03 | — |
| doc02.02 | `02-game-state.md` | GameState shape, invariants, legal-action types | game, state, schema | doc02.01 | doc02.03, doc02.04, doc02.05 | — |
| doc02.03 | `03-ui-state.md` | Transient interaction state (drag, snap, hover) and its boundary with game state | ui, state, schema | doc02.01, doc02.02 | doc02.04, doc02.05 | — |
| doc02.04 | `04-component-tree.md` | SolidJS component tree and per-component contracts | ui, components | doc02.02, doc02.03 | doc02.05 | — |
| doc02.05 | `05-reactivity.md` | Stores, derived signals, and re-render granularity | ui, reactivity | doc02.02, doc02.03, doc02.04 | — | — |

## Tag Index

Quick lookup for file-path→doc mapping:

| Tag | Relevant Docs |
|-----|---------------|
| `add` | doc02.01 |
| `ai` | doc00.04 |
| `architecture` | doc02.01 |
| `components` | doc02.04 |
| `conventions` | doc00.03 |
| `design` | doc02.00 |
| `docs` | doc00.01, doc00.02, doc00.03, doc00.04 |
| `game` | doc02.02 |
| `index` | doc00.00, doc02.00 |
| `maintenance` | doc00.02 |
| `meta` | doc00.00, doc00.01 |
| `philosophy` | doc00.02 |
| `reactivity` | doc02.05 |
| `retrieval` | doc00.04 |
| `schema` | doc02.02, doc02.03 |
| `state` | doc02.02, doc02.03 |
| `theory` | doc00.01 |
| `ui` | doc02.03, doc02.04, doc02.05 |
