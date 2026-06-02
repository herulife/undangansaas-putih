# Flow Builder Undangan Dan Rencana SaaS

Dokumen ini dibuat dari referensi screenshot di `D:\UNDANGAN\mokap` dan `D:\UNDANGAN\mokap\builder`.

## Ringkasan Temuan

Folder `mokap` berisi referensi dashboard SaaS undangan digital. Folder `mokap\builder` berisi flow pembuatan undangan dari awal sampai undangan tersimpan di daftar user.

Secara konsep, sistem ini bukan page builder bebas seperti Elementor. Flow-nya lebih dekat ke template builder: user memilih kategori acara, memilih template atau preset desain, mengisi data undangan melalui form panjang, memilih media/ornamen, mengatur fitur, lalu sistem menerbitkan undangan ke link publik.

## Flow Utama Builder

1. User masuk ke dashboard.
2. User klik `Buat Undangan Baru`.
3. User memilih kategori acara:
   - Pernikahan Umum
   - Pernikahan Syar'i
   - Khitanan
   - Aqiqah
   - Umum
   - Ulang Tahun
   - Sweet17
   - Ultah Pernikahan
   - Tunangan
   - Anniversary
4. Sistem menampilkan pilihan template sesuai kategori.
5. User bisa memfilter template:
   - Terbaru
   - Populer
   - Versi Premium
   - Versi Gratis
6. User bisa mencari template berdasarkan kode atau nama.
7. Pada setiap template tersedia tombol:
   - `Contoh` untuk melihat preview.
   - `Gunakan` untuk memilih template.
8. Jika template tidak cocok, user bisa memilih jalur `Buat Desain Undangan Sendiri / Invitation Builder`.
9. Setelah template dipilih, user masuk ke form input data awal:
   - Judul undangan.
   - Opsi tampilkan undangan di katalog publik.
   - URL/link undangan.
10. User lanjut ke halaman edit konten.
11. User mengisi data utama undangan:
   - Foto cover / thumbnail.
   - Salam pembuka.
   - Teks pembuka.
   - Data mempelai wanita.
   - Data mempelai pria.
   - Keluarga / keterangan tambahan.
   - Teks penutup.
   - Data acara utama.
   - Lokasi acara.
   - Map / titik koordinat.
   - Acara berikutnya jika ada.
   - Catatan acara.
   - Kisah cinta.
   - Harapan / doa.
   - Gallery.
   - Video YouTube.
   - Kirim angpao.
   - Kirim kado.
   - Lampiran lainnya via rich text editor.
12. Saat memilih gambar, user mendapat modal media:
   - Upload gambar lokal.
   - Drag and drop file.
   - Batas jumlah gambar untuk gratis/premium.
   - Tambah gambar dari URL eksternal.
   - Tab ornamen berisi stok ornament/ilustrasi.
   - Tombol `Salin URL` dan `Pilih`.
13. User lanjut ke halaman setting fitur:
   - Waktu mulai dan selesai acara.
   - Backsound.
   - Guest book scanner.
   - RSVP / reservation form.
   - Comment notification.
   - Ucapan / komentar.
   - Rangkuman kehadiran.
   - Popup banner.
   - Auto scroll / read mode.
   - Bahasa Indonesia / English.
   - Tampilkan di menu All Invity Premium.
   - Acara private.
   - Disable ganti tema.
   - Disable gunakan banyak tema.
   - Tampilkan katalog reseller.
14. User klik `Selesai`.
15. Sistem menyimpan undangan.
16. User kembali ke halaman `Undangan Online`.
17. Card undangan tampil dengan aksi:
   - Lihat Undangan.
   - Sebarkan Undangan.
   - Salin kode/link.
   - Ganti Template/Tema.
   - Setting.
   - Edit Konten.
   - Edit Judul.
   - Hapus.
   - Kustom Code.
18. Untuk premium, fitur tambahan muncul:
   - Quick Share.
   - Komentar.
   - Buku Tamu.
   - Reservation.
   - Buat tiket masuk acara private.
   - Fitur reseller / label reseller.

## Modul Yang Perlu Dibangun

### 1. Dashboard User

Dashboard menampilkan daftar undangan milik user, statistik jumlah undangan, status gratis/premium, filter, pencarian, dan tombol buat undangan baru.

Fitur minimum:
- List undangan.
- Search undangan.
- Filter status: all, free, premium, custom design, trash.
- Card undangan.
- Tombol aksi per undangan.

### 2. Template Catalog

Modul katalog template untuk memilih desain awal.

Data template perlu punya:
- Kode template, contoh `WEDDING-PREMIUM042`.
- Nama.
- Kategori acara.
- Status gratis/premium.
- Thumbnail.
- Preview URL.
- Folder template, contoh `template/wedding-premium042-wayang-batik`.
- Version.
- Status aktif/nonaktif.

### 3. Invitation Creation Wizard

Wizard membuat undangan baru.

Step minimum:
- Pilih kategori acara.
- Pilih template.
- Isi judul dan slug URL.
- Generate data invitation kosong.
- Masuk edit konten.

### 4. Content Editor

Ini modul paling penting. Editor tidak perlu drag and drop dulu. Gunakan form berbasis section supaya cepat stabil.

Section minimum:
- Cover.
- Salam pembuka.
- Mempelai.
- Acara.
- Maps.
- Story.
- Gallery.
- Video.
- Gift / angpao.
- Kado.
- Lampiran.

Data disimpan sebagai JSON terstruktur, lalu dirender ke template.

### 5. Media Manager

Media manager diperlukan untuk upload dan memilih asset.

Fitur minimum:
- Upload image.
- Preview image.
- Pilih gambar untuk field tertentu.
- Simpan URL/path lokal.
- Library ornamen.
- Library sticker.
- Batas jumlah gambar berdasarkan paket.

### 6. Feature Settings

Setting fitur undangan:
- Audio/backsound.
- RSVP.
- Buku tamu.
- Komentar.
- Auto scroll.
- Bahasa.
- Private event.
- Popup banner.
- Guest scanner.
- Katalog reseller.

### 7. Render Engine

Render engine mengambil:
- Template HTML/CSS/JS.
- Data undangan JSON.
- Asset lokal.
- Setting fitur.

Output:
- Preview lokal.
- Link publik.
- Static export jika diperlukan.

Untuk template seperti `042` dan `074`, pendekatan paling aman adalah mempertahankan template sebagai paket statis, lalu mengganti placeholder data memakai render engine.

### 8. Admin Template Manager

Admin perlu bisa mengelola template:
- Tambah template baru dari folder.
- Upload thumbnail.
- Atur kategori.
- Atur gratis/premium.
- Preview template.
- Aktif/nonaktif.

### 9. Billing Dan Paket

Paket awal:
- Free.
- Premium per undangan.
- Reseller/mitra.

Fitur yang dibatasi:
- Jumlah gambar.
- Ganti tema.
- RSVP.
- Buku tamu.
- Custom code.
- Private event.
- Label reseller.
- Masa aktif undangan.

## Struktur Data Awal

### Invitation

Field inti:
- `id`
- `user_id`
- `template_id`
- `title`
- `slug`
- `status`
- `plan`
- `category`
- `data_json`
- `settings_json`
- `created_at`
- `updated_at`
- `published_at`
- `expires_at`

### Template

Field inti:
- `id`
- `code`
- `name`
- `category`
- `plan`
- `folder`
- `thumbnail`
- `preview_url`
- `is_active`
- `created_at`
- `updated_at`

### Media

Field inti:
- `id`
- `user_id`
- `type`
- `path`
- `original_name`
- `mime`
- `size`
- `source`
- `created_at`

## Rencana Pengerjaan SaaS

### Tahap 1 - Fondasi Template Engine

Tujuan: template `042` dan `074` bisa dirender dari data JSON.

Pekerjaan:
- Rapikan kontrak data undangan.
- Tentukan placeholder untuk nama, tanggal, lokasi, foto, gallery, audio, rekening, dan teks.
- Buat renderer lokal.
- Buat preview URL lokal.
- Pastikan semua asset tetap lokal di folder template.

Hasil akhir:
- Satu file JSON bisa mengubah isi template tanpa edit HTML manual.

### Tahap 2 - Dashboard Undangan

Tujuan: user bisa melihat dan mengelola undangannya.

Pekerjaan:
- Buat halaman daftar undangan.
- Buat card undangan.
- Tambah tombol preview, edit, setting, delete.
- Tambah filter dan pencarian.

Hasil akhir:
- Dashboard mirip referensi `undanganku_list`.

### Tahap 3 - Wizard Buat Undangan

Tujuan: user bisa membuat undangan baru dari template.

Pekerjaan:
- Buat halaman pilih kategori.
- Buat katalog template.
- Buat form judul dan slug.
- Generate invitation record.

Hasil akhir:
- User bisa membuat undangan baru sampai masuk editor konten.

### Tahap 4 - Content Editor

Tujuan: user bisa mengedit isi undangan.

Pekerjaan:
- Buat form section per data.
- Buat simpan draft.
- Buat preview setelah simpan.
- Buat validasi field wajib.

Hasil akhir:
- Template bisa diedit dari dashboard tanpa menyentuh kode.

### Tahap 5 - Media Manager

Tujuan: user bisa upload dan memilih foto/ornamen.

Pekerjaan:
- Upload gambar.
- Library media user.
- Library ornamen/sticker global.
- Modal pilih gambar.
- Batas upload berdasarkan paket.

Hasil akhir:
- Flow modal media mirip screenshot builder.

### Tahap 6 - Feature Settings

Tujuan: fitur undangan bisa dinyalakan/dimatikan.

Pekerjaan:
- Setting audio.
- RSVP.
- Buku tamu.
- Komentar.
- Auto scroll.
- Private event.
- Bahasa.

Hasil akhir:
- Halaman setting mirip screenshot `Screenshot_9`.

### Tahap 7 - Publish Dan Public Link

Tujuan: undangan bisa diakses publik melalui slug.

Pekerjaan:
- Route publik `/u/{slug}` atau `/inv/{slug}`.
- Render template berdasarkan slug.
- Proteksi private event jika aktif.
- Tracking visitor.

Hasil akhir:
- Undangan siap dibagikan.

### Tahap 8 - Monetisasi

Tujuan: sistem bisa membedakan free dan premium.

Pekerjaan:
- Paket premium.
- Voucher.
- Transaction list.
- Masa aktif.
- Upgrade per undangan.

Hasil akhir:
- SaaS mulai punya alur bisnis.

## Rekomendasi Urutan Terdekat

Yang paling masuk akal dikerjakan sekarang:

1. Buat `template registry` untuk membaca template `042` dan `074`.
2. Buat `invitation data schema`.
3. Buat satu sample JSON untuk Alika dan Herman.
4. Buat renderer yang menghasilkan preview dari template `042`.
5. Setelah render berhasil, baru buat dashboard/wizard.

Alasan: kalau render engine belum stabil, dashboard dan builder hanya akan jadi tampilan tanpa mesin. Mesin utamanya adalah kemampuan mengubah isi template dari data.
