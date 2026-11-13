#!/usr/bin/env python3
"""Subset the site's three fonts to one small woff2 per face (Latin + Turkish).

Fontsource splits each font into unicode-range slices (latin, latin-ext, cyrillic, ...).
Every page has Turkish letters (Nevcan Uludaş), so browsers downloaded both the latin and
latin-ext slice of every font: ~210 KB at high priority on first paint. This script cuts
one file per face with only the characters the site can use, and pins Inter's optical-size
axis to 14 (what Fontsource's 'wght' build did), so rendering stays the same.

Re-run when new text brings characters outside the set (it scans src/ and adds them):

    python3 -m venv .venv-fonts && .venv-fonts/bin/pip install fonttools brotli
    .venv-fonts/bin/python scripts/subset-fonts.py

Sources: google/fonts at a pinned commit (the same builds Fontsource ships), cached in
source-media/fonts/ (git-ignored). Output: src/assets/fonts/*.woff2 (committed).
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'source-media' / 'fonts'
OUT = ROOT / 'src' / 'assets' / 'fonts'

GOOGLE_FONTS = 'https://raw.githubusercontent.com/google/fonts/3e5667764ccfea32ce0c3d58a3a4756de890adc1/ofl'

# (output name, source path in google/fonts, axis limits)
FACES = [
    ('inter-var', 'inter/Inter[opsz,wght].ttf', {'opsz': 14, 'wght': (400, 700)}),
    ('jetbrains-mono-var', 'jetbrainsmono/JetBrainsMono[wght].ttf', {'wght': (400, 700)}),
    ('instrument-serif-400', 'instrumentserif/InstrumentSerif-Regular.ttf', None),
    ('instrument-serif-400-italic', 'instrumentserif/InstrumentSerif-Italic.ttf', None),
]

# Latin + Latin-1 + Turkish, typographic punctuation, arrows, a few signs. Room for the
# Turkish translation (#3) without re-running.
BASE_RANGES = [
    (0x0020, 0x007E),  # Basic Latin
    (0x00A0, 0x00FF),  # Latin-1 Supplement (Ç Ö Ü ç ö ü é © · × ...)
    (0x011E, 0x011F),  # Ğ ğ
    (0x0130, 0x0131),  # İ ı
    (0x015E, 0x015F),  # Ş ş
    (0x2010, 0x2027),  # dashes, quotes, bullet, ellipsis
    (0x2030, 0x2030),  # ‰
    (0x2032, 0x2033),  # ′ ″
    (0x2039, 0x203A),  # ‹ ›
    (0x20AC, 0x20AC),  # €
    (0x20BA, 0x20BA),  # ₺
    (0x2122, 0x2122),  # ™
    (0x2190, 0x2193),  # ← ↑ → ↓
    (0x2212, 0x2212),  # −
]

# OpenType features to keep: pyftsubset's defaults (kern, liga, calt, ccmp, locl, mark,
# frac/numr/dnom, ...) plus the numeral styles the CSS asks for (tabular-nums).
EXTRA_FEATURES = ['tnum', 'pnum']

TEXT_SUFFIXES = {'.astro', '.ts', '.tsx', '.md', '.mdx', '.css', '.json'}


def site_codepoints() -> set[int]:
    """Every non-ASCII character in src/, so new text is covered when the script is re-run."""
    found: set[int] = set()
    for path in (ROOT / 'src').rglob('*'):
        if path.suffix in TEXT_SUFFIXES and path.is_file():
            found.update(ord(ch) for ch in path.read_text(encoding='utf-8') if ord(ch) > 0x7E)
    return found


def source(rel: str) -> Path:
    path = CACHE / Path(rel).name
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        url = f"{GOOGLE_FONTS}/{rel.replace('[', '%5B').replace(']', '%5D')}"
        print(f'download {url}')
        # curl, not urllib: python.org builds on macOS ship without CA certificates
        subprocess.run(['curl', '-sfL', '-o', str(path), url], check=True)
    return path


def main() -> int:
    base = {cp for lo, hi in BASE_RANGES for cp in range(lo, hi + 1)}
    extra = site_codepoints() - base
    unicodes = base | extra
    OUT.mkdir(parents=True, exist_ok=True)

    for name, rel, limits in FACES:
        font = TTFont(source(rel))

        cmap = font.getBestCmap()
        missing = sorted(cp for cp in extra if cp not in cmap)
        # missing glyphs (emoji, ★) fall back to system fonts, as before
        if missing:
            print(f'  {name}: not in font, falls back: ' + ' '.join(chr(cp) for cp in missing))

        options = subset.Options()
        options.layout_features += EXTRA_FEATURES
        options.name_IDs = [0, 1, 2, 3, 4, 5, 6]  # copyright, names, version, PostScript name
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=unicodes)
        subsetter.subset(font)
        # limit the axes after subsetting (the other order trips over fontTools' lazy loading)
        if limits:
            font = instancer.instantiateVariableFont(font, limits)

        out = OUT / f'{name}.woff2'
        font.flavor = 'woff2'
        font.save(out)
        print(f'{out.relative_to(ROOT)}  {out.stat().st_size / 1024:.1f} KB')

    return 0


if __name__ == '__main__':
    sys.exit(main())
