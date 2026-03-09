import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  shenSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'getting-started'],
    },
    {
      type: 'category',
      label: 'Features',
      items: ['features', 'clipboard', 'gamepad'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['configuration', 'keyboard-shortcuts'],
    },
  ],
};

export default sidebars;
