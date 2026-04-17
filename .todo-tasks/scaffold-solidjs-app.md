# Scaffold SolidJS App Infrastructure

## Motivation

The repo has docs (`.carta/`) and a license but no application code yet. A parallel design session (doc02.01–02.05) is converging on a pure-TS game engine plus SolidJS stores/memos — the infrastructural pieces it will sit on are out of scope for that session and are the subject of this one. Stand up the scaffold now so implementation can start immediately when requirements land.

## Do NOT

- Do NOT write any FreeCell game logic, rules, or typed shapes for `GameState`, `UIState`, `legalActions`, `applyAction`, etc. Those are owned by the parallel design session.
- Do NOT add a state-machine library (XState, Zag, etc.). doc02.01 explicitly defers that choice.
- Do NOT create placeholder components named from doc02.04 (`GameBoard`, `FreecellSlot`, `CascadeColumn`, ...). The only component is `App`, rendering a single placeholder header.
- Do NOT add routing, state management libraries, CSS frameworks (Tailwind, UnoCSS), or UI kits. SolidJS + vanilla CSS only.
- Do NOT pick a card-artwork asset set or commit any card SVGs — that's its own task.
- Do NOT touch `.carta/` docs, `.carta.json`, or `MANIFEST.md`. The parallel session owns docs.
- Do NOT use `npm` or `yarn` in scripts, CI, or README. `pnpm` only.
- Do NOT add Prettier or ESLint — Biome handles both.
- Do NOT commit a `node_modules/` directory. `pnpm-lock.yaml` IS committed.

## Plan

### 1. Initialize the Vite + SolidJS TypeScript project at repo root

Use the SolidJS `ts` starter (non-SSR). Run from repo root:

```bash
pnpm create vite@latest . --template solid-ts
```

If the interactive prompt complains about the non-empty directory, answer "Ignore files and continue". The resulting files coexist with `LICENSE`, `README.md`, `CLAUDE.md`, `.carta/`, `.claude/`, `.todo-tasks/`, `.gitignore`.

After scaffold, `pnpm install` (will regenerate `pnpm-lock.yaml`).

### 2. Pin Node + pnpm

- Write `.nvmrc` containing `22` (current LTS).
- In `package.json`, set:
  - `"name": "free-and-open-cell"`
  - `"packageManager": "pnpm@9.12.0"` (or whatever is current on the dev machine — query with `pnpm --version`)
  - `"engines": { "node": ">=22" }`
  - `"license": "AGPL-3.0-or-later"`
  - `"private": true`
  - Keep `"type": "module"`.

### 3. Configure Vite base path for GitHub Pages

Edit `vite.config.ts` so `base` is `/FreeAndOpenCell/` (GitHub project page path). Example:

```ts
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  base: '/FreeAndOpenCell/',
  plugins: [solid()],
});
```

### 4. Replace the starter app with a minimal placeholder

- `src/App.tsx` renders exactly one `<h1>FreeAndOpenCell</h1>` and nothing else. Drop the Vite + Solid demo counter, logo imports, and `App.module.css` starter styles.
- Delete `src/assets/` and any demo image imports.
- `src/index.css` may contain minimal resets (`body { font-family: system-ui; margin: 0; }`) — keep it under 10 lines.
- `index.html` `<title>` = `FreeAndOpenCell`.

### 5. Add Vitest + Solid testing-library

Install dev deps:

```bash
pnpm add -D vitest @solidjs/testing-library @testing-library/jest-dom jsdom vite-plugin-solid
```

Update `vite.config.ts` to include a `test` block using `jsdom` and `globals: true`. Add a `vitest.setup.ts` that imports `@testing-library/jest-dom/vitest`.

Add `src/App.test.tsx` — one smoke test that renders `<App />` and asserts the `FreeAndOpenCell` heading is in the document. Use `@solidjs/testing-library` `render`.

Add npm scripts:
- `"dev": "vite"`
- `"build": "tsc --noEmit && vite build"`
- `"preview": "vite preview"`
- `"test": "vitest run"`
- `"test:watch": "vitest"`
- `"typecheck": "tsc --noEmit"`
- `"lint": "biome check ."`
- `"format": "biome format --write ."`

### 6. Install and configure Biome

```bash
pnpm add -D --save-exact @biomejs/biome
pnpm biome init
```

Edit `biome.json`:
- Enable formatter and linter.
- Set `javascript.formatter.quoteStyle` to `"single"`, `indentStyle` to `"space"`, `indentWidth` 2.
- Add `"organizeImports": { "enabled": true }`.
- Ignore `dist/`, `node_modules/`, `.todo-tasks/`, `.carta/`, `coverage/`.

Run `pnpm biome check --write .` once to format the scaffold.

### 7. GitHub Actions CI + Pages deploy

Create `.github/workflows/ci.yml` — runs on push to any branch and on PR:

- `actions/checkout@v4`
- `pnpm/action-setup@v4` (reads `packageManager` from `package.json`)
- `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: pnpm`
- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Create `.github/workflows/deploy.yml` — runs on push to `main` only:

- Same setup steps through `pnpm build`
- `actions/upload-pages-artifact@v3` with path `./dist`
- `actions/deploy-pages@v4` in a deploy job with `permissions: { pages: write, id-token: write }` and `environment: github-pages`

### 8. Update `.gitignore`

Append (most is already there, but ensure):

```
dist/
.vite/
coverage/
```

### 9. Update `README.md`

Replace current contents with:

- One-line project description (keep existing).
- AGPL-3.0-or-later badge/line.
- `## Development` section with: prerequisites (Node 22, pnpm), `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm build`.
- `## Docs` section pointing to `.carta/MANIFEST.md`.

### 10. Final verification pass

Run all verification commands below. All must pass cleanly before reporting done.

## Files to Modify

- `package.json` — created by Vite, then edited for name/license/engines/packageManager/scripts
- `pnpm-lock.yaml` — created by `pnpm install`
- `.nvmrc` — new, contents `22`
- `vite.config.ts` — created by Vite, edited for `base` + `test` block
- `vitest.setup.ts` — new
- `tsconfig.json` — created by Vite, keep as-is unless build fails
- `index.html` — created by Vite, edit `<title>`
- `src/index.tsx` — created by Vite, keep
- `src/App.tsx` — created by Vite, replaced with placeholder
- `src/index.css` — replaced with minimal resets
- `src/App.test.tsx` — new, one smoke test
- `src/App.module.css` — delete (starter)
- `src/assets/` — delete directory
- `biome.json` — created by `biome init`, edited
- `.github/workflows/ci.yml` — new
- `.github/workflows/deploy.yml` — new
- `.gitignore` — append `dist/`, `.vite/`, `coverage/`
- `README.md` — rewritten

## Verification

```bash
set -e
cd /home/saxon/code/github/saxonthune/FreeAndOpenCell
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
test -f dist/index.html
```

Additionally, confirm the AGPL license metadata and Pages base path:

```bash
grep -q '"license": "AGPL-3.0-or-later"' package.json
grep -q "base: '/FreeAndOpenCell/'" vite.config.ts
```

## Out of Scope

- Any FreeCell game logic, types, reducers, or state machines (doc02.02, doc02.03)
- Component scaffolding beyond `App` (doc02.04 owns the tree)
- Card artwork, assets, sprites
- Accessibility audit, theming, responsive CSS beyond resets
- localStorage persistence, undo/redo, animations
- E2E tests (Playwright) — unit tests only for now
- Enabling GitHub Pages in repo settings (user does this once via GitHub UI)

## Notes

- The GitHub Pages deploy workflow will fail its first run until the user enables Pages in repo Settings → Pages → Source = "GitHub Actions". Call this out in the result doc.
- If `pnpm create vite@latest . --template solid-ts` produces a `src/App.module.css` or demo logo asset, delete them — the placeholder `App.tsx` imports neither.
- `vite-plugin-solid` is added by the starter; re-listing it in the Vitest install step is defensive (pnpm will no-op if already present).
- Parallel branch `feat/260417` may be adding `.carta/02-design/*.md` concurrently. The execute-plan harness runs on its own worktree/branch, so merge conflicts should be limited to `.gitignore` or `README.md` at worst. Architecturally, nothing in this task touches `.carta/` or the game engine.
- The `base: '/FreeAndOpenCell/'` assumes the repo name matches the GitHub project page URL. If the repo gets renamed, update `vite.config.ts` and the Pages URL.
