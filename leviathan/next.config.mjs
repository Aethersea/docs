import { createMDX } from 'fumadocs-mdx/next';
import { fileURLToPath } from 'node:url';

const withMDX = createMDX();
const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
  async redirects() {
    return [
      {
        source: '/docs/development',
        destination: 'https://develop.theaethersea.com/docs/leviathan',
        permanent: true,
      },
      {
        source: '/docs/architecture-internal',
        destination: 'https://develop.theaethersea.com/docs/leviathan/architecture-internal',
        permanent: true,
      },
      {
        source: '/docs/clipboard',
        destination: 'https://develop.theaethersea.com/docs/leviathan/clipboard',
        permanent: true,
      },
      {
        source: '/docs/crash-dumps',
        destination: 'https://develop.theaethersea.com/docs/leviathan/crash-dumps',
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
