import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Shen',
  tagline: 'The Aethersea desktop client',
  favicon: 'img/favicon.ico',

  url: 'https://shen.theaethersea.com',
  baseUrl: '/',

  organizationName: 'aethersea',
  projectName: 'shen',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

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
          editUrl: 'https://github.com/aethersea/aethersea/tree/main/docs/shen/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    image: 'img/social-card.png',
    navbar: {
      title: 'Shen',
      logo: {
        alt: 'Shen Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'shenSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://theaethersea.com',
          label: 'Aethersea',
          position: 'right',
        },
        {
          href: 'https://leviathan.theaethersea.com',
          label: 'Leviathan',
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
          ],
        },
        {
          title: 'Aethersea',
          items: [
            { label: 'Main Site', href: 'https://theaethersea.com' },
            { label: 'Leviathan (Server)', href: 'https://leviathan.theaethersea.com' },
            { label: 'GitHub', href: 'https://github.com/aethersea/aethersea' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aethersea. Built with Docusaurus.`,
    },
    prism: {
      theme: { plain: { color: '#393A34', backgroundColor: '#f6f8fa' }, styles: [] },
      darkTheme: { plain: { color: '#F8F8F2', backgroundColor: '#282A36' }, styles: [] },
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
