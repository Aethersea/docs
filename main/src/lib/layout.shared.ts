import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Aethersea',
      url: '/',
    },
    links: [
      {
        text: 'Developer Docs',
        url: 'https://develop.theaethersea.com',
        external: true,
      },
      {
        text: 'Shen',
        url: 'https://shen.theaethersea.com',
        external: true,
      },
      {
        text: 'Leviathan',
        url: 'https://leviathan.theaethersea.com',
        external: true,
      },
    ],
    githubUrl: 'https://github.com/aethersea/aethersea',
    searchToggle: {
      enabled: false,
    },
  };
}
