/**
 * Local Docusaurus plugin that injects the Tailwind CSS v4 PostCSS compiler
 * into Docusaurus's PostCSS pipeline. Tailwind v4 is CSS-first, so the only
 * configuration lives in `src/css/custom.css` (imports + `@source`); this
 * plugin just registers `@tailwindcss/postcss` so those directives compile.
 */
module.exports = function tailwindPlugin(/* context, options */) {
  return {
    name: 'aethersea-tailwind-plugin',
    configurePostCss(postcssOptions) {
      postcssOptions.plugins.push(require('@tailwindcss/postcss'));
      return postcssOptions;
    },
  };
};
