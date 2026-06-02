# Wedding Premium050 Pixel Clean

Tujuan versi ini adalah mempertahankan visual template original `050` sedekat mungkin, tetapi mengganti runtime lama yang berat dan obfuscated dengan runtime kecil yang bisa dirawat.

## Sumber

- Original: `D:\UNDANGAN\template\050\index.html`
- Aset original disalin dari `D:\UNDANGAN\template\050\assets`
- File original disimpan sebagai `original.html`

## Rebuild

```powershell
node scripts/rebuild.mjs
node scripts/audit-static.mjs
```

## Perubahan Runtime

- Semua script lama, jQuery runtime, Bootstrap JS, PhotoSwipe JS, particles JS, analytics, dan AJAX obfuscated dihapus dari HTML hasil.
- HTML dan CSS visual original tetap dipertahankan.
- Runtime baru: `assets/js/clean-runtime.js`
- CSS tambahan kecil: `assets/css/clean-runtime.css`

## Fitur Runtime Baru

- Cover modal muncul dari awal seperti original.
- Tombol `Buka Undangan` membuka halaman, memutar audio, dan menyalakan auto-read.
- Audio toggle tetap memakai tombol `.backsound`.
- Auto-scroll memakai pola original: langkah 333px, jeda 2000ms, durasi 999ms.
- Animasi `.muncul`, `.kekiri`, `.kekanan`, `.membesar` tetap dipicu dengan class `.animate`.
- Countdown lokal berjalan tanpa dependency.
- Background slider `.bg-header` berjalan tanpa jQuery.
- Form RSVP/ucapan dimatikan untuk mode lokal.
- Google Maps embed lokasi tetap aktif dengan `loading="lazy"`.
- Galeri punya lightbox ringan tanpa PhotoSwipe.
