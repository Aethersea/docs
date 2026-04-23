# Aethersea Documentation

Three independent Docusaurus sites, each deployed as its own Cloudflare Pages project.

| Site | Directory | Domain |
|------|-----------|--------|
| Main | `docs/main` | `theaethersea.com` |
| Shen | `docs/shen` | `shen.theaethersea.com` |
| Leviathan | `docs/leviathan` | `leviathan.theaethersea.com` |

All three are pinned to **Docusaurus 3.9.2** with a **`webpackbar` 7.0.0** override (the default webpackbar 6.x shipped with Docusaurus 3.9 / 3.10 trips webpack's stricter ProgressPlugin schema validation — the override is what lets production builds succeed).

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
