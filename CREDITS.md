# Credits

Internal record (there is no public credits page). On the site, each clip's credit shows
vertically in the frame corner (`credit` in `src/data/journey.ts`). If a licence ever requires
public attribution (e.g. CC BY), it must be shown on the page where the asset is used.

## Footage

**Original (photos / footage of Nevcan, credited to who took them):**

- `public/media/about-cuttlefish-*`: filmed by Akın Bağcılar
- `public/media/education-dpv-*`: footage by Lütfü Tanrıöver
- `public/media/conservation-reef-*` (Conservation): filmed by Nevcan Uludaş (GoPro, 2026-05-24;
  source `source-media/conservation-reef_nev.mp4`), trimmed to 4.2–14.8 s so his fins stay out of
  frame, lightly denoised, looped with a 0.8 s dissolve
- `public/media/conservation-fish-*`: filmed by Akın Bağcılar (not on the homepage any more; kept
  for the Conservation detail page)
- `public/media/exploration-cave-*`: cave footage, filmed by Ricardo Constantino
- `public/media/research-diver*.webp`: photograph by Mahmut İğde
- `public/media/community-team*.webp`: photograph shot for and owned by Global Underwater
  Explorers (GUE); GUE approved its use on this site, along with every other GUE image here
  (2026-11-12); photographer not named (possibly Andrei Voinigescu)
- `public/media/about-reef-*.webp` (About banner, from `source-media/about-banner-reef_gue.jpg`):
  credited to Global Underwater Explorers (Nev doesn't remember the photographer, 2026-11-11).
  `public/og-image.jpg` (share image for links, 1200×630) is a crop of the same photograph.
- `public/media/nev-portrait-*.webp` (About page portrait, from
  `source-media/nev-portrait_akin-bagcilar.jpg`): photograph by Akın Bağcılar
- `public/media/surface-overunder.webp` (homepage hero): photograph by Julian Mühlenhaus,
  retouched (the second diver and the two boats removed, cropped to centre Nev, the sky made
  transparent so the drawn sky shows through)
  Photographs are shown as stills (never turned into video).
  Sources live in `source-media/` (not committed).

- `public/media/gue-cards/*.webp` (About, GueCard): Nev's GUE instructor cards (GUE's design),
  from `source-media/gue-cards/` (2023-24 to 2025-26 taken from nevcan.com_v2022). Each PNG is cut
  in half (front = the details, back = the photo), 3 px trimmed at the fold. The card photos'
  credits are printed on the cards: JP Bresser (2026-27), L. Mirault (2025-26), J. Mühlenhaus
  (2024-25, 2023-24).

No stock footage is in use. (Mixkit "Restricted" clips are personal-use only and must never be
used on this site.)

## 3D models

- `public/models/amphora.glb` (Research): Keay LII amphora, the same model used on wetnote.com
  (source file `AnforaKeayLII_alfiere1024.glb`). The object: Keay LII amphora from the Alfieri A
  wreck, National Archaeological Museum of Capo Colonna (depot), MUSAS project ref. CAPCOL-27,
  inv. 2814/M (https://www.progettomusas.eu/en/portfolio/amphora-type-keay-lii/). Who made the 3D
  model came from the MUSAS project's material (Nev, 2026-11-11). MUSAS gives no credit or licence
  for it, so the site shows none either (Nev's decision). The MUSAS site is "Copyright 2024 ICR".
  Re-compressed (meshopt, WebP texture).

- `public/models/shark.glb` (torch outro, `scene/Shark.tsx`): "Animated Swimming Great White
  Shark Loop" by LasquetiSpice,
  https://sketchfab.com/3d-models/animated-swimming-great-white-shark-loop-297ed35c6a5f43749b0ae189d991a3f1,
  CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). The optimised copy from dipnot.app
  (meshopt + WebP). Credited in the frame corner while it is on screen.

## Jellyfish

Procedural (`src/components/journey/scene/Jellyfish.tsx`). No model files.

## Fonts

Self-hosted, all under the SIL Open Font License 1.1: Instrument Serif, Inter, JetBrains Mono.
Sources: google/fonts (pinned commit in `scripts/subset-fonts.py`), subset to Latin + Turkish
(Inter's optical size pinned to 14, weights 400–700) into `src/assets/fonts/`.

## Logos

- `public/media/gue-logo-dark.svg` (Education, course pages): the Global Underwater Explorers
  logo, without motto, for dark backgrounds. Vector artwork taken unaltered from the GUE Brand
  Standards Guide v2.0 (2026), p. 9 (`GUE/hub.gue.com.tr/PDFs/official-docs/GUE-Brandbook-v2.pdf`);
  only the guide's grey backing square was removed. Trademark of GUE, used under the guide's
  instructor licence (promoting Nev's GUE courses only; never on non-GUE training or projects).
  Rules: even dark background, no shadow, clear space ≥ 1.3× its size, never altered.
- `public/media/gue-tv-logo.webp` (footer): the GUE.tv logo, from gue.tv (its og:image), linking to
  Nev's GUE.tv referral link (`https://gue.tv/?via=nev`, Rewardful; marked as an affiliate link).
