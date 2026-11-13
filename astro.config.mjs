// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

/** pages still waiting for Nev's approval (`draft: true`) stay out of the sitemap */
/** @param {string} dir @param {string} route */
const draftsIn = (dir, route) => {
  const base = new URL(`./src/content/${dir}/`, import.meta.url);
  return readdirSync(base)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => /^draft:\s*true\s*$/m.test(readFileSync(new URL(f, base), 'utf8')))
    .map((f) => `/${route}/${f.replace(/\.md$/, '')}`);
};
const draftCourses = [
  ...draftsIn('courses', 'education'),
  ...draftsIn('exploration', 'exploration'),
];

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
    // preview pages, the draft booking page (sample data) and draft courses are noindex and
    // stay out of it
    sitemap({
      filter: (page) =>
        !page.includes('/preview/') &&
        !/\/booking\/?$/.test(page) &&
        !draftCourses.some((d) => new URL(page).pathname.replace(/\/$/, '') === d) &&
        // instructor training pages (src/data/education.ts) are drafts until Nev approves them;
        // drop this line then
        !page.includes('/education/itc/'),
    }),
  ],
});
