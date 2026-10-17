#!/usr/bin/env python3
"""
Import photos into public/photos for the Busy Biese site.

Each photo becomes:
  public/photos/<name>-800.webp    tiles, cards and thumbnails (always)
  public/photos/<name>-1400.webp   large views (only with --large)

Usage
  # One photo under a name (any file name works, HEIC included):
  python3 scripts/import_photos.py --file path/to/IMG_1234.HEIC --name cinnamon-rolls --large

  # Everything listed in scripts/photo-map.json from a folder of originals:
  python3 scripts/import_photos.py --src path/to/photos

Then add the name to a product's `photos` list or to `gallery` in src/data/menu.ts.

Requires Pillow (pip install pillow) and, for iPhone HEIC files, pillow-heif
(pip install pillow-heif).
"""
import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "photos"
MAP = ROOT / "scripts" / "photo-map.json"
QUALITY = {800: 74, 1400: 62}


def save_variants(src: Path, name: str, large: bool = False) -> None:
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
        raise SystemExit(f"Photo name '{name}' must be lowercase words joined by dashes.")
    OUT.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        for width in (800, 1400):
            if width == 1400 and not large:
                continue
            copy = im.copy()
            if copy.width > width:
                copy = copy.resize((width, round(copy.height * width / copy.width)), Image.LANCZOS)
            copy.save(OUT / f"{name}-{width}.webp", "WEBP", quality=QUALITY[width], method=6)
    print(f"  ok  {name:24} <- {src.name}")


def find(src_dir: Path, filename: str) -> Path | None:
    filename = filename.split(" ")[0]  # drop notes like "(cropped ...)"
    exact = src_dir / filename
    if exact.exists():
        return exact
    stem = Path(filename).stem.lower()
    for candidate in sorted(src_dir.rglob("*")):
        if candidate.is_file() and candidate.stem.lower() == stem:
            return candidate
    return None


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", type=Path, help="Folder with the original photos")
    ap.add_argument("--file", type=Path, help="A single photo to import")
    ap.add_argument("--name", help="Photo name to use with --file, e.g. cinnamon-rolls")
    ap.add_argument("--large", action="store_true", help="Also write the 1400px version")
    args = ap.parse_args()

    if args.file:
        if not args.name:
            raise SystemExit("--file needs --name")
        save_variants(args.file, args.name, args.large)
        return

    if not args.src or not args.src.is_dir():
        ap.print_help()
        sys.exit(1)

    mapping = {k: v for k, v in json.loads(MAP.read_text()).items() if not k.startswith("_")}
    missing = []
    for name, filename in mapping.items():
        if not filename:
            missing.append((name, "no source photo yet"))
            continue
        found = find(args.src, filename)
        if not found:
            missing.append((name, filename))
            continue
        save_variants(found, name, large=True)

    if missing:
        print("\nStill needed:")
        for name, why in missing:
            print(f"  --  {name:24} ({why})")


if __name__ == "__main__":
    main()
