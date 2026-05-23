import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Aethersea',
  tagline: 'Open-source, high-performance remote desktop',
  favicon: 'img/favicon.ico',

  url: 'https://theaethersea.com',
  baseUrl: '/',

  organizationName: 'aethersea',
  projectName: 'aethersea',

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
          editUrl: 'https://github.com/aethersea/aethersea/tree/main/docs/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/aethersea/aethersea/tree/main/docs/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
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
      title: 'Aethersea',
      logo: {
        alt: 'Aethersea Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/blog', label: 'Updates', position: 'left' },
        {
          href: 'https://shen.theaethersea.com',
          label: 'Shen',
          position: 'right',
        },
        {
          href: 'https://leviathan.theaethersea.com',
          label: 'Leviathan',
          position: 'right',
        },
        {
          href: 'https://github.com/aethersea',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Projects',
          items: [
            {
              label: 'Shen (Client)',
              href: 'https://shen.theaethersea.com',
            },
            {
              label: 'Leviathan (Server)',
              href: 'https://leviathan.theaethersea.com',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/aethersea',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Updates',
              to: '/blog',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aethersea. Built with Docusaurus.`,
    },
    prism: {
      theme: { plain: { color: '#393A34', backgroundColor: '#f6f8fa' }, styles: [] },
      darkTheme: { plain: { color: '#F8F8F2', backgroundColor: '#282A36' }, styles: [] },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
