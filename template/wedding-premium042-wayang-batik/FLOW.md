# Template 042 Rebuild Flow

Sumber referensi:

```text
https://share.linkundangan.com/invcode/wedding-premium042
```

Folder ini dibuat ulang mengikuti `D:\UNDANGAN\CLONE_REBUILD_FLOW.md`.

## Catatan Rebuild

- HTML referensi disimpan di `src-flow/source-reference.html`.
- Fetch live terbaru disimpan di `src-flow/source-live-fetch.html`.
- Output `index.html` dibangun dari partial di `src-flow/partials`.
- Asset lokal tetap memakai struktur clone asli agar CSS/JS bawaan template tidak rusak.
- Audio memakai `assets/audio/islamic-wedding-backsound.m4a`.
- Loading gelas kopi disembunyikan di layer lokal.
- Google Maps dan YouTube embed berat diganti placeholder lokal.
- Endpoint RSVP, guestbook, attendance, counter viewer, inv-json, dan websocket diblok oleh service guard lokal.

## Build

```powershell
node src-flow\build-all.js
node src-flow\audit-build.js
```
