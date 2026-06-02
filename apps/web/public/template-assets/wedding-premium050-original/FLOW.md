# Wedding Premium 050 Rebuild Flow

Sumber:

```text
https://share.linkundangan.com/inv-preview/wedding-premium050?to=Tamu+Undangan
```

HTML utama diambil dari:

```text
https://share.linkundangan.com/invcode/wedding-premium050?to=Tamu+Undangan
```

Output kerja:

```text
D:\UNDANGAN\clones\wedding-premium050-rebuild-flow
```

Output final:

```text
D:\UNDANGAN\template\050
D:\UNDANGAN\apps\web\public\template-assets\050
```

Catatan rebuild:

- `original.html` disimpan sebagai referensi.
- Asset CSS, JS, gambar, font, icon, audio, dan vendor dilokalkan ke `./assets`.
- Service berat seperti GTM, analytics, challenge script, iframe YouTube/Maps, dan submit form dimatikan untuk mode lokal.
- `local-stubs.js` menahan request remote yang bukan asset agar preview lokal tidak error.
- `local-overrides.js` mencegah form demo mengirim data keluar.

Perintah:

```powershell
node src-flow\build-all.js
node src-flow\audit-build.js
```
