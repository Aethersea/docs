# Aethersea websites

Four Next.js sites managed as a single pnpm workspace. Documentation is powered by [Fumadocs](https://fumadocs.dev), and every directory is deployed as an independent Vercel project.

| Site | Workspace package | Vercel root directory | Production domain |
| --- | --- | --- | --- |
| Main homepage | `@aethersea/main` | `main` | `theaethersea.com` |
| Developer docs | `@aethersea/develop` | `develop` | `develop.theaethersea.com` |
| Shen docs | `@aethersea/shen-docs` | `shen` | `shen.theaethersea.com` |
| Leviathan docs | `@aethersea/leviathan-docs` | `leviathan` | `leviathan.theaethersea.com` |

The main site is the root-domain product homepage. Shen and Leviathan contain user-facing installation, configuration, and feature documentation. Contributor build guides and internal implementation notes live under `develop/content/docs`.

## Requirements

- Node.js 24
- pnpm 11.2.2 through Corepack

## Local development

Install all workspace dependencies from the repository root:

```bash
corepack enable
pnpm install
```

Run a single site:

```bash
pnpm dev:main
pnpm dev:develop
pnpm dev:shen
pnpm dev:leviathan
```

Or run all four development servers in parallel:

```bash
pnpm dev
```

Validation commands:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Content layout

```text
develop/content/docs/   Contributor and internal documentation
shen/content/docs/      Shen user documentation
leviathan/content/docs/ Leviathan user documentation
```

Each documentation site uses `meta.json` files to define its Fumadocs sidebar order and section labels. Every Markdown or MDX page requires `title` frontmatter; `description` is recommended for metadata and search results.

## Vercel deployment

Import this Git repository into Vercel four times, creating one project for each directory in the table above.

For each project:

1. Set **Root Directory** to `main`, `develop`, `shen`, or `leviathan`.
2. Keep **Framework Preset** set to Next.js.
3. Leave the install, build, and output settings at their detected defaults.
4. Keep **Include source files outside of the Root Directory in the Build Step** enabled so Vercel can use the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
5. Attach the matching production domain after the first successful deployment.

The root `package.json` pins pnpm and Node.js 24, so all four projects use the same toolchain and lockfile. Vercel can also skip unchanged workspace projects automatically when only another site changes.

### Suggested Vercel project names

| Root directory | Project name | Domain |
| --- | --- | --- |
| `main` | `aethersea-main` | `theaethersea.com` |
| `develop` | `aethersea-develop` | `develop.theaethersea.com` |
| `shen` | `aethersea-shen` | `shen.theaethersea.com` |
| `leviathan` | `aethersea-leviathan` | `leviathan.theaethersea.com` |

Vercel provisions HTTPS automatically for verified custom domains. Add `www.theaethersea.com` to the main project only if a `www` alias is wanted.
