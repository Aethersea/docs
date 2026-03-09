import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Leviathan',
  tagline: 'The Aethersea server',
  favicon: 'img/favicon.ico',

  url: 'https://leviathan.theaethersea.com',
  baseUrl: '/',

  organizationName: 'aethersea',
  projectName: 'leviathan',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/aethersea/aethersea/tree/main/docs/leviathan/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    navbar: {
      title: 'Leviathan',
      logo: {
        alt: 'Leviathan Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'leviathanSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://theaethersea.com',
          label: 'Aethersea',
          position: 'right',
        },
        {
          href: 'https://shen.theaethersea.com',
          label: 'Shen',
          position: 'right',
        },
        {
          href: 'https://github.com/aethersea/aethersea',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/intro' },
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'Configuration', to: '/docs/configuration' },
          ],
        },
        {
          title: 'Aethersea',
          items: [
            { label: 'Main Site', href: 'https://theaethersea.com' },
            { label: 'Shen (Client)', href: 'https://shen.theaethersea.com' },
            { label: 'GitHub', href: 'https://github.com/aethersea/aethersea' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aethersea. Built with Docusaurus.`,
    },
    prism: {
      theme: { plain: { color: '#393A34', backgroundColor: '#f6f8fa' }, styles: [] },
      darkTheme: { plain: { color: '#F8F8F2', backgroundColor: '#282A36' }, styles: [] },
      additionalLanguages: ['bash', 'go', 'toml', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
