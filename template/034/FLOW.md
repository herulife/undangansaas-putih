# Wedding Premium 034 Rebuild Flow

Sumber:

```text
https://share.linkundangan.com/invcode/wedding-premium034
```

HTML utama diambil dari:

```text
https://share.linkundangan.com/invcode/wedding-premium034?to=Tamu+Undangan
```

Output kerja:

```text
D:\UNDANGAN\clones\wedding-premium034-rebuild-flow
```

Output final:

```text
D:\UNDANGAN\template\034
D:\UNDANGAN\apps\web\public\template-assets\034
```

Catatan rebuild:

- `original.html` disimpan sebagai referensi.
- Asset CSS, JS, gambar, font, audio, dan ornament dilokalkan ke `./assets`.
- Analytics, Cloudflare challenge, websocket/viewer, guestbook, reservation, dan submit form remote dimatikan untuk mode lokal.
- Google Maps embed lokasi tetap dipertahankan dan diberi `loading="lazy"`.
- YouTube embed diganti placeholder lokal supaya preview tidak berat.
- Animasi gelas kopi bawaan (`coffee.css`, `.coffee`, `.plate`) dihapus dari output lokal.
- `local-stubs.js` menahan request remote non-asset agar halaman lokal tidak error.
- `local-overrides.js` menjaga tombol buka undangan, audio, tombol Top/Read, auto-scroll, dan form demo tetap aman.

Perintah:

```powershell
node src-flow\build-all.js
node src-flow\audit-build.js
```

Direct preview:

```text
http://127.0.0.1:5173/template-assets/034/index.html?to=Tamu+Undangan
```
