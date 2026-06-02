from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


SCALE = 3
SIZE = 1600
W = H = SIZE * SCALE


def s(value: float) -> int:
    return int(round(value * SCALE))


def cubic(p0, p1, p2, p3, steps=90):
    points = []
    for i in range(steps + 1):
        t = i / steps
        x = (
            (1 - t) ** 3 * p0[0]
            + 3 * (1 - t) ** 2 * t * p1[0]
            + 3 * (1 - t) * t**2 * p2[0]
            + t**3 * p3[0]
        )
        y = (
            (1 - t) ** 3 * p0[1]
            + 3 * (1 - t) ** 2 * t * p1[1]
            + 3 * (1 - t) * t**2 * p2[1]
            + t**3 * p3[1]
        )
        points.append((s(x), s(y)))
    return points


def paste_center(base: Image.Image, layer: Image.Image, x: float, y: float) -> None:
    base.alpha_composite(layer, (s(x) - layer.width // 2, s(y) - layer.height // 2))


def make_rotated_ellipse(
    width: float,
    height: float,
    angle: float,
    fill: tuple[int, int, int, int],
    outline: tuple[int, int, int, int] | None = None,
    blur: float = 0,
) -> Image.Image:
    pad = s(max(width, height) * 0.35)
    layer = Image.new("RGBA", (s(width) + pad * 2, s(height) + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    box = (pad, pad, pad + s(width), pad + s(height))
    d.ellipse(box, fill=fill)
    if outline:
        d.ellipse(box, outline=outline, width=s(1.2))
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(s(blur)))
    return layer.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)


def draw_curve(draw: ImageDraw.ImageDraw, points, color, width: float) -> None:
    draw.line(points, fill=color, width=s(width), joint="curve")


def draw_leaf(base: Image.Image, x: float, y: float, angle: float, size: float = 1.0) -> None:
    shadow = make_rotated_ellipse(86 * size, 28 * size, angle, (35, 55, 32, 42), blur=2)
    leaf = make_rotated_ellipse(
        82 * size,
        26 * size,
        angle,
        (93, 132, 91, 235),
        (67, 102, 69, 150),
    )
    paste_center(base, shadow, x + 3, y + 5)
    paste_center(base, leaf, x, y)

    vein = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(vein)
    rad = math.radians(angle)
    dx = math.cos(rad) * 31 * size
    dy = math.sin(rad) * 31 * size
    d.line((s(x - dx), s(y - dy), s(x + dx), s(y + dy)), fill=(230, 238, 219, 130), width=s(1.2))
    base.alpha_composite(vein)


def draw_jasmine(base: Image.Image, x: float, y: float, radius: float, rotation: float = 0) -> None:
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse(
        (s(x - radius * 0.72), s(y - radius * 0.44), s(x + radius * 0.72), s(y + radius * 0.55)),
        fill=(38, 31, 18, 40),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(s(5)))
    base.alpha_composite(shadow)

    petal_colors = [
        (255, 255, 249, 255),
        (250, 248, 237, 255),
        (255, 253, 244, 255),
        (246, 244, 232, 255),
    ]
    for i in range(7):
        angle = rotation + i * (360 / 7)
        rad = math.radians(angle)
        px = x + math.cos(rad) * radius * 0.34
        py = y + math.sin(rad) * radius * 0.34
        petal = make_rotated_ellipse(
            radius * 0.95,
            radius * 0.38,
            angle,
            petal_colors[i % len(petal_colors)],
            (224, 218, 198, 128),
        )
        paste_center(base, petal, px, py)

    d = ImageDraw.Draw(base)
    d.ellipse(
        (s(x - radius * 0.18), s(y - radius * 0.18), s(x + radius * 0.18), s(y + radius * 0.18)),
        fill=(238, 198, 105, 255),
        outline=(183, 142, 66, 210),
        width=s(1.2),
    )
    d.ellipse(
        (s(x - radius * 0.08), s(y - radius * 0.08), s(x + radius * 0.08), s(y + radius * 0.08)),
        fill=(255, 231, 145, 245),
    )


def main() -> None:
    out_dir = Path("assets/generated")
    out_dir.mkdir(parents=True, exist_ok=True)

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    gold = (183, 143, 71, 206)
    gold_soft = (216, 182, 113, 120)

    curves = [
        ((-20, 1360), (220, 1050), (430, 930), (790, 865), 4.0, gold),
        ((80, 1580), (245, 1200), (530, 1080), (985, 1060), 2.1, gold_soft),
        ((-40, 1510), (180, 1350), (325, 1180), (650, 1165), 2.7, gold),
        ((260, 1510), (350, 1260), (565, 1220), (820, 1280), 1.5, gold_soft),
    ]

    for p0, p1, p2, p3, width, color in curves:
        draw_curve(d, cubic(p0, p1, p2, p3), color, width)

    tendrils = [
        ((530, 1062), (650, 955), (790, 980), (825, 1090)),
        ((640, 870), (735, 760), (890, 760), (934, 880)),
        ((324, 1205), (445, 1065), (555, 1110), (575, 1245)),
    ]
    for curve in tendrils:
        draw_curve(d, cubic(*curve, steps=70), (207, 169, 98, 145), 1.35)

    for args in [
        (190, 1338, -34, 1.0),
        (306, 1210, -16, 0.82),
        (438, 1113, -46, 0.9),
        (543, 1012, 18, 0.72),
        (688, 905, -24, 0.75),
        (735, 1125, 16, 0.72),
        (530, 1280, -4, 0.58),
        (905, 1058, 7, 0.52),
        (114, 1492, -58, 0.62),
    ]:
        draw_leaf(canvas, *args)

    for args in [
        (250, 1294, 96, -18),
        (422, 1130, 78, 28),
        (624, 976, 66, -8),
        (760, 1084, 54, 18),
        (515, 1365, 48, -32),
        (126, 1454, 62, 14),
    ]:
        draw_jasmine(canvas, *args)

    # Tiny unopened buds add scale without making the ornament too busy.
    for x, y, angle, size in [
        (825, 884, -24, 0.62),
        (914, 936, 18, 0.52),
        (612, 1218, -8, 0.44),
        (350, 1426, -42, 0.5),
    ]:
        bud = make_rotated_ellipse(54 * size, 24 * size, angle, (252, 250, 239, 250), (218, 209, 184, 140))
        paste_center(canvas, bud, x, y)

    final = canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    final.save(out_dir / "ornamen-bunga-melati.png")


if __name__ == "__main__":
    main()
