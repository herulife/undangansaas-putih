# Clone Rebuild Flow Undangan

Dokumen ini mencatat urutan kerja yang dipakai sampai template `D:\UNDANGAN\template\074` jadi. Pakai flow ini untuk mengerjakan template lain dari link referensi.

Versi metode yang lebih lengkap, termasuk proses dari clone sampai template staging/siap registry, ada di:

```text
D:\UNDANGAN\docs\template-clone-to-pro-framework.md
```

## Tujuan

Membuat template lokal yang bisa jalan sendiri, rapi, ringan, dan tidak bergantung ke service luar yang berat.

## Struktur Folder

Contoh untuk template `074`:

```text
D:\UNDANGAN\
  clones\
    wedding-premium047-rebuild-flow\
  template\
    074\
```

Untuk template baru, buat folder kerja di:

```text
D:\UNDANGAN\clones\nama-template-rebuild-flow
```

Lalu hasil final disimpan ke:

```text
D:\UNDANGAN\template\nomor-template
```

## Urutan Kerja

1. Ambil link referensi.

   Contoh:

   ```text
   https://share.linkundangan.com/invcode/wedding-premium047
   ```

2. Clone halaman ke folder lokal.

   Simpan HTML awal sebagai bahan baca, bukan selalu sebagai hasil final.

3. Baca struktur clone.

   Pelajari:

   - `index.html`
   - CSS
   - JavaScript
   - gambar
   - ornament
   - audio
   - urutan section
   - nama class animasi
   - service luar yang dipanggil

4. Buat folder `rebuild-flow`.

   Contoh:

   ```text
   D:\UNDANGAN\clones\wedding-premium047-rebuild-flow
   ```

5. Buat struktur source.

   Minimal:

   ```text
   src-flow\
     partials\
     styles\
       partials\
     scripts\
       partials\
     build-all.js
     audit-build.js
   assets\
   index.html
   FLOW.md
   ```

6. Pecah HTML menjadi partial.

   Urutan section wajib dijaga:

   - cover modal
   - `#nav-cover`
   - `#nav-perihal`
   - `#nav-acara`
   - `#nav-cerita`
   - `#nav-galeri`
   - `#nav-tamu`
   - `#nav-lainnya`
   - navigation
   - script tail

7. Lokalkan asset.

   Masukkan ke:

   ```text
   assets\
     images\
     ornaments\
     audio\
     css\
     js\
   ```

   Ubah semua path agar memakai path lokal seperti:

   ```html
   ./assets/images/...
   ./assets/audio/...
   ./assets/css/...
   ./assets/js/...
   ```

8. Matikan service luar.

   Blok atau ganti service seperti:

   - guestbook remote
   - reservation remote
   - attendance remote
   - counter viewer
   - websocket
   - audio remote
   - iframe berat selain Google Maps embed
   - animasi gelas kopi/coffee loader bawaan (`coffee.css`, `.coffee`, `.plate`) jika muncul

   Google Maps embed lokasi jangan dimatikan; pertahankan iframe dengan `loading="lazy"`.
   Untuk form demo lokal, cukup cegah submit dan tampilkan pesan bahwa service dimatikan.

9. Pertahankan flow animasi.

   Jangan hapus class utama:

   ```text
   do-animate
   animate-start
   animate-init
   kekanan
   kekiri
   membesar
   muncul
   naik
   turun
   ```

10. Tulis ulang kode dengan rapi.

   Jangan hanya copy mentah kalau kode asli berat/obfuscated. Tulis ulang flow agar hasil visual dan interaksi tetap sama atau sesuai target.

11. Rebuild.

   Jalankan:

   ```powershell
   node src-flow\build-all.js
   node src-flow\audit-build.js
   ```

12. Preview lokal.

   Jalankan:

   ```powershell
   python -m http.server 5600 --bind 127.0.0.1
   ```

   Buka:

   ```text
   http://127.0.0.1:5600/
   ```

13. Cek visual.

   Periksa:

   - teks tidak ketutup shape
   - warna teks jelas
   - foto seirama
   - card rapi
   - tombol floating tidak menimpa konten
   - animasi tetap jalan
   - mobile dan desktop tidak overflow
   - tidak ada gambar broken
   - tidak ada error console penting

14. Fix, rebuild, cek lagi.

   Ulangi sampai rapi.

15. Simpan sebagai template final.

   Salin folder kerja final ke:

   ```text
   D:\UNDANGAN\template\nomor-template
   ```

## Checklist Audit Final

Sebelum dianggap selesai:

- [ ] `index.html` ada.
- [ ] `assets` lengkap.
- [ ] `src-flow` ada.
- [ ] `build-all.js` sukses.
- [ ] `audit-build.js` sukses.
- [ ] Tidak ada service luar yang berat.
- [ ] Tidak ada image broken.
- [ ] Tidak ada teks ketutup shape.
- [ ] Animasi utama masih aktif.
- [ ] Preview lokal bisa dibuka.
- [ ] Folder final sudah masuk `D:\UNDANGAN\template\...`.

## Catatan Penting

Kalau HTML hasil clone menampilkan proteksi anti-clone, jangan jadikan HTML itu sebagai output final. Pakai asset dan referensi visualnya saja, lalu rebuild ulang template lokal yang usable dengan flow di atas.
