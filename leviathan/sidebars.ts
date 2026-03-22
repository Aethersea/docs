import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  leviathanSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'getting-started'],
    },
    {
      type: 'category',
      label: 'Configuration',
      items: ['configuration', 'capture', 'encoding'],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: ['pairing', 'networking', 'security'],
    },
    {
      type: 'category',
      label: 'Development',
      items: ['development', 'architecture-internal'],
    },
  ],
};

export default sidebars;
