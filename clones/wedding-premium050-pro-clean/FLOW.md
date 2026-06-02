# Wedding Premium 050 Pro Clean

Sumber visual dan asset:

```text
D:\UNDANGAN\template\050
```

Output build:

```text
D:\UNDANGAN\clones\wedding-premium050-pro-clean\dist
D:\UNDANGAN\template\050-pro
D:\UNDANGAN\apps\web\public\template-assets\050-pro
```

Tujuan:

- Mengganti runtime clone berat menjadi template statis bersih.
- Tidak memakai jQuery, Bootstrap, AOS, PhotoSwipe, analytics, atau script remote.
- Semua asset tetap lokal.
- Audio dimuat setelah user klik `Buka Undangan`.
- Auto-scroll berjalan per section setelah undangan dibuka.
- Output tetap bisa dibuka sebagai static HTML.

Perintah build:

```powershell
cd D:\UNDANGAN\clones\wedding-premium050-pro-clean
npm run build
npm run audit
```

Direct preview setelah disalin:

```text
http://127.0.0.1:5173/template-assets/050-pro/index.html?to=Tamu+Undangan
```

Build terakhir:

```text
dist/index.html        12.07 kB | gzip 3.36 kB
dist/assets/style.css   8.51 kB | gzip 2.68 kB
dist/assets/app.js      3.05 kB | gzip 1.44 kB
Missing refs: 0
Remote refs: 0
```

Browser verification:

- Cover tampil.
- Guest `?to=` terbaca.
- Klik `Buka Undangan` membuka halaman.
- Audio bisa toggle.
- Auto-scroll aktif otomatis dan bergerak antar section.
- Console error/warning kosong.
