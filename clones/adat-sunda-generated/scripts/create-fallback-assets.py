from __future__ import annotations

import math
import random
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "assets" / "images"
AUDIO = ROOT / "assets" / "audio"


def save_paper_texture() -> None:
    w, h = 900, 1400
    base = Image.new("RGB", (w, h), "#f7f1e4")
    px = base.load()
    rng = random.Random(36)
    for y in range(h):
        for x in range(w):
            n = rng.randint(-5, 5)
            r, g, b = px[x, y]
            px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for i in range(90):
        x = rng.randint(-100, w)
        y = rng.randint(-80, h)
        color = (156, 132, 82, rng.randint(9, 18))
        draw.ellipse((x, y, x + rng.randint(80, 260), y + rng.randint(30, 120)), fill=color)
    base = Image.alpha_composite(base.convert("RGBA"), overlay.filter(ImageFilter.GaussianBlur(18)))
    base.convert("RGB").save(IMG / "paper-texture.webp", quality=64, method=6)


def leaf(draw: ImageDraw.ImageDraw, cx: float, cy: float, angle: float, scale: float, color: tuple[int, int, int, int]) -> None:
    pts = []
    for t in range(24):
        a = math.pi * 2 * t / 24
        r = math.sin(a) if a < math.pi else -math.sin(a)
        x = math.cos(a) * 18 * scale
        y = r * 7 * scale
        ca, sa = math.cos(angle), math.sin(angle)
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    draw.polygon(pts, fill=color)


def save_corner_ornament() -> None:
    img = Image.new("RGBA", (560, 560), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    gold = (184, 142, 72, 230)
    green = (67, 111, 86, 225)
    sage = (137, 157, 118, 190)
    blush = (206, 139, 130, 210)

    for r in (430, 480, 530):
        d.arc((-r * 0.52, -r * 0.52, r, r), 0, 92, fill=gold, width=3)
    for i in range(22):
        ang = math.radians(10 + i * 4.2)
        rad = 188 + i * 8
        x = math.cos(ang) * rad
        y = math.sin(ang) * rad
        leaf(d, x, y, ang + 1.1, 0.9 + i * 0.02, green if i % 2 else sage)
    for i in range(7):
        x = 56 + i * 34
        y = 95 + math.sin(i) * 28
        d.ellipse((x, y, x + 28, y + 28), fill=(255, 248, 232, 245), outline=gold, width=2)
        d.ellipse((x + 8, y + 8, x + 20, y + 20), fill=blush)
    for i in range(9):
        x = 40 + i * 42
        y = 35 + i * 8
        d.line((x, y, x + 28, y + 22), fill=gold, width=2)

    img.save(IMG / "ornament-corner.png", optimize=True)


def save_siger_badge() -> None:
    img = Image.new("RGBA", (720, 720), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 360, 370
    gold = (184, 142, 72, 245)
    dark = (56, 80, 66, 255)
    d.ellipse((145, 145, 575, 575), fill=(255, 248, 232, 210), outline=gold, width=5)
    d.ellipse((190, 190, 530, 530), outline=(216, 189, 129, 180), width=2)
    crown = [(cx - 180, cy - 25), (cx - 135, cy - 140), (cx - 85, cy - 40), (cx - 35, cy - 185), (cx, cy - 45),
             (cx + 35, cy - 185), (cx + 85, cy - 40), (cx + 135, cy - 140), (cx + 180, cy - 25), (cx + 150, cy + 35), (cx - 150, cy + 35)]
    d.polygon(crown, fill=gold)
    for x in [cx - 135, cx - 35, cx + 35, cx + 135]:
        d.ellipse((x - 14, cy - 74, x + 14, cy - 46), fill=(255, 244, 202, 255))
    d.text((cx - 61, cy + 70), "R", fill=dark, anchor="mm")
    d.text((cx + 58, cy + 70), "D", fill=dark, anchor="mm")
    d.line((cx - 2, cy + 32, cx - 2, cy + 120), fill=gold, width=3)
    img.save(IMG / "siger-monogram.png", optimize=True)


def draw_person(d: ImageDraw.ImageDraw, x: int, y: int, kind: str) -> None:
    skin = (186, 129, 91, 255)
    dark = (42, 54, 46, 255)
    gold = (184, 142, 72, 255)
    ivory = (248, 239, 219, 255)
    green = (47, 82, 67, 255)
    red = (120, 43, 48, 255)

    d.ellipse((x - 42, y - 188, x + 42, y - 104), fill=skin)
    d.ellipse((x - 28, y - 158, x - 20, y - 150), fill=dark)
    d.ellipse((x + 20, y - 158, x + 28, y - 150), fill=dark)
    d.arc((x - 18, y - 145, x + 18, y - 120), 15, 165, fill=(116, 70, 57, 255), width=3)

    if kind == "bride":
        d.pieslice((x - 62, y - 210, x + 62, y - 86), 188, 352, fill=(38, 42, 37, 255))
        crown = [(x - 78, y - 190), (x - 54, y - 262), (x - 22, y - 196), (x, y - 282), (x + 22, y - 196),
                 (x + 54, y - 262), (x + 78, y - 190), (x + 55, y - 170), (x - 55, y - 170)]
        d.polygon(crown, fill=gold)
        d.ellipse((x - 90, y - 120, x - 68, y + 80), fill=(255, 248, 232, 245))
        d.ellipse((x + 68, y - 120, x + 90, y + 80), fill=(255, 248, 232, 245))
        d.rounded_rectangle((x - 96, y - 92, x + 96, y + 220), radius=40, fill=ivory)
        d.polygon([(x - 96, y - 92), (x - 148, y + 225), (x + 148, y + 225), (x + 96, y - 92)], fill=(247, 235, 208, 255))
        d.line((x - 72, y - 44, x + 72, y + 138), fill=gold, width=4)
    else:
        d.polygon([(x - 62, y - 198), (x + 62, y - 198), (x + 78, y - 156), (x - 78, y - 156)], fill=dark)
        d.rectangle((x - 64, y - 186, x + 64, y - 160), fill=(22, 35, 29, 255))
        d.rounded_rectangle((x - 102, y - 88, x + 102, y + 218), radius=34, fill=green)
        d.rectangle((x - 28, y - 88, x + 28, y + 218), fill=(236, 218, 173, 255))
        d.polygon([(x - 122, y + 84), (x + 122, y + 84), (x + 145, y + 228), (x - 145, y + 228)], fill=red)
        for i in range(8):
            d.line((x - 132 + i * 34, y + 94, x - 102 + i * 34, y + 218), fill=gold, width=2)


def save_couple_illustration() -> None:
    w, h = 1080, 1440
    img = Image.new("RGBA", (w, h), "#f5eedf")
    d = ImageDraw.Draw(img)
    for y in range(h):
        c = int(245 - y * 22 / h)
        d.line((0, y, w, y), fill=(c, max(224, c - 8), max(204, c - 24), 255))
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse((135, 130, 945, 980), fill=(255, 250, 232, 205))
    hd.ellipse((230, 260, 850, 1120), outline=(184, 142, 72, 95), width=4)
    img = Image.alpha_composite(img, halo.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(img)

    for i in range(42):
        x = 30 + (i * 83) % 1030
        y = 1040 + math.sin(i * 1.7) * 56 + (i % 5) * 40
        leaf(d, x, y, -0.5 + (i % 7) * 0.18, 1.4, (68, 111, 86, 145))
    d.rounded_rectangle((110, 1010, 970, 1288), radius=130, fill=(236, 226, 198, 115))
    draw_person(d, 430, 900, "bride")
    draw_person(d, 660, 900, "groom")
    d.ellipse((220, 1170, 860, 1218), fill=(83, 67, 48, 42))
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=3))
    img.save(IMG / "sunda-couple-illustration.png", optimize=True)


def save_gallery_cards() -> None:
    specs = [
        ("gallery-akad.png", "#f6efe2", "#375744", "AKAD"),
        ("gallery-dekor.png", "#f3ead8", "#b88e48", "SUKA"),
        ("gallery-cincin.png", "#f8f2e8", "#7f3037", "JANJI"),
    ]
    for name, bg, color, label in specs:
        img = Image.new("RGBA", (720, 920), bg)
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((55, 55, 665, 865), radius=44, fill=(255, 255, 255, 185), outline=(184, 142, 72, 130), width=3)
        for i in range(18):
            leaf(d, 110 + i * 28, 130 + math.sin(i) * 22, 0.8, 1.0, (67, 111, 86, 120))
        d.ellipse((215, 245, 505, 535), outline=color, width=8)
        d.ellipse((265, 295, 455, 485), outline=(184, 142, 72, 180), width=4)
        d.rectangle((185, 610, 535, 620), fill=(184, 142, 72, 170))
        d.text((360, 674), label, anchor="mm", fill=color)
        img.save(IMG / name, optimize=True)


def save_audio_loop() -> None:
    AUDIO.mkdir(parents=True, exist_ok=True)
    sample_rate = 22050
    duration = 14.0
    tones = [392.0, 440.0, 523.25, 587.33, 659.25, 587.33, 523.25, 440.0]
    frames = []
    total = int(sample_rate * duration)
    for i in range(total):
        t = i / sample_rate
        idx = int(t * 2.2) % len(tones)
        freq = tones[idx]
        phase = (t * freq) % 1.0
        pluck = math.exp(-((t * 2.2) % 1.0) * 4.6)
        wave_a = (2.0 * abs(2.0 * phase - 1.0) - 1.0) * pluck
        wave_b = math.sin(2 * math.pi * 98.0 * t) * 0.12
        value = int(max(-1, min(1, (wave_a * 0.24 + wave_b * 0.18))) * 32767)
        frames.append(value.to_bytes(2, "little", signed=True))
    with wave.open(str(AUDIO / "sunda-kacapi-loop.wav"), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        f.writeframes(b"".join(frames))


def main() -> None:
    IMG.mkdir(parents=True, exist_ok=True)
    AUDIO.mkdir(parents=True, exist_ok=True)
    save_paper_texture()
    save_corner_ornament()
    save_siger_badge()
    save_couple_illustration()
    save_gallery_cards()
    save_audio_loop()
    print("fallback assets generated")


if __name__ == "__main__":
    main()
