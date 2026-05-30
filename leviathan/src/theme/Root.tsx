import React from 'react';
import { createTheme, ThemeProvider, useColorScheme } from '@mui/material/styles';

/**
 * MUI theme for the Leviathan site.
 *
 * `cssVariables.colorSchemeSelector: '[data-theme="%s"]'` makes MUI emit its
 * palette as CSS variables scoped to `[data-theme="light"]` / `[data-theme="dark"]`
 * — exactly the attribute Docusaurus already sets on <html>. The right palette
 * therefore applies from pure CSS, before hydration, with no flash.
 *
 * `typography.fontFamily: 'inherit'` keeps MUI components on Docusaurus's font
 * stack instead of pulling in Roboto.
 */
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: '[data-theme="%s"]',
  },
  colorSchemes: {
    light: { palette: { primary: { main: '#10b981' } } },
    dark: { palette: { primary: { main: '#34d399' } } },
  },
  typography: { fontFamily: 'inherit' },
});

/**
 * Detached node that absorbs MUI's color-scheme DOM writes so Docusaurus stays
 * the sole owner of the `data-theme` attribute on <html>. Undefined on the
 * server (no document), a real detached <div> in the browser.
 */
const colorSchemeNode =
  typeof document !== 'undefined' ? document.createElement('div') : undefined;

/**
 * Mirrors Docusaurus's `data-theme` attribute into MUI's JS color-scheme state
 * so `theme.palette.mode` and `useColorScheme()` stay correct for any component
 * that reads them at runtime. Visual styling is already handled by the CSS
 * selectors above; this only keeps the JS side in sync.
 */
function DocusaurusColorModeSync(): null {
  const { setMode } = useColorScheme();

  React.useEffect(() => {
    const html = document.documentElement;
    const sync = () => {
      const mode = html.getAttribute('data-theme');
      if (mode === 'dark' || mode === 'light') {
        setMode(mode);
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [setMode]);

  return null;
}

export default function Root({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ThemeProvider theme={theme} defaultMode="system" colorSchemeNode={colorSchemeNode}>
      <DocusaurusColorModeSync />
      {children}
    </ThemeProvider>
  );
}
