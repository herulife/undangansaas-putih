# Template Knowledge: Wedding Premium050 — Pixel Clean

## Informasi Dasar
- **Nama:** wedding-premium050-pixel-clean
- **Pasangan Demo:** Hamzah & Anissa
- **Tanggal Acara:** Selasa, 2 Juni 2026 (target countdown)
- **Platform:** Linkundangan.com
- **Tema:** Pixel Clean — bersih, minimalis, warna teal (#154445) & emas (#6d5409)
- **Audio Backsound:** `assets/audio/islamic-wedding-backsound.m4a` (diambil dari template 042)

## Struktur Folder
```
wedding-premium050-pixel-clean/
├── assets/
│   ├── audio/          → islamic-wedding-backsound.m4a
│   ├── css/            → 19 file CSS (bootstrap5, animation-scroll, linkundangan-styling, dll)
│   ├── fonts/          → 215 file font + CSS
│   ├── images/         → 75 file (background, sticker GIF, icon, dll)
│   ├── js/             → clean-runtime.js (runtime utama)
│   ├── ornaments/      → 7 ornamen
│   └── vendor/         → (tidak ada)
└── index.html          → 1796 baris (single file)
```

## Panel Konten (7 Panel + Cover Modal)

| Panel ID | Judul | Isi Utama |
|----------|-------|-----------|
| `#coverModal` | Cover Pembuka | Modal fullscreen, particles.js, gradien gelap, "Buka Undangan" |
| `#nav-cover` | Hero | Nama pasangan (Anissa & Hamzah), countdown, date, year, zoom slider background |
| `#nav-perihal` | Assalamualaykum | Greeting, 2 kartu mempelai, foto, nama, keluarga |
| `#nav-acara` | Detail Acara | Save The Date, Akad, Resepsi (Google Maps), Ngunduh Mantu, Catatan DRESSCODE: BATIK |
| `#nav-cerita` | Love Story | Timeline 3 cerita (Kenalan→Tunangan→Menikah), harapan pengantin |
| `#nav-galeri` | Galeri | Image slider, grid 4 foto, custom lightbox |
| `#nav-tamu` | Buku Tamu | Form komentar (nama, hadir, pesan, stiker), wishes list, RSVP |
| `#nav-lainnya` | Amplop & Penutup | Transfer bank/OVO/DANA/GoPay, kado, ucapan terima kasih |

## Navigasi

### Top Nav (floating center)
- `.navmenu .navigation.open` — posisi tengah atas, max-width 333px
- 4 item: Perihal (heart #A15F9F), Acara (calendar #A15F9F), Galeri (grid #A15F9F), Tamu (user #A15F9F)
- Hamburger toggle: close X & expand dots (#6BAFC4)

### Bottom Nav (fixed bottom)
- `.bottom-nav .navigation` — fixed bottom, backdrop blur, z-index 999
- Struktur sama dengan top nav 042: left ul + humberger-btn + right ul
- 7 item: Home (house), Perihal (heart), Acara (calendar), Cerita (book), Galeri (grid), Tamu (user), Lainnya (gift)
- Ikon inline SVG dengan fill #A15F9F (purple) / #6BAFC4 (blue)
- Hamburger toggle: saat tertutup hanya menampilkan item pertama kiri & kanan
- Sembunyi di desktop (≥768px) dan sebelum undangan dibuka

## Animasi & Transisi

### Scroll-Triggered (custom engine)
- **Engine:** `clean-runtime.js` — scroll listener, hitung `scrollY + innerHeight/1.75`, tambah/hapus class `.animate`
- **Class efek:** `.kekanan` (left: -999→0), `.kekiri` (right: -999→0), `.membesar` (scale 0→1), `.muncul` (opacity 0→1)
- **Animate.css style:** `.animate-init.animate__flipInY` pada story timeline

### Idle Animations
- `animationcountertime` — countdown scale pulse
- `iddle8` — backsound icon rotation (dari CSS eksternal)

### Loading Screen
- Coffee cup animation (CSS murni), dihapus saat DOMContentLoaded
- Ditekan `display:none!important` untuk demo lokal

### Countdown
- Target: `2026-06-02T08:00:00+07:00`
- Update per 1 detik via `clean-runtime.js`
- Elemen: `.countday`, `.counthour`, `.countminute`, `.countsecond`

### Image Slider (Background)
- Zoom slider: 6 gambar backgrounds, ganti setiap 4.5 detik
- Background hero: `linear-gradient + url()` fade

### Backsound Player
- File: `assets/audio/islamic-wedding-backsound.m4a` (loop, preload none)
- Ikon `.iconplay` berputar (iddle8)
- Toggle play/pause via klik + visibility change handler

### Lightbox (Custom)
- `clean-lightbox` — fixed overlay, background rgba hitam, border-radius 11px
- Klik gambar di galeri/cerita → buka lightbox

## Runtime JS (clean-runtime.js)
- **Panel navigasi:** click `li[data-targetid]` → smooth scroll ke target
- **Bottom nav active state:** `updateBottomNav()` — highlight item berdasarkan scroll position
- **Read mode:** auto-scroll step 333px tiap 2 detik, easing easeInOutQuad
- **Guest name:** ambil dari `?to=` atau `/to/` URL, isi ke `.penerima` dan form
- **Form:** semua form `submit` diblokir untuk demo lokal
- **Cover:** `clean-ready` → `clean-open` saat "Buka Undangan" diklik

## Service Guard (Demo Mode)
- Semua form submit diblokir → tampilkan `.local-mode-note` "Mode lokal: pengiriman data dimatikan."
- Tidak ada fetch/XHR/WebSocket blocking (berbeda dengan template 042)
- Audio dimulai otomatis saat undangan dibuka

## Stack Teknologi
| Komponen | Teknologi |
|----------|-----------|
| CSS Framework | Bootstrap 5 |
| Animasi | Custom CSS + animate.css-style |
| Scroll Engine | Custom vanilla JS (requestAnimationFrame) |
| Slider | Custom vanilla JS (interval based) |
| Gallery | Custom lightbox (vanilla JS) |
| Ikon | FontAwesome + Bootstrap Icons + inline SVG |
| Audio | HTML5 Audio API |
| Font | 215 file + Google Fonts (Poppins, Ubuntu) |
| Build | Single file (no build system) |
