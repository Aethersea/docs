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
        destination: 'https://develop.theaethersea.com/docs/shen',
        permanent: true,
      },
      {
        source: '/docs/fec',
        destination: 'https://develop.theaethersea.com/docs/shen/fec',
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
