import '@mui/material/styles';

/**
 * Opt in to MUI's CSS-theme-variables TypeScript support. This unlocks the
 * `cssVariables` / `colorSchemes` options on `createTheme` and the
 * `colorSchemeNode` prop on `ThemeProvider` (used in `src/theme/Root.tsx` to
 * keep Docusaurus the sole owner of the `data-theme` attribute).
 * https://mui.com/material-ui/customization/css-theme-variables/usage/#typescript
 */
declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true;
  }
}
