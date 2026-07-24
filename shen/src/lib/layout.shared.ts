import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
      url: '/',
    },
    links: [
      { text: 'Aethersea', url: 'https://theaethersea.com', external: true },
      { text: 'Develop', url: 'https://develop.theaethersea.com', external: true },
      { text: 'Leviathan', url: 'https://leviathan.theaethersea.com', external: true },
    ],
    githubUrl: 'https://github.com/Aethersea/docs',
  };
}
