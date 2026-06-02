# Adat Sunda Generated Template

Template baru ini dibuat sebagai desain premium adat Sunda dengan struktur lokal dan aset mandiri.

## Folder

```text
D:\UNDANGAN\clones\adat-sunda-generated
D:\UNDANGAN\template\adat-sunda-generated
D:\UNDANGAN\apps\web\public\template-assets\adat-sunda-generated
```

## Aset

- `assets/images/sunda-couple-illustration.png`: gambar pasangan Sunda.
- `assets/images/ornament-corner.png`: ornamen floral/siger.
- `assets/images/paper-texture.png`: tekstur kertas ivory.
- `assets/images/siger-monogram.png`: monogram dengan inspirasi siger.
- `assets/audio/sunda-kacapi-loop.wav`: loop audio lokal ringan.

Karena environment Codex belum login HF saat dibuat, aset visual awal dibuat sebagai fallback lokal. Untuk generate ulang via Hugging Face:

```powershell
hf auth login
python scripts\generate-hf-assets.py
```

Atau set:

```powershell
$env:HF_TOKEN="..."
$env:HF_IMAGE_MODEL="black-forest-labs/FLUX.1-schnell"
python scripts\generate-hf-assets.py
```

Jangan paste token ke chat.

## Fitur

- Cover dengan recipient `?to=`.
- Musik lokal setelah klik `Buka Undangan`.
- Auto-scroll per section setelah undangan dibuka.
- Tombol audio, read/autoscroll, dan back-to-top.
- Animasi fade/slide via IntersectionObserver.
- Google Maps embed tetap aktif dan lazy-load.
- RSVP lokal tanpa submit remote.
