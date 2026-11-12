# dive.nevcan.com

Personal diving platform of Nevcan Uludaş: GUE education, exploration, conservation, community and booking.
Part of the `nevcan.com_v2027` ecosystem.

## Stack

- [Astro 7](https://astro.build) (static output, islands) + TypeScript
- React Three Fiber / three.js for the homepage depth journey (loaded only on capable devices)
- GSAP ScrollTrigger for scroll-driven depth
- Hosting: GitHub Pages (GitHub Actions, `.github/workflows/deploy.yml`)

## Development

Requires Node ≥ 22.23.4 (see `.nvmrc`).

```sh
nvm use
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + static build to dist/
npm run preview
npm run format
```

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
  reduced motion is requested, on low-memory devices, with Save-Data, without WebGL2, or with `?lite`.
- Models live in `public/models/` (see `CREDITS.md`). Their placement and anchor depths are in
  `scene/Models.tsx`.
- Content collections (`exploration`, `conservation`, `courses`) are defined in
  `src/content.config.ts`. They are empty until real, verified content is added.
