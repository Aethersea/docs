# Aethersea Documentation

Three independent Docusaurus sites, each deployed as its own Cloudflare Pages project.

| Site | Directory | Domain |
|------|-----------|--------|
| Main | `docs/main` | `theaethersea.com` |
| Shen | `docs/shen` | `shen.theaethersea.com` |
| Leviathan | `docs/leviathan` | `leviathan.theaethersea.com` |

All three are pinned to **Docusaurus 3.9.2** with a **`webpackbar` 7.0.0** override (the default webpackbar 6.x shipped with Docusaurus 3.9 / 3.10 trips webpack's stricter ProgressPlugin schema validation — the override is what lets production builds succeed).

## UI Stack: TailwindCSS + MUI

Each site layers **TailwindCSS v4** and **MUI v9 (Material UI)** on top of the Docusaurus classic theme. The wiring is identical across `main`, `shen`, and `leviathan`:

- **Tailwind** — a local plugin at `src/plugins/tailwind.js` registers `@tailwindcss/postcss` in Docusaurus's PostCSS pipeline (`plugins: ['./src/plugins/tailwind.js']` in `docusaurus.config.ts`). `src/css/custom.css` imports **only** Tailwind's `theme.css` + `utilities.css` — **preflight (the global reset) is deliberately omitted** so Tailwind does not clobber Docusaurus's Infima base styles or MUI's component baseline. Tailwind is used purely as utility classes. `@source` directives scope class detection to `src/` (plus `docs/`/`blog/` MDX). Because preflight is off, border utilities need an explicit style/color (e.g. `border border-solid border-gray-300`).
- **MUI** — `src/theme/Root.tsx` swizzles the Docusaurus `Root` to wrap the app in a MUI `ThemeProvider`. The theme uses MUI's **CSS theme variables** with `colorSchemeSelector: '[data-theme="%s"]'`, which matches the `data-theme` attribute Docusaurus already sets on `<html>` — so MUI's palette follows light/dark from pure CSS, with no flash and no manual syncing of visuals. A detached `colorSchemeNode` keeps Docusaurus the **sole owner** of `data-theme` (MUI never writes to `<html>`), and a `MutationObserver` mirrors the attribute into MUI's JS color-scheme state. `src/mui.d.ts` augments `CssThemeVariables.enabled = true` to unlock the CSS-variables typings.
- **Per-site brand color** — each site's primary color (main = indigo, shen = sky, leviathan = emerald) is defined once in `src/css/custom.css` (Infima `--ifm-color-primary*`, used by the static `.heroGradient`) and mirrored in the MUI theme's `colorSchemes` in `src/theme/Root.tsx`.

After changing dependencies, delete `node_modules` + `package-lock.json` and reinstall. Run `npm run typecheck` to validate the MUI/TS wiring and `npm run build` to confirm the production build.

## Local Development

```bash
# From any site directory:
npm install
npm start    # dev server on http://localhost:3000
npm run build
npm run serve  # preview the production build
```

If you see a `Progress Plugin has been initialized using an options object that does not match the API schema` error during build, your `node_modules` was installed before the webpackbar override was added. Delete `node_modules` and `package-lock.json` and reinstall.

## Cloudflare Pages Deployment

Each site is its own Cloudflare Pages project pointing at the same Git repository with a different **root directory**. Create one project per site.

### 1. Main site (`theaethersea.com`)

| Setting | Value |
|---------|-------|
| Project name | `aethersea-main` |
| Production branch | `main` |
| Root directory | `docs/main` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Environment variable | `NODE_VERSION=20` |

After the first deploy, go to **Custom domains** and add both `theaethersea.com` and `www.theaethersea.com`.

### 2. Shen docs (`shen.theaethersea.com`)

| Setting | Value |
|---------|-------|
| Project name | `aethersea-shen` |
| Production branch | `main` |
| Root directory | `docs/shen` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Environment variable | `NODE_VERSION=20` |

Add `shen.theaethersea.com` under **Custom domains**.

### 3. Leviathan docs (`leviathan.theaethersea.com`)

| Setting | Value |
|---------|-------|
| Project name | `aethersea-leviathan` |
| Production branch | `main` |
| Root directory | `docs/leviathan` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Environment variable | `NODE_VERSION=20` |

Add `leviathan.theaethersea.com` under **Custom domains**.

### DNS

The apex domain is already on Cloudflare, so custom domains added in each Pages project create the necessary CNAME records automatically. No manual DNS entry is needed.

### Node version

All three projects require **Node 20**. Node 24 is known to break the build on some webpack / webpackbar combinations; pin `NODE_VERSION=20` in Pages environment variables and ensure the root `.nvmrc` / `engines` field in each `package.json` (`node: ">=18.0"`) is satisfied by the build runner.

## Checking a Build Before Pushing

```bash
cd docs/main       # or docs/shen, docs/leviathan
npm install
npm run build
ls build/          # static output — this is what Pages deploys
```

A successful build ends with `[SUCCESS] Generated static files in "build".` and no `[WARNING]` lines (other than incidental Node / library deprecation notices outside our control).
