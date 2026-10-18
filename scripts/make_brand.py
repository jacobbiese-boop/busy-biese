#!/usr/bin/env python3
"""
Regenerate the Busy Biese brand files in public/ from the bee mark and the
Parisienne wordmark (Visual System 1.0).

  public/brand/mark.svg          line bee, cocoa on transparent
  public/brand/logo.svg          lockup, cocoa (text converted to outlines)
  public/brand/logo-light.svg    lockup, pink (for cocoa backgrounds)
  public/brand/mark-512.png      line bee, cocoa on dusty pink
  public/favicon.svg             line bee on a pink rounded square (browser tabs, search)
  public/favicon.ico             16, 32 and 48 px versions with size-tuned line weights
  public/favicon-32.png, favicon-96.png, apple-touch-icon.png, icon-192.png, icon-512.png
  public/og/busy-biese.png       1200 x 630 social share image

Run from the project root after `npm install`:
  python3 scripts/make_brand.py
Needs: pip install pillow fonttools brotli playwright  (and `playwright install chromium`)
"""
from pathlib import Path
import shutil
import tempfile

from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
FONT = ROOT / "node_modules/@fontsource/parisienne/files/parisienne-latin-400-normal.woff2"

COCOA, PINK, PINK_MATTE, ROSE, IVORY = "#5C3A33", "#F2D4D4", "#E6B8B8", "#A8646A", "#FBF7F2"

BODY = "M100 96C120 96 124 126 121 150C118 176 108 190 100 196C92 190 82 176 79 150C76 126 80 96 100 96Z"
WING_L = "M92 90C74 60 20 34 12 60C8 86 66 96 92 90Z"
WING_R = "M108 90C126 60 180 34 188 60C192 86 134 96 108 90Z"
STRIPES = "M78.2 131.2Q100 136.8 121.8 131.2M79.8 155.6Q100 160.4 120.2 155.6M88 181.1Q100 182.9 112 181.1"
TRAIL = "M100 206C104 224 116 240 134 236C150 232 146 212 132 216C118 220 126 244 150 250"


def bee_group(color: str, solid: bool = False, stripe: str = PINK, motion: bool = False) -> str:
    fill = color if solid else "none"
    parts = [
        f'<g transform="rotate(-32 100 120)" fill="none" stroke="{color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">',
        f'<path d="{WING_L}"/>',
        f'<path d="{WING_R}"/>',
        f'<path d="{BODY}" fill="{fill}"/>',
        f'<path d="{STRIPES}" stroke-width="4" stroke-linecap="butt" stroke="{stripe if solid else color}"/>',
        f'<circle cx="100" cy="74" r="9" fill="{fill}"/>',
        '<path d="M96 64Q93 57 88 54"/>',
        '<path d="M104 64Q107 57 112 54"/>',
    ]
    if motion:
        parts.append(f'<path d="{TRAIL}" stroke-width="4" stroke-dasharray="1 8"/>')
    parts.append("</g>")
    return "".join(parts)


def bee_svg(color: str, size: int, solid: bool = False, motion: bool = False, bg: str | None = None, radius: int = 0) -> str:
    vb = "-19 -5 234 234" if motion else "-25.5 6.5 190 190"
    bgrect = ""
    if bg:
        x, y, w = vb.split()[0], vb.split()[1], vb.split()[2]
        bgrect = f'<rect x="{x}" y="{y}" width="{w}" height="{w}" rx="{radius}" fill="{bg}"/>'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="{vb}" role="img" aria-label="Busy Biese bee">'
        f"{bgrect}{bee_group(color, solid=solid, motion=motion)}</svg>"
    )


# The bee's visual center inside its 190-unit drawing (measured from a render).
BEE_CX, BEE_CY = 69.9, 101.6


def icon_svg(stroke: float, fill: float = 0.9, stripes: bool = True, radius: float = 0.22, size: int | None = None) -> str:
    """The logo's line bee, centered on a dusty pink rounded square.

    Small icons need heavier lines than the logo to stay readable, so `stroke`
    is chosen per size: about 14 at 16 px, 11 at 32 px, 9 at 96 px and up.
    `fill` is how much of the square the bee covers; `radius` is a share of
    the side (0 for a square that the system rounds itself, like iOS icons).
    """
    side = (172 + stroke) / fill
    x, y = BEE_CX - side / 2, BEE_CY - side / 2
    stripe = (
        f'<path d="{STRIPES}" stroke-width="{max(4.0, stroke * 0.78):.1f}" stroke-linecap="butt"/>' if stripes else ""
    )
    dims = f' width="{size}" height="{size}"' if size else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg"{dims} viewBox="{x:.1f} {y:.1f} {side:.1f} {side:.1f}" role="img" aria-label="Busy Biese bee">'
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{side:.1f}" height="{side:.1f}" rx="{side * radius:.1f}" fill="{PINK}"/>'
        f'<g transform="rotate(-32 100 120)" fill="none" stroke="{COCOA}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">'
        f'<path d="{WING_L}"/><path d="{WING_R}"/><path d="{BODY}"/>{stripe}<circle cx="100" cy="74" r="9"/>'
        '<path d="M96 64Q93 57 88 54"/><path d="M104 64Q107 57 112 54"/></g></svg>'
    )


def wordmark_paths(text: str, size_px: float, x: float, baseline: float) -> tuple[str, float]:
    """Return SVG <path> data for `text` in Parisienne at `size_px`, and its advance width."""
    font = TTFont(str(FONT))
    glyphset = font.getGlyphSet()
    cmap = font.getBestCmap()
    upem = font["head"].unitsPerEm
    scale = size_px / upem
    # kerning from GPOS pair adjustments is modest in a script face; apply what exists
    kern = {}
    try:
        from fontTools.ttLib.tables import otTables  # noqa: F401

        gpos = font["GPOS"].table
        for lookup in gpos.LookupList.Lookup:
            for sub in lookup.SubTable:
                if getattr(sub, "LookupType", lookup.LookupType) != 2:
                    continue
                if sub.Format == 1:
                    first = sub.Coverage.glyphs
                    for i, ps in enumerate(sub.PairSet):
                        for rec in ps.PairValueRecord:
                            v = rec.Value1.XAdvance if rec.Value1 and hasattr(rec.Value1, "XAdvance") else 0
                            if v:
                                kern[(first[i], rec.SecondGlyph)] = v
    except Exception:
        pass
    paths = []
    pen_x = x
    prev = None
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None:
            pen_x += upem * 0.25 * scale
            prev = None
            continue
        if prev and (prev, g) in kern:
            pen_x += kern[(prev, g)] * scale
        glyph = glyphset[g]
        pen = SVGPathPen(glyphset)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, pen_x, baseline))
        glyph.draw(tpen)
        d = pen.getCommands()
        if d:
            paths.append(d)
        pen_x += glyph.width * scale
        prev = g
    return " ".join(paths), pen_x - x


def lockup_svg(color: str, bee: int = 66, script: int = 48, gap: int = 14, pad: int = 8) -> str:
    # bee box is bee x bee at (pad, pad); text baseline sits near the bee's vertical middle
    text_x = pad + bee + gap
    baseline = pad + bee * 0.5 + script * 0.33
    d, adv = wordmark_paths("Busy Biese", script, text_x, baseline)
    width = round(text_x + adv + pad)
    height = bee + pad * 2
    # scale the bee's 190-unit viewBox into a bee-px box
    s = bee / 190
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="Busy Biese">'
        f'<g transform="translate({pad} {pad}) scale({s}) translate(25.5 -6.5)">{bee_group(color)}</g>'
        f'<path fill="{color}" d="{d}"/></svg>'
    )


def render_png(html: str, out: Path, width: int, height: int, transparent: bool = False, scale: int = 1) -> None:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": width, "height": height}, device_scale_factor=scale)
        pg.set_content(html, wait_until="networkidle")
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(out), omit_background=transparent)
        b.close()


def main() -> None:
    (PUB / "brand").mkdir(parents=True, exist_ok=True)
    (PUB / "og").mkdir(parents=True, exist_ok=True)

    # Vector marks
    (PUB / "brand/mark.svg").write_text(bee_svg(COCOA, 190))
    (PUB / "brand/logo.svg").write_text(lockup_svg(COCOA))
    (PUB / "brand/logo-light.svg").write_text(lockup_svg(PINK))
    # Favicons: the logo's line bee on a dusty pink rounded square, with the
    # line weight tuned per size so it stays crisp in browser tabs and search.
    (PUB / "favicon.svg").write_text(icon_svg(11))

    def icon_png(svg: str, out: Path, size: int, transparent: bool = True) -> None:
        bg = "transparent" if transparent else PINK
        html = f'<html><body style="margin:0;background:{bg}">{svg}</body></html>'
        render_png(html, out, size, size, transparent=transparent)

    ico_frames = []
    with tempfile.TemporaryDirectory() as tmp:
        for size, stroke, stripes in [(16, 14, False), (32, 11, True), (48, 10, True)]:
            frame = Path(tmp) / f"f{size}.png"
            icon_png(icon_svg(stroke, stripes=stripes, size=size), frame, size)
            ico_frames.append(Image.open(frame).convert("RGBA"))
        ico_frames[-1].save(PUB / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico_frames[:-1])
    icon_png(icon_svg(11, size=32), PUB / "favicon-32.png", 32)
    icon_png(icon_svg(9, size=96), PUB / "favicon-96.png", 96)

    # App icons: full square (iOS and Android round the corners themselves),
    # bee kept inside the safe zone, logo-like line weight.
    for name, size in [("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)]:
        icon_png(icon_svg(8, fill=0.74, radius=0, size=size), PUB / name, size, transparent=False)

    # The plain mark on pink, for profiles and documents
    svg = bee_svg(COCOA, 512, bg=PINK, radius=0)
    render_png(f'<html><body style="margin:0;background:{PINK}">{svg}</body></html>', PUB / "brand/mark-512.png", 512, 512)

    # Social share image (fonts inlined as data URIs so Chromium can load them from a blank page)
    import base64

    def font_face(family: str, path: Path, weight: str = "400") -> str:
        data = base64.b64encode(path.read_bytes()).decode()
        return (
            f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};"
            f"src:url(data:font/woff2;base64,{data}) format('woff2')}}"
        )

    font_css = font_face("Parisienne", FONT)
    jost_css = font_face("Jost Variable", ROOT / "node_modules/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2", "100 900")
    corm_css = font_face(
        "Cormorant Garamond Variable",
        ROOT / "node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2",
        "300 700",
    )
    og = f"""<html><head><style>{font_css}{jost_css}{corm_css}
      body{{margin:0;width:1200px;height:630px;background:{IVORY};font-family:'Jost Variable',sans-serif;color:{COCOA}}}
      .panel{{position:absolute;inset:40px;background:{PINK};border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px}}
      .lockup{{display:flex;align-items:center;gap:26px}}
      .word{{font-family:'Parisienne',cursive;font-size:132px;line-height:1;padding-top:6px}}
      .eyebrow{{font-size:22px;letter-spacing:0.4em;text-transform:uppercase;font-weight:400}}
      .tag{{font-family:'Cormorant Garamond Variable',serif;font-size:40px;font-weight:500;line-height:1.2}}
    </style></head><body>
      <div class="panel">
        <div class="lockup">{bee_svg(COCOA, 180, motion=True)}<div class="word">Busy Biese</div></div>
        <div class="tag">Baked to order, made to be shared</div>
        <div class="eyebrow">Small-batch bakery · Glendale Heights, IL</div>
      </div></body></html>"""
    render_png(og, PUB / "og/busy-biese.png", 1200, 630)
    print("brand assets written to", PUB)


if __name__ == "__main__":
    main()
