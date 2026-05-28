#!/usr/bin/env python3
"""
Remove matte backgrounds and gray halos so avatars blend like Krishna PNGs.
Edge flood-fill → hard alpha (no wide blur) → 500×500 canvas.

Usage:
  python3 scripts/process-avatar-backgrounds.py --force
"""

from __future__ import annotations

import argparse
import sys
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: python3 -m pip install -r scripts/requirements-avatars.txt", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
AVATARS_DIR = ROOT / "img" / "avatars"
CHARACTERS = ("rama", "radha", "hanuman")
CANVAS_SIZE = 500
BG_TOLERANCE = 40
BG_TOLERANCE_MAX = 76
CORNER_PAD = 10
MIN_TRANSPARENT_PCT = 55
MAX_SEMI_PIXELS = 6000  # Krishna ~3.5k; above = gray halo / checkerboard bleed
PAGE_BG = (250, 250, 247)
ALPHA_HARD_CUT = 155
FRINGE_COLOR_TOL = 78


def _color_dist(a, b) -> float:
    return (
        (int(a[0]) - int(b[0])) ** 2
        + (int(a[1]) - int(b[1])) ** 2
        + (int(a[2]) - int(b[2])) ** 2
    ) ** 0.5


def _border_bg_rgb(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    rgba = img.convert("RGBA")
    samples: list[tuple[int, int, int]] = []
    strip = max(2, min(w, h) // 80)
    for x in range(w):
        for y in range(strip):
            samples.append(rgba.getpixel((x, y))[:3])
        for y in range(h - strip, h):
            samples.append(rgba.getpixel((x, y))[:3])
    for y in range(strip, h - strip):
        for x in range(strip):
            samples.append(rgba.getpixel((x, y))[:3])
        for x in range(w - strip, w):
            samples.append(rgba.getpixel((x, y))[:3])
    rs = sorted(s[0] for s in samples)
    gs = sorted(s[1] for s in samples)
    bs = sorted(s[2] for s in samples)
    mid = len(rs) // 2
    return (rs[mid], gs[mid], bs[mid])


def _flood_background_mask(img: Image.Image, bg_rgb: tuple[int, int, int], tol: float) -> list[list[bool]]:
    w, h = img.size
    px = img.load()
    mask = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if mask[y][x]:
            return
        if _color_dist(px[x, y][:3], bg_rgb) <= tol:
            mask[y][x] = True
            q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx]:
                if _color_dist(px[nx, ny][:3], bg_rgb) <= tol:
                    mask[ny][nx] = True
                    q.append((nx, ny))
    return mask


def _aggressive_harden(rgba: Image.Image, bg_rgb: tuple[int, int, int], alpha_cut: int) -> Image.Image:
    """Last resort: strip wide gray fringe (checkerboard bleed)."""
    px = rgba.load()
    w, h = rgba.size
    spill_tol = FRINGE_COLOR_TOL + 40
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            near_bg = _color_dist((r, g, b), bg_rgb) <= spill_tol
            lum = (r + g + b) / 3
            if a <= alpha_cut:
                px[x, y] = (0, 0, 0, 0)
            elif near_bg:
                px[x, y] = (0, 0, 0, 0)
            elif a < 255 and lum < 200 and near_bg:
                px[x, y] = (0, 0, 0, 0)
            elif lum < 140 and _color_dist((r, g, b), bg_rgb) <= spill_tol + 25:
                px[x, y] = (0, 0, 0, 0)
    return rgba


def _despill_opaque_fringe(rgba: Image.Image, bg_rgb: tuple[int, int, int]) -> Image.Image:
    """Remove nearly-opaque gray pixels left around the subject (Radha concerned, etc.)."""
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 180:
                continue
            lum = (r + g + b) / 3
            if _color_dist((r, g, b), bg_rgb) <= 95 and lum < 210:
                px[x, y] = (0, 0, 0, 0)
            elif lum > 185 and lum < 235 and max(abs(r - g), abs(g - b), abs(r - b)) < 18:
                if _color_dist((r, g, b), bg_rgb) <= 110:
                    px[x, y] = (0, 0, 0, 0)
    return rgba


def _harden_alpha(rgba: Image.Image, bg_rgb: tuple[int, int, int]) -> Image.Image:
    """Remove gray semi-transparent halos that show as checkerboard over the UI."""
    px = rgba.load()
    w, h = rgba.size
    fringe = bg_rgb

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if a < ALPHA_HARD_CUT:
                px[x, y] = (0, 0, 0, 0)
                continue
            if _color_dist((r, g, b), fringe) <= FRINGE_COLOR_TOL:
                px[x, y] = (0, 0, 0, 0)
                continue
            if a < 250:
                lum = (r + g + b) / 3
                if lum < 175 and _color_dist((r, g, b), fringe) <= FRINGE_COLOR_TOL + 28:
                    px[x, y] = (0, 0, 0, 0)
                elif a < 200:
                    px[x, y] = (0, 0, 0, 0)
    return rgba


def _remove_page_tint(rgba: Image.Image, tol: float = 24) -> Image.Image:
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if 0 < a < 220 and _color_dist((r, g, b), PAGE_BG) <= tol:
                px[x, y] = (0, 0, 0, 0)
    return rgba


def _process_pixels(img: Image.Image, bg_rgb: tuple[int, int, int], tol: float) -> Image.Image:
    w, h = img.size
    mask = _flood_background_mask(img, bg_rgb, tol)
    rgba = img.convert("RGBA")
    px = rgba.load()

    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                px[x, y] = (0, 0, 0, 0)

    rgba = _remove_page_tint(rgba)
    rgba = _harden_alpha(rgba, bg_rgb)
    return rgba


def _semi_count(img: Image.Image) -> int:
    return sum(1 for _, _, _, a in img.convert("RGBA").getdata() if 0 < a < 255)


def _needs_reprocess(img: Image.Image, force: bool) -> bool:
    if force:
        return True
    if max(img.size) > 600:
        return True
    if _semi_count(img) > MAX_SEMI_PIXELS:
        return True
    rgba = img.convert("RGBA")
    w, h = rgba.size
    if w != CANVAS_SIZE or h != CANVAS_SIZE:
        return True
    corners = [rgba.getpixel((0, 0))[3], rgba.getpixel((w - 1, 0))[3]]
    return not all(a < 128 for a in corners)


def _crop_to_subject(img: Image.Image, pad: int = CORNER_PAD) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def _fit_krishna_canvas(img: Image.Image, size: int = CANVAS_SIZE) -> Image.Image:
    subject = img.convert("RGBA")
    sw, sh = subject.size
    max_w = int(size * 0.92)
    max_h = int(size * 0.88)
    scale = min(max_w / sw, max_h / sh, 1.0)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    if scale < 1.0:
        subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - subject.width) // 2
    y = size - subject.height
    canvas.paste(subject, (x, y), subject)
    return canvas


def _transparent_pct(img: Image.Image) -> float:
    rgba = img.convert("RGBA")
    total = rgba.width * rgba.height
    if total == 0:
        return 0.0
    transparent = sum(1 for _, _, _, a in rgba.getdata() if a < 128)
    return 100 * transparent / total


def process_file(path: Path, dry_run: bool, force: bool) -> dict:
    img = Image.open(path)
    if not _needs_reprocess(img, force):
        return {
            "path": str(path.relative_to(ROOT)),
            "skipped": True,
            "semi": _semi_count(img),
            "transparent_pct": round(_transparent_pct(img), 1),
        }

    bg = _border_bg_rgb(img)
    used_tol = BG_TOLERANCE
    out = None

    for tol in range(BG_TOLERANCE, BG_TOLERANCE_MAX + 1, 4):
        used_tol = tol
        out = _process_pixels(img, bg, tol)
        out = _crop_to_subject(out)
        out = _fit_krishna_canvas(out)
        for _ in range(4):
            out = _harden_alpha(out, bg)
            if _semi_count(out) <= MAX_SEMI_PIXELS:
                break
        if _transparent_pct(out) >= MIN_TRANSPARENT_PCT and _semi_count(out) <= MAX_SEMI_PIXELS:
            break

    assert out is not None
    while _semi_count(out) > MAX_SEMI_PIXELS:
        prev = _semi_count(out)
        out = _harden_alpha(out, bg)
        if _semi_count(out) >= prev:
            break

    for cut in (200, 215, 230):
        if _semi_count(out) <= MAX_SEMI_PIXELS:
            break
        out = _aggressive_harden(out, bg, cut)
    if _semi_count(out) > MAX_SEMI_PIXELS:
        out = _despill_opaque_fringe(out, bg)
        out = _harden_alpha(out, bg)
    semi = _semi_count(out)
    transparent_pct = round(_transparent_pct(out), 1)

    if not dry_run:
        out.save(path, "PNG", optimize=True)

    return {
        "path": str(path.relative_to(ROOT)),
        "size_in": img.size,
        "size_out": out.size,
        "bg_rgb": bg,
        "tolerance": used_tol,
        "semi": semi,
        "transparent_pct": transparent_pct,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true", help="Re-process all files")
    args = parser.parse_args()

    files: list[Path] = []
    for char in CHARACTERS:
        char_dir = AVATARS_DIR / char
        if char_dir.is_dir():
            files.extend(sorted(char_dir.glob("*.png")))

    if not files:
        print("No avatar PNGs found under", AVATARS_DIR)
        sys.exit(1)

    print(f"Processing {len(files)} file(s) → Krishna-style clean alpha…")
    for f in files:
        info = process_file(f, args.dry_run, args.force)
        if info.get("skipped"):
            print(
                f"  {info['path']}: skip (semi={info['semi']}, transparent={info['transparent_pct']}%)"
            )
            continue
        print(
            f"  {info['path']}: {info['size_in']} → {info['size_out']}, "
            f"tol={info['tolerance']}, semi={info['semi']}, transparent={info['transparent_pct']}%"
            + (" (dry-run)" if args.dry_run else "")
        )
    print("Done.")


if __name__ == "__main__":
    main()
