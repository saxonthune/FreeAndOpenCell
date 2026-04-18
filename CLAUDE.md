# CLAUDE.md

## Documentation

Always read `.carta/MANIFEST.md` first when starting work in this repo. It is the index for the `.carta/` documentation workspace — use it to identify relevant docs by summary and tags, then open only what the task needs. See `.carta/00-codex/04-ai-retrieval.md` for the retrieval pattern.

**Docs-before-code (aspiration).** The goal is that formalized sources of truth — design specs under `.carta/02-design/`, state-machine sidecar JSONs (e.g. `02-game.json`, `03-ui-drag.json`), and structured rule data (invariant registries, action contracts, selection tables) — move ahead of code for any behavior change, so that AI context and tests can both be generated from the same data rather than derived from reading the implementation. For now this is a direction, not a gate: when making a behavior change, check which specs and sidecars model the affected contract and update them alongside (ideally before) the code. If a sidecar JSON is unaffected, say so explicitly rather than skipping it silently. Over time the ambition is to formalize rule classes (invariants, action pre/postconditions, priority tables) as data that is both AI-readable and property-test-generatable, reducing the maintenance burden of hand-written tests — but only where a shared predicate vocabulary makes that genuinely lighter than code.

## Skills — local reference material under `.claude/skills/`

Headless agents (`claude -p`) do not have the Skill tool and will not see these via system reminders. Read the files directly when the work matches.

- **`.claude/skills/solidjs/`** — Solid.js reference. Read `03-patterns-antipatterns.md` before writing or reviewing any Solid component (destructured props, early-return-null, `<For>` vs `<Index>`, `on:click` stopPropagation, etc.). Read `01-mental-model.md` if you're unsure about tracking contexts or the setup-runs-once lifecycle.
- **`.claude/skills/carta-cli/`** — the `carta` CLI reference for structural `.carta/` workspace operations (move/rename/delete docs, regenerate MANIFEST). Content edits are Write/Edit as usual; structural changes go through `carta`.
- **`.claude/skills/docs-development/`** — guidance for drafting sparse, unfolding documentation. Use when the user asks for help writing or structuring new docs.
- **`.claude/skills/todo-task/`** — the task lifecycle harness (triage → execute via worktree agents). Already invoked via `/todo-task`; the scripts live in this directory.

## Methodology fingerprints

These shape every spec in `.carta/02-design/` — read doc02.00 for the full statement.

- **Artifact-driven development (ADD).** Every spec answers "what is needed to implement this feature?" with a list of artifacts and contracts. Do not simulate domain entities (no "a Game has a Deck and Players who take Turns"). See doc02.01.
- **Inventory-derived component tree.** doc02.05 is not a hand-designed tree — it is the output of six inventories (state shape, action catalog, mutation rates, read sets, affordances, orthogonal regions). When the tree changes, the inventories must change first. The research basis is doc03.02 (Parnas, DSM, Cameleon, Suh, Simon).
- **Artifact sequence.** Each design doc is constrained by the ones before it (vision → architecture → state pair → reactivity → component tree). If you're guessing at content while writing a spec, you're missing an upstream artifact.
- **Tool-agnostic specs.** Design specs do not pick libraries, write build configs, or bake in CSS. State-machine JSON lives as carta sidecars next to its host doc (e.g. `02-game.json` beside `02-game-state.md`) — XState-shaped but no runtime bound. Toolchain decisions happen at implementation, not in design docs.

## Toolchain (locked in)

- **Package manager:** pnpm (see `packageManager` in `package.json`). Run scripts via `pnpm <script>` (e.g. `pnpm test`, `pnpm dev`) and one-off binaries via `pnpm exec <bin>` — do not use `npx` or `npm`.
- **Build/runtime:** Vite + SolidJS, TypeScript, Node ≥ 22 (`.nvmrc`).
- **Tests:** Vitest (jsdom + `@solidjs/testing-library`). Property tests will use fast-check (not yet installed).
- **Lint + format:** Biome (`pnpm lint`, `pnpm format`). No ESLint/Prettier.
- Remaining toolchain choices (state-machine runtime, deployment target, card-face assets) are tracked in the in-progress toolchain doc under `.carta/02-design/`.
