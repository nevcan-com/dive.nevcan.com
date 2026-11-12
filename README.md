# dive.nevcan.com

Personal diving site of Nevcan Uludaş: GUE education, exploration, conservation, community and
booking. Live at **[dive.nevcan.com](https://dive.nevcan.com)**. One of the nevcan.com sites (dive, dev, film, shop).

## Stack

- [Astro 7](https://astro.build) (static output, islands) + TypeScript
- React Three Fiber / three.js for the homepage depth journey (loaded only on capable devices)
- GSAP ScrollTrigger for scroll-driven depth
- Fonts self-hosted via Fontsource; no third-party requests before consent
- Hosting: GitHub Pages, deployed by GitHub Actions

## Development

Node 24 (`.nvmrc`; `package.json` accepts ≥ 22.23.4).

```sh
nvm use
npm install
npm run dev           # http://localhost:4321
npm run build         # astro check + static build to dist/
npm run preview
npm run format        # Prettier
npm run format:check
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm run build`, then
publishes `dist/` to GitHub Pages. The Pages source must stay **GitHub Actions** (a branch
source would run Jekyll on the Astro sources and fail). The custom domain `dive.nevcan.com` is
set in the repository's Pages settings; DNS: `dive` CNAME → `nevcan-com.github.io`.

Pages are built as files (`build.format: 'file'`, e.g. `about.html`), so GitHub Pages serves
`/about` without redirecting to `/about/`. `src/pages/404.astro` becomes the 404 page.

## How the homepage journey works

| Piece                                                         | File                                          |
| ------------------------------------------------------------- | --------------------------------------------- |
| Section copy and depth bands                                  | `src/data/journey.ts`                         |
| Environment keyframes (colour, light, rays, particles, torch) | `src/components/journey/depth.ts`             |
| Scroll → depth mapping                                        | `src/components/journey/tracker.ts`           |
| WebGL capability gate                                         | `src/components/journey/capability.ts`        |
| CSS-only fallback atmosphere                                  | `src/components/journey/StaticFallback.astro` |
| WebGL scene (backdrop shader, particles, models, lights)      | `src/components/journey/scene/`               |
| Design tokens                                                 | `src/styles/tokens.css`                       |

- Every visitor first sees the CSS atmosphere. The WebGL scene loads afterwards: on idle for
  larger screens, and on the first scroll or touch for small screens. It never loads when
  reduced motion is requested, on low-memory devices, with Save-Data, without WebGL2, or with
  `?lite`.
- Models live in `public/models/` (see `CREDITS.md`); the shark and jellyfish are placed in
  `scene/Shark.tsx` and `scene/Jellyfish.tsx`.
- Content collections (`exploration`, `conservation`, `courses`) are defined in
  `src/content.config.ts`. They are empty until real, verified content is added.

## Analytics and privacy

- Google Analytics 4 runs only after the visitor accepts in the cookie banner (Consent Mode
  Basic: no Google request before that). Settings in `src/data/analytics.ts`; banner and
  dialog in `src/components/consent/`; "Cookie settings" in the footer reopens the choice.
- Cookies are `dive_ga` / `dive_ga_…` on dive.nevcan.com only, so they are never shared with
  the other nevcan.com sites, and are removed when consent is withdrawn.
- The privacy notice is `src/pages/privacy.astro`. Change it together with anything that adds
  cookies, storage, embeds, forms or third-party requests.

## Share image

`public/og-image.jpg` (1200×630) is the default Open Graph / Twitter image for every page
(`src/components/seo/SeoHead.astro`); a page can pass its own `image`.

## Work and credits

Open work is tracked in [GitHub Issues](https://github.com/nevcan-com/dive.nevcan.com/issues).
Photographs, video, models and fonts are credited in `CREDITS.md`. All rights reserved; see
`LICENSE`.
