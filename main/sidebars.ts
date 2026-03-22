import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: 'About',
      items: ['intro', 'architecture'],
    },
    {
      type: 'category',
      label: 'Components',
      items: ['clipboard-helper'],
    },
  ],
};

export default sidebars;
