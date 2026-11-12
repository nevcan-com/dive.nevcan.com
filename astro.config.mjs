// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://dive.nevcan.com',
  output: 'static',
  trailingSlash: 'never',
  // 'file': about.html, served by GitHub Pages at /about (a folder would redirect to /about/)
  build: { inlineStylesheets: 'always', format: 'file' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    // The WebGL scene is mounted manually (dynamic import), not as an Astro island, so the
    // React Fast Refresh preamble is never injected. Keep those files out of the refresh
    // transform; esbuild compiles their JSX (tsconfig: react-jsx).
    react({ exclude: ['**/src/components/journey/scene/**'] }),
    // preview pages and the draft booking page (sample data) are noindex and stay out of it
    sitemap({ filter: (page) => !page.includes('/preview/') && !/\/booking\/?$/.test(page) }),
  ],
});
