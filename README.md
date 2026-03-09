# Aethersea Documentation

Three separate Docusaurus sites deployed to Cloudflare Pages.

| Site | Directory | Domain |
|------|-----------|--------|
| Main | `docs/main` | `theaethersea.com` |
| Shen | `docs/shen` | `shen.theaethersea.com` |
| Leviathan | `docs/leviathan` | `leviathan.theaethersea.com` |

## Local Development

```bash
# Main site
cd main && npm install && npm start

# Shen docs
cd shen && npm install && npm start

# Leviathan docs
cd leviathan && npm install && npm start
```

## Cloudflare Pages Deployment

Each site is a **separate Cloudflare Pages project** pointing to the same Git repository with different root directories.

### Create three Cloudflare Pages projects

In the Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git, repeat the following for each site:

#### 1. Main site (`theaethersea.com`)

| Setting | Value |
|---------|-------|
| Project name | `aethersea-main` |
| Root directory | `docs/main` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Node.js version (env var) | `20` |

After deployment, go to **Custom domains** and add `theaethersea.com` and `www.theaethersea.com`.

#### 2. Shen docs (`shen.theaethersea.com`)

| Setting | Value |
|---------|-------|
| Project name | `aethersea-shen` |
| Root directory | `docs/shen` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Node.js version (env var) | `20` |

After deployment, go to **Custom domains** and add `shen.theaethersea.com`.

#### 3. Leviathan docs (`leviathan.theaethersea.com`)

| Setting | Value |
|---------|-------|
| Project name | `aethersea-leviathan` |
| Root directory | `docs/leviathan` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Node.js version (env var) | `20` |

After deployment, go to **Custom domains** and add `leviathan.theaethersea.com`.

### DNS (Cloudflare)

Since the domain is already on Cloudflare, custom domains added in Pages will automatically create the necessary CNAME records. No manual DNS configuration is needed.

### Environment variable

Set `NODE_VERSION=20` in each Cloudflare Pages project's environment variables (Settings → Environment variables).
