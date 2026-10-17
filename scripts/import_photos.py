#!/usr/bin/env python3
"""
Import photos into public/photos for the Busy Biese site.

Each photo becomes:
  public/photos/<name>-800.webp    cards and thumbnails
  public/photos/<name>-1600.webp   large views
  public/photos/<name>-og.jpg      1200x630 social share crop

Usage
  # Everything from the old Replit project's attached_assets folder:
  python3 scripts/import_photos.py --src path/to/attached_assets

  # One photo under a name (any file name works):
  python3 scripts/import_photos.py --file path/to/photo.jpg --name cinnamon-rolls

Requires Pillow (pip install pillow).
"""
import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "photos"
MAP = ROOT / "scripts" / "photo-map.json"
SIZES = (800, 1600)


def save_variants(src: Path, name: str) -> None:
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
        raise SystemExit(f"Photo name '{name}' must be lowercase words joined by dashes.")
    OUT.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        for width in SIZES:
            copy = im.copy()
            if copy.width > width:
                copy = copy.resize((width, round(copy.height * width / copy.width)), Image.LANCZOS)
            copy.save(OUT / f"{name}-{width}.webp", "WEBP", quality=80, method=6)
        og = ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(0.5, 0.5))
        og.save(OUT / f"{name}-og.jpg", "JPEG", quality=82, optimize=True, progressive=True)
    print(f"  ok  {name:24} <- {src.name}")


def find(src_dir: Path, filename: str) -> Path | None:
    exact = src_dir / filename
    if exact.exists():
        return exact
    # Same picture with a different upload stamp, e.g. ..._(11)_1772342643296.jpeg
    stem = re.sub(r"_\d{10,}$", "", Path(filename).stem)
    for candidate in sorted(src_dir.rglob("*")):
        if candidate.is_file() and re.sub(r"_\d{10,}$", "", candidate.stem) == stem:
            return candidate
    return None


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", type=Path, help="Folder with the original photos (Replit attached_assets)")
    ap.add_argument("--file", type=Path, help="A single photo to import")
    ap.add_argument("--name", help="Photo name to use with --file, e.g. cinnamon-rolls")
    args = ap.parse_args()

    if args.file:
        if not args.name:
            raise SystemExit("--file needs --name")
        save_variants(args.file, args.name)
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
        save_variants(found, name)

    if missing:
        print("\nStill needed:")
        for name, why in missing:
            print(f"  --  {name:24} ({why})")


if __name__ == "__main__":
    main()
