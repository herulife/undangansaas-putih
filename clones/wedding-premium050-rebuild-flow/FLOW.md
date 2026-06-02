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

## Catatan Fix Sampai Siap Review

- Template disimpan sebagai staging dan belum digabung ke registry aplikasi karena user meminta jangan digabung dulu.
- Proteksi anti-clone yang menampilkan `:( Dilarang Cloning Template Linkundangan.com` dinonaktifkan untuk mode lokal.
- Node penting dipreserve dan direstore agar runtime template tidak menghapus konten:
  - `#coverModal`
  - `.class-crush`
  - `.backsound`
  - `#fixed-btn2top`
  - `#fixed-btnread`
- Tombol `Buka Undangan` dibuat stabil dengan handler lokal di capture phase.
- Cover/modal dipaksa hilang setelah undangan dibuka.
- Tombol audio direstore dan tetap tampil di tengah antara tombol `Top` dan `Read`.
- Tombol audio bisa toggle state `play` dan non-`play`.
- Auto-scroll dibuat langsung aktif setelah user klik `Buka Undangan`.
- Tombol `Read` otomatis aktif setelah undangan dibuka.

Direct preview:

```text
http://127.0.0.1:5173/template-assets/050/index.html?to=Tamu+Undangan
```

Audit akhir:

```text
Asset refs: 96
Missing refs: 0
Remote scripts: 0
Remote css: 0
Remote iframes: 0
Heavy services: 0
```

Metode lengkap hasil pekerjaan ini dicatat di:

```text
D:\UNDANGAN\docs\template-clone-to-pro-framework.md
```
