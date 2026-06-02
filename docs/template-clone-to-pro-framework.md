# Template Clone to Pro Framework

Dokumen ini mencatat metode kerja dari proses clone template sampai menjadi template lokal siap pakai. Versi ini disusun dari pekerjaan template `wedding-premium050` dan pelajaran dari template clone sebelumnya.

Tujuan utama metode ini:

- Template bisa jalan lokal tanpa service luar berat.
- Asset lengkap, stabil, dan tidak broken.
- Interaksi penting tetap hidup: cover, audio, auto-scroll, tombol floating, navigasi, animasi.
- Hasil bisa disimpan sebagai template final atau staging tanpa merusak template lama.
- Template siap dimasukkan ke builder/registry hanya setelah disetujui.

## Prinsip Kerja

1. Jangan langsung mengubah template lama.
   Selalu kerja di folder clone baru, lalu salin ke folder final setelah lolos audit.

2. Jangan bergantung ke remote runtime.
   Semua CSS, JS, gambar, font, audio, ornament, dan vendor penting harus dilokalkan.

3. Jangan gabungkan ke registry sebelum diminta.
   Registry aplikasi hanya diubah kalau template sudah disetujui untuk tampil di builder/dashboard.

4. Pertahankan perilaku inti.
   Clone dianggap selesai bukan hanya kalau tampilannya muncul, tetapi kalau tombol buka undangan, musik, auto-scroll, animasi, dan tombol floating bekerja.

5. Patch lokal harus repeatable.
   Setiap fix penting harus masuk ke `src-flow/build-all.js` dan hasil akhirnya tersalin ke:

   ```text
   D:\UNDANGAN\clones\<nama-template>-rebuild-flow
   D:\UNDANGAN\template\<id-template>
   D:\UNDANGAN\apps\web\public\template-assets\<id-template>
   ```

## Struktur Folder Standar

Contoh untuk template `050`:

```text
D:\UNDANGAN\
  clones\
    wedding-premium050-rebuild-flow\
      original.html
      index.html
      FLOW.md
      asset-map.json
      assets\
        audio\
        css\
        fonts\
        images\
        js\
        ornaments\
      src-flow\
        build-all.js
        audit-build.js

  template\
    050\

  apps\
    web\
      public\
        template-assets\
          050\
```

## Fase 1 - Intake dan Keputusan Awal

Input minimal:

- URL referensi template.
- Nama/id template target.
- Apakah langsung masuk registry atau staging dulu.

Keputusan yang harus dicatat:

- `source_url`: URL preview yang diberikan user.
- `direct_html_url`: URL HTML langsung jika berbeda dari preview.
- `template_id`: misalnya `050`.
- `workdir`: folder kerja clone.
- `final_dir`: folder template final.
- `public_dir`: folder preview aplikasi.
- `registry_status`: `staging` atau `registered`.

Contoh template `050`:

```text
source_url      = https://share.linkundangan.com/inv-preview/wedding-premium050?to=Tamu+Undangan
direct_html_url = https://share.linkundangan.com/invcode/wedding-premium050?to=Tamu+Undangan
template_id     = 050
workdir         = D:\UNDANGAN\clones\wedding-premium050-rebuild-flow
final_dir       = D:\UNDANGAN\template\050
public_dir      = D:\UNDANGAN\apps\web\public\template-assets\050
registry_status = staging
```

## Fase 2 - Clone dan Simpan Sumber

Langkah:

1. Ambil HTML sumber dari URL langsung.
2. Simpan HTML mentah sebagai `original.html`.
3. Jangan pakai `original.html` sebagai output akhir.
4. Buat `index.html` hasil rebuild dari proses build.
5. Buat `FLOW.md` lokal untuk catatan template tersebut.

Checklist:

- [ ] `original.html` tersimpan.
- [ ] URL sumber dicatat di `FLOW.md`.
- [ ] Folder `assets` dan `src-flow` dibuat.
- [ ] `build-all.js` dan `audit-build.js` tersedia.

## Fase 3 - Lokalkan Asset

Asset yang wajib diproses:

- CSS.
- JavaScript.
- Font.
- Gambar.
- Ornament.
- Audio.
- Icon/vendor lokal yang dipakai template.

Aturan path:

```html
./assets/images/...
./assets/ornaments/...
./assets/audio/...
./assets/css/...
./assets/js/...
./assets/fonts/...
```

Output audit minimal:

```text
Asset refs: <jumlah>
Missing refs: 0
Remote scripts: 0
Remote css: 0
Remote iframes: 0
Heavy services: 0
```

Untuk template `050`, audit terakhir:

```text
Asset refs: 96
Missing refs: 0
Remote scripts: 0
Remote css: 0
Remote iframes: 0
Heavy services: 0
```

## Fase 4 - Matikan Service Berat dan Remote

Service yang harus dimatikan atau distub:

- Google Tag Manager/Analytics.
- Cloudflare challenge/turnstile.
- Sentry/beacon eksternal jika tidak perlu untuk lokal.
- YouTube embed berat.
- Iframe berat selain Google Maps embed lokasi.
- Instagram embed.
- Websocket/realtime remote.
- Submit form remote.
- Counter/viewer remote.
- Guestbook/reservation remote.
- Animasi gelas kopi/coffee loader bawaan (`coffee.css`, `.coffee`, `.plate`) jika muncul, karena terasa seperti widget vendor dan mengganggu rasa premium undangan.

Metode:

- Gunakan `local-stubs.js` untuk menahan library/service yang dibutuhkan agar tidak error.
- Gunakan `local-overrides.js` untuk mematikan submit form dan interaksi remote.
- Untuk form demo, tampilkan pesan lokal seperti `Mode lokal: pengiriman data dimatikan.`
- Google Maps embed lokasi tetap dipertahankan, pakai `loading="lazy"` dan `referrerpolicy` agar tidak memblokir render awal.
- Hapus link `coffee.css` dan markup `.coffee`/`.plate` di `build-all.js`, bukan hanya di `index.html`, supaya hasil rebuild tetap bersih.

Checklist:

- [ ] Tidak ada script remote penting yang masih aktif.
- [ ] Form tidak mengirim data keluar.
- [ ] Halaman tidak error ketika service remote gagal.
- [ ] Embed berat diganti placeholder/stub jika perlu.

## Fase 5 - Anti-Clone dan Proteksi Runtime

Beberapa template bisa menimpa body dengan pesan proteksi seperti:

```text
:( Dilarang Cloning Template Linkundangan.com
```

Metode fix:

1. Jangan hapus konten utama.
2. Simpan node penting sebelum runtime proteksi berjalan.
3. Patch jQuery/body overwrite jika ada script yang mencoba mengganti isi body.
4. Restore node penting setelah DOM siap dan setelah load.
5. Hapus blok proteksi dari DOM.

Node penting yang umum harus dipertahankan:

```text
#coverModal
.class-crush
.backsound
#fixed-btn2top
#fixed-btnread
```

Checklist:

- [ ] Pesan anti-clone tidak muncul.
- [ ] Cover masih tampil sebelum dibuka.
- [ ] Konten utama tetap ada setelah halaman load.
- [ ] Tombol floating tidak hilang.
- [ ] Tidak ada body kosong.

## Fase 6 - Interaksi Wajib Template Undangan

Interaksi yang harus dicek setelah clone:

1. Tombol `Buka Undangan`.
   Harus menutup cover/modal dan membuka halaman utama.

2. Audio.
   Tombol audio harus terlihat, bisa toggle on/off, dan state icon berubah.

3. Auto-scroll.
   Setelah user klik `Buka Undangan`, tombol `Read` harus otomatis aktif dan halaman mulai scroll.

4. Tombol `Top`.
   Harus mengembalikan halaman ke atas.

5. Tombol `Read`.
   Harus bisa start/stop auto-scroll.

6. Animasi.
   AOS/class animasi utama tetap jalan.

7. Form demo.
   Tidak submit ke remote dan tidak memecah layout.

Fix khusus template `050`:

- `.backsound` ikut dipreserve agar tombol audio tidak hilang.
- Klik `Buka Undangan` diproses di capture phase agar tidak kalah dari handler bawaan.
- Cover dipaksa hilang dengan `display:none !important` setelah undangan dibuka.
- Tombol `Read` diklik otomatis setelah pembukaan undangan.
- Tombol audio dipasang di antara `Top` dan `Read`.
- Handler audio dibuat capture-first agar toggle musik tidak kalah dari script bawaan.

Checklist:

- [ ] Sebelum dibuka: cover terlihat.
- [ ] Setelah klik buka: cover hilang.
- [ ] Setelah klik buka: tombol audio terlihat.
- [ ] Setelah klik buka: tombol `Read` aktif.
- [ ] Setelah 2-4 detik: `scrollY` bertambah.
- [ ] Tombol audio bisa berubah state `play` dan non-`play`.
- [ ] Tombol floating tidak menutupi konten penting.

## Fase 7 - Rebuild, Salin, dan Sinkronisasi

Urutan rebuild:

```powershell
cd D:\UNDANGAN\clones\<nama-template>-rebuild-flow
node src-flow\build-all.js
node src-flow\audit-build.js
```

Setelah lolos audit, salin ke:

```text
D:\UNDANGAN\template\<id-template>
D:\UNDANGAN\apps\web\public\template-assets\<id-template>
```

Jika ada patch manual setelah build, patch harus disinkronkan ke:

```text
clones\<nama-template>-rebuild-flow\src-flow\build-all.js
clones\<nama-template>-rebuild-flow\assets\js\local-overrides.js
template\<id-template>\assets\js\local-overrides.js
apps\web\public\template-assets\<id-template>\assets\js\local-overrides.js
```

Checklist:

- [ ] Patch masuk ke generator `build-all.js`.
- [ ] Patch masuk ke clone output.
- [ ] Patch masuk ke `template`.
- [ ] Patch masuk ke `public`.
- [ ] `node --check` sukses untuk JS override.
- [ ] Audit sukses di folder final.

## Fase 8 - Preview dan Browser Verification

URL preview langsung:

```text
http://127.0.0.1:5173/template-assets/<id-template>/index.html?to=Tamu+Undangan
```

Jika sudah masuk registry aplikasi:

```text
http://127.0.0.1:5173/preview/template-<id-template>
```

Untuk template staging yang belum masuk registry, cukup pakai direct URL.

Checklist browser:

- [ ] Halaman load.
- [ ] Cover tampil.
- [ ] Tombol `Buka Undangan` ada.
- [ ] Klik buka undangan berhasil.
- [ ] Tidak ada anti-clone block.
- [ ] Tombol audio terlihat.
- [ ] Tombol audio bisa toggle.
- [ ] Auto-scroll aktif otomatis setelah buka.
- [ ] Tombol `Read` aktif.
- [ ] `scrollY` naik setelah beberapa detik.
- [ ] Layout mobile/desktop tidak pecah.

## Fase 9 - Keputusan Masuk Registry

Status `staging`:

- Template sudah ada di `template\<id>` dan `public\template-assets\<id>`.
- Bisa dibuka lewat direct URL.
- Belum muncul di builder/dashboard.
- Aman dipakai untuk review user.

Status `registered`:

- Template sudah masuk registry aplikasi.
- Muncul di dashboard/builder.
- Butuh thumbnail, metadata, slug, dan route preview.

Aturan:

- Kalau user bilang `jangan digabung dulu`, jangan ubah registry.
- Kalau user bilang `tambahkan ke template` atau `masukkan ke builder`, baru register.
- Kalau ragu, simpan sebagai staging dulu.

## Fase 10 - Upgrade ke Clean Pro Stack

Fase ini dipakai kalau template clone sudah mandiri, tetapi kode bawaan masih berat, obfuscated, atau terlalu banyak vendor. Output fase ini adalah template baru, bukan menimpa template clone lama.

Rekomendasi stack untuk public invitation:

```text
Vite + TypeScript + CSS native + static output
```

Alasan:

- Public invitation lebih cocok static HTML daripada React penuh.
- JS bisa sangat kecil karena hanya berisi interaksi inti.
- CSS bisa ditulis sendiri tanpa Bootstrap/jQuery/AOS.
- Asset tetap lokal dan output tetap bisa disalin ke `template-assets`.
- Cocok untuk target performa tinggi.

Struktur contoh:

```text
D:\UNDANGAN\
  clones\
    wedding-premium050-pro-clean\
      index.html
      package.json
      vite.config.ts
      tsconfig.json
      src\
        main.ts
        styles.css
      public\
        assets\
          audio\
          fonts\
          images\
          ornaments\
      scripts\
        audit-build.js
      dist\

  template\
    050-pro\

  apps\web\public\template-assets\
    050-pro\
```

Yang dipindahkan dari clone lama:

- Foto utama.
- Foto mempelai.
- Foto galeri.
- Ornament pilihan yang ringan.
- Audio lokal.
- Font lokal secukupnya.

Yang ditulis ulang:

- Cover/open invitation.
- Audio controller.
- Auto-scroll per section.
- Countdown.
- Reveal animation.
- Gallery lightbox.
- RSVP demo/local.
- Floating buttons.
- Bottom navigation.

Yang dibuang:

- jQuery.
- Bootstrap runtime.
- AOS.
- PhotoSwipe.
- Script obfuscated.
- Analytics/tracking.
- Service remote.
- Anti-clone patch runtime, karena template baru tidak membawa proteksi bawaan.

Checklist pro stack:

```text
[ ] Buat folder baru <id>-pro atau <slug>-pro-clean
[ ] Copy hanya asset yang dipakai
[ ] Tulis HTML semantic baru
[ ] Tulis CSS native baru
[ ] Tulis TypeScript interaksi inti
[ ] Build dengan Vite
[ ] Audit missing asset dan remote refs
[ ] Salin dist ke template\<id>-pro
[ ] Salin dist ke public\template-assets\<id>-pro
[ ] Browser verify cover, audio, auto-scroll, gallery, RSVP
[ ] Jangan register sebelum user setuju
```

Target ukuran output pro:

```text
HTML < 20 KB
CSS  < 20 KB
JS   < 10 KB gzip kecil
Remote refs 0
Missing refs 0
Audio lazy-load setelah klik buka undangan
```

## Template 050 - Catatan Proses Nyata

Ringkasan dari clone sampai kondisi sekarang:

1. User memberi URL:

   ```text
   https://share.linkundangan.com/inv-preview/wedding-premium050?to=Tamu+Undangan
   ```

2. HTML langsung diambil dari:

   ```text
   https://share.linkundangan.com/invcode/wedding-premium050?to=Tamu+Undangan
   ```

3. Folder kerja dibuat:

   ```text
   D:\UNDANGAN\clones\wedding-premium050-rebuild-flow
   ```

4. Hasil final/staging disimpan ke:

   ```text
   D:\UNDANGAN\template\050
   D:\UNDANGAN\apps\web\public\template-assets\050
   ```

5. Asset dilokalkan:

   - CSS.
   - JS.
   - Gambar.
   - Ornament.
   - Audio `background-music.mp3`.
   - Stub lokal.

6. Service berat dimatikan:

   - Tracking/analytics.
   - Embed/service remote.
   - Submit form remote.
   - Request remote yang tidak perlu untuk preview lokal.

7. Template sempat disiapkan untuk registry, lalu user meminta jangan digabung dulu.
   Status akhir: staging/direct preview.

8. Proteksi anti-clone muncul.
   Fix dilakukan dengan preserve node penting, patch body overwrite, dan restore konten.

9. Tombol audio sempat hilang karena node `.backsound` belum ikut dipreserve.
   Fix: `.backsound` ditambahkan ke daftar node yang harus dipertahankan.

10. Auto-scroll harus mulai otomatis setelah `Buka Undangan`.
    Fix: tombol `#button-mode-read` dipicu otomatis setelah cover ditutup.

11. Tombol audio harus berada di tengah antara `Top` dan `Read`.
    Hasil browser verification menunjukkan:

    ```text
    Top    y sekitar 377
    Audio  y sekitar 444
    Read   y sekitar 501
    ```

12. Tombol audio harus bisa toggle.
    Fix: handler audio dibuat capture-first agar klik audio tidak kalah dari script bawaan.

13. Audit akhir:

    ```text
    Asset refs: 96
    Missing refs: 0
    Remote scripts: 0
    Remote css: 0
    Remote iframes: 0, di luar Google Maps embed lokasi yang memang diizinkan
    Heavy services: 0
    ```

14. Direct preview saat ini:

    ```text
    http://127.0.0.1:5173/template-assets/wedding-premium050-original/index.html?to=Tamu+Undangan
    ```

## Definition of Done

Template clone dianggap selesai jika:

- [ ] Folder clone ada dan punya `FLOW.md`.
- [ ] `original.html` tersimpan.
- [ ] `index.html` final ada.
- [ ] Semua asset lokal.
- [ ] `audit-build.js` menunjukkan missing `0`.
- [ ] Remote script/css/iframe berat `0`, kecuali Google Maps embed lokasi.
- [ ] Anti-clone tidak muncul.
- [ ] Cover dan tombol buka berjalan.
- [ ] Audio terlihat dan bisa toggle.
- [ ] Auto-scroll otomatis aktif setelah buka undangan.
- [ ] Tombol floating rapi.
- [ ] Form remote dimatikan.
- [ ] Browser verification sudah dilakukan.
- [ ] Status registry jelas: staging atau registered.

## Template Checklist Cepat untuk Clone Berikutnya

Gunakan checklist ini setiap clone template baru:

```text
[ ] Tentukan id template
[ ] Buat folder clones\<slug>-rebuild-flow
[ ] Simpan original.html
[ ] Buat src-flow/build-all.js
[ ] Buat src-flow/audit-build.js
[ ] Lokalkan semua asset
[ ] Inject local-stubs.js
[ ] Inject local-overrides.js
[ ] Matikan remote services
[ ] Hapus animasi gelas kopi/coffee loader jika ada
[ ] Patch anti-clone jika muncul
[ ] Preserve cover, content, audio, top/read buttons
[ ] Pastikan Buka Undangan berfungsi
[ ] Pastikan audio muncul dan toggle
[ ] Pastikan auto-scroll aktif setelah buka
[ ] Jalankan node --check
[ ] Jalankan audit-build.js
[ ] Salin ke template\<id>
[ ] Salin ke public\template-assets\<id>
[ ] Buka direct preview
[ ] Screenshot/cek browser
[ ] Putuskan staging atau registered
```
