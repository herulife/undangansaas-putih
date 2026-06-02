from __future__ import annotations

import os
from pathlib import Path

from huggingface_hub import InferenceClient


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images"
MODEL = os.getenv("HF_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")
PROVIDER = os.getenv("HF_PROVIDER") or "auto"


ASSETS = {
    "sunda-couple-illustration.png": (
        "Premium Indonesian Sundanese wedding couple portrait, bride wearing elegant white kebaya "
        "with siger Sunda headpiece and jasmine details, groom wearing refined Sundanese beskap and "
        "traditional bendo headwear, warm ivory and antique gold wedding decor, soft editorial "
        "wedding photography mixed with painterly invitation art, graceful respectful pose, no text, "
        "no watermark, vertical composition."
    ),
    "ornament-corner.png": (
        "Elegant transparent-style corner ornament for premium Sundanese wedding invitation, "
        "jasmine flowers, soft green leaves, subtle antique gold linework, refined siger-inspired "
        "curves, isolated on plain light background, no text, no watermark."
    ),
    "paper-texture.png": (
        "Warm ivory handmade paper texture for Indonesian premium wedding invitation background, "
        "subtle fibers, soft champagne tone, very light gold patina, seamless calm backdrop, no text."
    ),
}


def token_is_available() -> bool:
    return bool(
        os.getenv("HF_TOKEN")
        or os.getenv("HUGGINGFACEHUB_API_TOKEN")
        or os.getenv("HUGGING_FACE_HUB_TOKEN")
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if not token_is_available():
        raise SystemExit(
            "HF token belum terbaca. Jalankan `hf auth login` atau set env `HF_TOKEN`, lalu ulangi script ini."
        )

    client = InferenceClient(model=MODEL, provider=PROVIDER, timeout=180)
    for filename, prompt in ASSETS.items():
        print(f"Generating {filename} with {MODEL}...")
        image = client.text_to_image(
            prompt,
            negative_prompt="low quality, blurry, distorted face, extra fingers, wrong culture, text, watermark, logo",
            width=1024,
            height=1536 if "couple" in filename else 1024,
            num_inference_steps=28,
        )
        image.save(OUT / filename)

    print(f"Saved generated assets to {OUT}")


if __name__ == "__main__":
    main()
