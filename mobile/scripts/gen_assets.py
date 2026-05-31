#!/usr/bin/env python3
"""Generate Braxton app launch assets."""

import math
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')
os.makedirs(OUT, exist_ok=True)

BG       = (10, 10, 10)       # #0A0A0A
GOLD     = (201, 168, 76)     # #C9A84C
GOLD_LT  = (226, 200, 122)    # #E2C87A
WHITE    = (245, 245, 245)    # #F5F5F5

FONT_SERIF_BOLD = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
FONT_SANS_BOLD  = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
FONT_SANS_REG   = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'


def font(path, size):
    return ImageFont.truetype(path, size)


def draw_corner_marks(draw, x0, y0, x1, y1, arm, thick, color):
    """Draw four L-shaped corner marks inside a bounding box."""
    h = thick // 2
    for (cx, cy, dx, dy) in [
        (x0, y0,  1,  1),
        (x1, y0, -1,  1),
        (x1, y1, -1, -1),
        (x0, y1,  1, -1),
    ]:
        hx0, hx1 = sorted([cx - h, cx + dx*arm + h])
        draw.rectangle([hx0, cy - h, hx1, cy + h], fill=color)
        vy0, vy1 = sorted([cy - h, cy + dy*arm + h])
        draw.rectangle([cx - h, vy0, cx + h, vy1], fill=color)


def thin_line(draw, x0, y0, x1, y1, color, width=1):
    draw.line([(x0, y0), (x1, y1)], fill=color, width=width)


# ──────────────────────────────────────────────
# icon.png  1024 × 1024
# ──────────────────────────────────────────────
def make_icon():
    W, H = 1024, 1024
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    margin = 70
    pad    = 30
    inner  = margin + pad

    # outer thin gold rectangle border
    draw.rectangle([margin, margin, W-margin, H-margin], outline=GOLD, width=2)

    # corner accent marks
    arm  = 60
    off  = margin + 2
    draw_corner_marks(draw, off, off, W-off, H-off, arm, 3, GOLD)

    # large "B" centred
    f_b = font(FONT_SERIF_BOLD, 500)
    bb  = draw.textbbox((0, 0), 'B', font=f_b)
    bw  = bb[2] - bb[0]
    bh  = bb[3] - bb[1]
    bx  = (W - bw) // 2 - bb[0]
    by  = (H - bh) // 2 - bb[1] - 40
    draw.text((bx, by), 'B', font=f_b, fill=GOLD)

    # thin horizontal rule under "B"
    ry = by + bh + 28
    thin_line(draw, W//2 - 160, ry, W//2 + 160, ry, GOLD, 2)

    # "BRAXTON" wordmark below rule
    f_w = font(FONT_SANS_BOLD, 62)
    word = 'BRAXTON'
    # letter-spaced manually
    chars    = list(word)
    spacing  = 14
    widths   = [draw.textbbox((0,0), c, font=f_w)[2] - draw.textbbox((0,0), c, font=f_w)[0] for c in chars]
    total_w  = sum(widths) + spacing * (len(chars)-1)
    cx       = (W - total_w) // 2
    ty       = ry + 20
    for i, (c, cw) in enumerate(zip(chars, widths)):
        draw.text((cx, ty), c, font=f_w, fill=GOLD_LT)
        cx += cw + spacing

    img.save(os.path.join(OUT, 'icon.png'))
    print('icon.png  ✓')


# ──────────────────────────────────────────────
# adaptive-icon.png  1024 × 1024  (foreground)
# The background colour (#0A0A0A) is set in app.json.
# Keep same design; background layer will be solid.
# ──────────────────────────────────────────────
def make_adaptive_icon():
    W, H = 1024, 1024
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Safe zone for adaptive icons: ~66% of canvas  ≈ 676×676 centred
    safe = int(W * 0.33)

    # Gold circle ring instead of rectangle (friendlier on masked shapes)
    cx, cy = W//2, H//2
    r_outer = W//2 - safe
    r_inner = r_outer - 6
    draw.ellipse([cx-r_outer, cy-r_outer, cx+r_outer, cy+r_outer], outline=GOLD, width=6)

    # large "B"
    f_b = font(FONT_SERIF_BOLD, 480)
    bb  = draw.textbbox((0, 0), 'B', font=f_b)
    bw  = bb[2] - bb[0]
    bh  = bb[3] - bb[1]
    bx  = (W - bw) // 2 - bb[0]
    by  = (H - bh) // 2 - bb[1] - 30
    draw.text((bx, by), 'B', font=f_b, fill=GOLD)

    # thin rule + wordmark
    ry = by + bh + 22
    thin_line(draw, W//2 - 150, ry, W//2 + 150, ry, GOLD, 2)

    f_w     = font(FONT_SANS_BOLD, 58)
    word    = 'BRAXTON'
    spacing = 13
    chars   = list(word)
    widths  = [draw.textbbox((0,0), c, font=f_w)[2] - draw.textbbox((0,0), c, font=f_w)[0] for c in chars]
    total_w = sum(widths) + spacing * (len(chars)-1)
    x       = (W - total_w) // 2
    ty      = ry + 18
    for c, cw in zip(chars, widths):
        draw.text((x, ty), c, font=f_w, fill=GOLD_LT)
        x += cw + spacing

    img.save(os.path.join(OUT, 'adaptive-icon.png'))
    print('adaptive-icon.png  ✓')


# ──────────────────────────────────────────────
# splash.png  1284 × 2778
# ──────────────────────────────────────────────
def make_splash():
    W, H = 1284, 2778
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Vertical centre slightly above mid
    mid_y = H // 2 - 60

    # Top decorative thin horizontal rule pair
    gap   = 14
    rule_w = 420
    thin_line(draw, W//2 - rule_w//2, mid_y - 120,      W//2 + rule_w//2, mid_y - 120,      GOLD, 1)
    thin_line(draw, W//2 - rule_w//2, mid_y - 120 + gap, W//2 + rule_w//2, mid_y - 120 + gap, GOLD, 1)

    # "BRAXTON" main wordmark
    f_main  = font(FONT_SERIF_BOLD, 160)
    word    = 'BRAXTON'
    spacing = 22
    chars   = list(word)
    widths  = [draw.textbbox((0,0), c, font=f_main)[2] - draw.textbbox((0,0), c, font=f_main)[0] for c in chars]
    bbs     = [draw.textbbox((0,0), c, font=f_main) for c in chars]
    total_w = sum(widths) + spacing * (len(chars)-1)
    x       = (W - total_w) // 2
    # baseline y — use ascent of first char
    asc     = bbs[0][3] - bbs[0][1]
    ty      = mid_y - asc // 2 - 40
    for c, bb, cw in zip(chars, bbs, widths):
        draw.text((x, ty), c, font=f_main, fill=GOLD)
        x += cw + spacing

    # Thin rule pair below wordmark
    below  = ty + asc + 38
    thin_line(draw, W//2 - rule_w//2, below,       W//2 + rule_w//2, below,       GOLD, 1)
    thin_line(draw, W//2 - rule_w//2, below + gap, W//2 + rule_w//2, below + gap, GOLD, 1)

    # Sub-tagline "RESTAURANT"
    f_sub   = font(FONT_SANS_REG, 36)
    sub     = 'RESTAURANT'
    sp2     = 10
    chs     = list(sub)
    wds     = [draw.textbbox((0,0), c, font=f_sub)[2] - draw.textbbox((0,0), c, font=f_sub)[0] for c in chs]
    tw2     = sum(wds) + sp2 * (len(chs)-1)
    sx      = (W - tw2) // 2
    sy      = below + gap + 28
    for c, cw in zip(chs, wds):
        draw.text((sx, sy), c, font=f_sub, fill=tuple(int(v*0.72) for v in GOLD_LT))
        sx += cw + sp2

    img.save(os.path.join(OUT, 'splash.png'))
    print('splash.png  ✓')


# ──────────────────────────────────────────────
# favicon.png  64 × 64
# ──────────────────────────────────────────────
def make_favicon():
    W, H = 64, 64
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    draw.rectangle([2, 2, W-3, H-3], outline=GOLD, width=1)

    f = font(FONT_SERIF_BOLD, 40)
    bb = draw.textbbox((0,0), 'B', font=f)
    bw = bb[2] - bb[0]
    bh = bb[3] - bb[1]
    draw.text(((W-bw)//2 - bb[0], (H-bh)//2 - bb[1] - 2), 'B', font=f, fill=GOLD)

    img.save(os.path.join(OUT, 'favicon.png'))
    print('favicon.png  ✓')


if __name__ == '__main__':
    make_icon()
    make_adaptive_icon()
    make_splash()
    make_favicon()
    print('\nAll assets written to assets/images/')
