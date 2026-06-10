#!/usr/bin/env python3
"""Generate Cafe Locco app launch assets."""

import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')
os.makedirs(OUT, exist_ok=True)

BG      = (10, 10, 10)     # #0A0A0A
GOLD    = (201, 168, 76)   # #C9A84C
GOLD_LT = (226, 200, 122)  # #E2C87A

FONT_SERIF_BOLD = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
FONT_SANS_BOLD  = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
FONT_SANS_REG   = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'


def font(path, size):
    return ImageFont.truetype(path, size)


def draw_corner_marks(draw, x0, y0, x1, y1, arm, thick, color):
    """Four L-shaped corner accent marks."""
    h = thick // 2
    for (cx, cy, dx, dy) in [
        (x0, y0,  1,  1),
        (x1, y0, -1,  1),
        (x1, y1, -1, -1),
        (x0, y1,  1, -1),
    ]:
        hx0, hx1 = sorted([cx - h, cx + dx * arm + h])
        draw.rectangle([hx0, cy - h, hx1, cy + h], fill=color)
        vy0, vy1 = sorted([cy - h, cy + dy * arm + h])
        draw.rectangle([cx - h, vy0, cx + h, vy1], fill=color)


def thin_line(draw, x0, y0, x1, y1, color, width=1):
    draw.line([(x0, y0), (x1, y1)], fill=color, width=width)


def draw_wordmark(draw, font_obj, word, canvas_w, y, spacing, color):
    """Render a letter-spaced wordmark centred on canvas_w."""
    chars  = list(word)
    bboxes = [draw.textbbox((0, 0), c, font=font_obj) for c in chars]
    widths = [bb[2] - bb[0] for bb in bboxes]
    total  = sum(widths) + spacing * (len(chars) - 1)
    x = (canvas_w - total) // 2
    for c, bb, cw in zip(chars, bboxes, widths):
        draw.text((x - bb[0], y - bb[1]), c, font=font_obj, fill=color)
        x += cw + spacing
    return total


# ──────────────────────────────────────────────
# icon.png  1024 × 1024
# ──────────────────────────────────────────────
def make_icon():
    W, H = 1024, 1024
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    margin = 70

    # Outer thin gold border
    draw.rectangle([margin, margin, W - margin, H - margin], outline=GOLD, width=2)

    # Corner accent marks
    off = margin + 2
    draw_corner_marks(draw, off, off, W - off, H - off, 60, 3, GOLD)

    # Large "C" monogram centred
    f_c = font(FONT_SERIF_BOLD, 480)
    bb  = draw.textbbox((0, 0), 'C', font=f_c)
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    bx = (W - bw) // 2 - bb[0]
    by = (H - bh) // 2 - bb[1] - 50
    draw.text((bx, by), 'C', font=f_c, fill=GOLD)

    # Thin rule under "C"
    ry = by + bh + 30
    thin_line(draw, W // 2 - 170, ry, W // 2 + 170, ry, GOLD, 2)

    # "CAFE LOCCO" wordmark
    f_w = font(FONT_SANS_BOLD, 50)
    draw_wordmark(draw, f_w, 'CAFE LOCCO', W, ry + 22, 10, GOLD_LT)

    img.save(os.path.join(OUT, 'icon.png'))
    print('icon.png  ✓')


# ──────────────────────────────────────────────
# adaptive-icon.png  1024 × 1024
# ──────────────────────────────────────────────
def make_adaptive_icon():
    W, H = 1024, 1024
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Gold circle ring (safe zone ~66 % of canvas)
    cx, cy  = W // 2, H // 2
    r_outer = W // 2 - int(W * 0.33)
    draw.ellipse(
        [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
        outline=GOLD, width=6,
    )

    # Large "C" monogram
    f_c = font(FONT_SERIF_BOLD, 450)
    bb  = draw.textbbox((0, 0), 'C', font=f_c)
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    bx = (W - bw) // 2 - bb[0]
    by = (H - bh) // 2 - bb[1] - 40
    draw.text((bx, by), 'C', font=f_c, fill=GOLD)

    # Thin rule
    ry = by + bh + 24
    thin_line(draw, W // 2 - 155, ry, W // 2 + 155, ry, GOLD, 2)

    # "CAFE LOCCO" wordmark
    f_w = font(FONT_SANS_BOLD, 46)
    draw_wordmark(draw, f_w, 'CAFE LOCCO', W, ry + 20, 9, GOLD_LT)

    img.save(os.path.join(OUT, 'adaptive-icon.png'))
    print('adaptive-icon.png  ✓')


# ──────────────────────────────────────────────
# splash.png  1284 × 2778
# ──────────────────────────────────────────────
def make_splash():
    W, H = 1284, 2778
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    mid_y  = H // 2 - 60
    gap    = 14
    rule_w = 500

    # Double rule above wordmark
    thin_line(draw, W // 2 - rule_w // 2, mid_y - 120,       W // 2 + rule_w // 2, mid_y - 120,       GOLD, 1)
    thin_line(draw, W // 2 - rule_w // 2, mid_y - 120 + gap, W // 2 + rule_w // 2, mid_y - 120 + gap, GOLD, 1)

    # "CAFE LOCCO" main wordmark
    f_main  = font(FONT_SERIF_BOLD, 118)
    word    = 'CAFE LOCCO'
    spacing = 14
    chars   = list(word)
    bboxes  = [draw.textbbox((0, 0), c, font=f_main) for c in chars]
    widths  = [bb[2] - bb[0] for bb in bboxes]
    total_w = sum(widths) + spacing * (len(chars) - 1)
    x       = (W - total_w) // 2
    asc     = bboxes[0][3] - bboxes[0][1]
    ty      = mid_y - asc // 2 - 40

    for c, bb, cw in zip(chars, bboxes, widths):
        draw.text((x - bb[0], ty - bb[1]), c, font=f_main, fill=GOLD)
        x += cw + spacing

    # Double rule below wordmark
    below = ty + asc + 38
    thin_line(draw, W // 2 - rule_w // 2, below,       W // 2 + rule_w // 2, below,       GOLD, 1)
    thin_line(draw, W // 2 - rule_w // 2, below + gap, W // 2 + rule_w // 2, below + gap, GOLD, 1)

    # Sub-tagline "RESTAURANT"
    f_sub    = font(FONT_SANS_REG, 36)
    sub_col  = tuple(int(v * 0.72) for v in GOLD_LT)
    draw_wordmark(draw, f_sub, 'RESTAURANT', W, below + gap + 30, 10, sub_col)

    img.save(os.path.join(OUT, 'splash.png'))
    print('splash.png  ✓')


# ──────────────────────────────────────────────
# favicon.png  64 × 64
# ──────────────────────────────────────────────
def make_favicon():
    W, H = 64, 64
    img  = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    draw.rectangle([2, 2, W - 3, H - 3], outline=GOLD, width=1)

    f  = font(FONT_SERIF_BOLD, 40)
    bb = draw.textbbox((0, 0), 'C', font=f)
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    draw.text(((W - bw) // 2 - bb[0], (H - bh) // 2 - bb[1] - 2), 'C', font=f, fill=GOLD)

    img.save(os.path.join(OUT, 'favicon.png'))
    print('favicon.png  ✓')


if __name__ == '__main__':
    make_icon()
    make_adaptive_icon()
    make_splash()
    make_favicon()
    print('\nAll assets written to assets/images/')
