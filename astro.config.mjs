import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://milos.guide',
  base: '/',
  // Each page's CSS is small (~5 KB gzipped), so inlining it beats the extra round trip of a
  // render-blocking <link>, which PageSpeed flagged as delaying the hero (LCP) on mobile.
  build: { inlineStylesheets: 'always' },
});
