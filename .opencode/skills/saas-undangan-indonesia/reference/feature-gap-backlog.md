# Feature Gap & Backlog — linkundang.web.id

Peta status fitur proyek terhadap standar pasar SaaS undangan Indonesia.
Legenda: ✅ Ada & tersambung · 🟡 Sebagian / kode ada tapi belum live · ❌ Belum ada.

Dibuat dari inspeksi kode (`apps/api/cmd/api`, `apps/web/src`) + `docs/SAAS_APP_AUDIT_2026-06-02.md`
dan `docs/SAAS_GAP_AUDIT_2026-05-30.md`. Update saat fitur selesai.

---

## Catatan verifikasi 2026-10-15

Backlog ini diverifikasi ulang dengan membaca kode langsung (`migrations.go`, `app.go`,
`models.go`, `tiers.go`, `rsvps.go`, `guests.go`, `payments_midtrans.go`, `App.tsx`).
Koreksi penting terhadap status lama:

- **Enum RSVP SUDAH konsisten**: backend menerima `attending`/`declined`/`pending`
  (`rsvps.go`), frontend mengirim nilai yang sama. Tidak ada lagi `maybe`/`not_attending`.
- **Guest management SUDAH real**: tabel `guests` + CRUD + import/export CSV ada (`guests.go`).
- **Tabel baru sudah ada di `migrations.go`**: `guests`, `media_assets`, `custom_domains`,
  `vouchers`, `app_settings`, `auth_tokens`. Banyak fitur "❌" hanya kurang **UI/wiring**, bukan skema.
- **Verifikasi email + reset password SUDAH ada** (`auth_tokens.go`, `auth.go`).
- **Public RSVP list SUDAH diproteksi** owner/admin (`rsvps.go`).
- **Sumber masalah utama** bukan fitur backend, melainkan **frontend monolitik**
  (`App.tsx` 5.975 baris) dan kode mockup yang belum dipisah.

Rencana kerja per fitur kini dipetakan ke Work Package di `PRD.md` (root) bagian 7,
dan fase di `reference/roadmap.md`. Sebelum mengerjakan, ambil salah satu WP di sana.


---

## 1. Public Invitation

| Fitur | Status | Catatan |
|-------|--------|---------|
| Cover/splash + nama tamu personal (?to=) | 🟡 | Route dasar ada, personalisasi belum final |
| Countdown, detail acara | ✅ | |
| Multi-acara (akad/resepsi/ngunduh mantu, >2 acara) | ❌ | Pasar mendukung s/d 10 acara |
| Google Maps embed | 🟡 | Masih placeholder di render generik |
| Save to Google Calendar | ❌ | Standar di undangandigital.io |
| Dresscode | ❌ | Sering diminta |
| Quotes/ayat | 🟡 | |
| Love story timeline | 🟡 | |
| Galeri foto/video | 🟡 | Render per-template belum penuh |
| Background music | 🟡 | Simpan pilihan, belum selalu main |
| Video pembuka | ❌ | Fitur paket premium pesaing |
| Live streaming embed (YouTube/IG/Zoom) | ❌ | Hampir universal |
| Amplop digital / wedding gift | 🟡 | Ada UI, belum lengkap |
| Gift wishlist | ❌ | Wevitation, Wedly |
| RSVP + ucapan/buku tamu | ✅ | Ada mismatch enum (lihat §13) |
| Watermark per tier | ✅ | |
| Render engine per-template premium | 🟡 | Halaman publik `/u/{slug}` render template premium asli via iframe `srcDoc` + engine substitusi nama/judul/tanggal/venue per-template (`templateTokens` di `templateEngine.ts`). Nama tamu via shim `URLSearchParams` (`?to=`). RSVP lewat modal melayang, watermark overlay, fallback ke clone bila gagal. Aset 12 template di-mount `~/linkundang/template` → `/template-assets` (compose bind mount). **Countdown ter-hook**: engine meng-inline `main.js`/`clean-runtime.js` ke dalam HTML lalu menulis ulang `new Date("<ISO+07:00>")` dari `countdownTarget`; template 042/074 literal tanggal sudah di-inline di HTML (`new Date('May 31...')`). Belum: adat-jawa katsudoto/optimized (tanggal dari runtime dinamis, bukan literal). |
| Dynamic OG / SSR meta | ✅ | `apps/api/cmd/api/og_page.go` (`GET /u/{slug}`) inject meta per-undangan (title/description/og:image/twitter). Proxy nginx `location ^~ /u/`. `og:image` fallback SVG belum dirender WhatsApp (butuh raster). |

## 2. Guest Management (Tamu)

| Fitur | Status | Catatan |
|-------|--------|---------|
| CRUD tamu | ✅ | `guests.go` |
| Import/export CSV | ✅ | `guests.go` |
| Link personal tiap tamu | 🟡 | Belum konsisten dipakai di semua template |
| Tracking dibuka per tamu | ❌ | Diferensiasi Suratan |
| Status RSVP per tamu | 🟡 | |
| Grup / segmen tamu | ❌ | |
| Blast WhatsApp | ❌ | Ada container `wa-gateway`, belum diintegrasikan |
| Blast email | ❌ | Email transaksional ada, blast belum |
| Meja / seating + denah | ❌ | InviteAnywhere |
| Kode souvenir anti-double-redeem | ❌ | InviteAnywhere |
| Nomor angpao otomatis | ❌ | InviteAnywhere |
| QR check-in + layar sapa (guest on screen) | ❌ | **Prioritas tinggi**, jadi standar 2026 |

## 3. Builder / Editor

| Fitur | Status | Catatan |
|-------|--------|---------|
| Edit dasar (nama, tanggal, status) | ✅ | |
| Section-based editor lengkap | ❌ | **Prioritas tinggi** |
| Schema-driven form dari `config_schema` | ❌ | |
| Drag & drop section | ❌ | Akuakad |
| Realtime preview | 🟡 | |
| Ganti tema / warna / font | 🟡 | |
| Duplicate / delete / trash / restore | ❌ | |
| Validasi slug availability | ❌ | |
| Multi-bahasa (ID/EN) | ❌ | |

## 4. Template

| Fitur | Status | Catatan |
|-------|--------|---------|
| Registry template (DB + TS) | 🟡 | Masih hardcoded di `templateEngine.ts` |
| Katalog publik + kategori | ✅ | |
| Akses per-tier | ✅ | |
| Admin upload/manage template (ZIP, thumbnail) | ❌ | |
| Standar folder template (`template.json`, FLOW.md) | 🟡 | Sebagian sudah ada |
| Versioning template | ❌ | |

## 5. Media

| Fitur | Status | Catatan |
|-------|--------|---------|
| Upload gambar/audio | ✅ | `uploads.go` |
| Media library / pilih ulang aset | ❌ | |
| Crop/resize, thumbnail | ❌ | |
| Optimasi WebP/AVIF | ❌ | |
| Audio/music library | ❌ | |
| Ornamen/sticker library | ❌ | |
| Object storage (S3-compatible) | ❌ | Masih file lokal VPS |

## 6. Monetisasi

| Fitur | Status | Catatan |
|-------|--------|---------|
| Tier & feature gating | ✅ | `tiers.go` |
| Checkout / order | 🟡 | `payments_midtrans.go` ada, key kosong (isEnabled=false) |
| Midtrans webhook | 🟡 | Kode ada, belum aktif |
| Xendit | ❌ | Enum provider sudah di skema |
| QRIS | ❌ | |
| Voucher / promo | ❌ | UI ada, backend belum |
| Invoice user | ❌ | |
| Refund / cancel / manual payment admin | ❌ | |
| Renewal / cron expiry downgrade | 🟡 | Grace period ada, cron belum |
| Reseller / affiliate program | ❌ | UI ada, backend belum |
| Add-on (wedding planner, WA credit, custom domain) | ❌ | |
| Custom domain publish flow | 🟡 | `domains.go` ada, flow UI belum tuntas |

## 7. Analytics

| Fitur | Status | Catatan |
|-------|--------|---------|
| Event tracking endpoint | ✅ | `events.go` |
| Track dari frontend (page view/share/publish) | 🟡 | Belum semua event dikirim |
| Dashboard analytics per undangan | ❌ | |
| Realtime visitor (SSE/WebSocket) | ❌ | UI "Realtime Visitor" masih mock |
| Sumber traffic & konversi | ❌ | |
| Statistik RSVP/ucapan | 🟡 | |
| KPI & report admin | ❌ | |
| Ekspor PDF | ❌ | |

## 8. Komunikasi

| Fitur | Status | Catatan |
|-------|--------|---------|
| Email transaksional (Resend) | ✅ | Welcome + publish (`email.go`) |
| Verifikasi email | ❌ | |
| Reset password via email | ❌ | |
| Notifikasi RSVP ke owner | ❌ | |
| WhatsApp Gateway blast | ❌ | Container `wa-gateway` ada |
| Push notification | ❌ | |
| Aplikasi mobile (owner/guestbook) | ❌ | Wedew punya 2 app |

## 9. Admin / Ops

| Fitur | Status | Catatan |
|-------|--------|---------|
| Admin user CRUD | ✅ | `admin_users.go` |
| Admin order/transaksi | ❌ | |
| Admin template manager | ❌ | |
| Admin media manager | ❌ | |
| Admin voucher | ❌ | |
| Admin report/analytics | ❌ | |
| Audit log | ❌ | |
| Setting tersimpan DB | ❌ | |
| Monitoring error + log viewer | ❌ | |
| Backup/restore rutin | ❌ | |
| Cron (expiry, cleanup upload orphan) | ❌ | |

## 10. Security / Compliance

| Fitur | Status | Catatan |
|-------|--------|---------|
| Rate limit | ✅ | `rate_limit.go` (RSVP/event/upload/AI) |
| CAPTCHA/honeypot public RSVP | ❌ | |
| Validasi MIME upload | 🟡 | |
| Limit storage per-tier | ❌ | |
| Session revocation/logout server-side | ❌ | |
| CORS produksi ketat | 🟡 | |
| T&C / Privacy / Refund policy | ❌ | |
| Ekspor/hapus data (UU PDP) | ❌ | |
| Proteksi route `/admin` + `RequireAdmin` | 🟡 | Backend ada, guard frontend belum tegas |

## 11. Platform / SEO

| Fitur | Status | Catatan |
|-------|--------|---------|
| sitemap.xml + robots.txt | ✅ | `sitemap.go` |
| Blog / konten SEO | ❌ | Pesaing punya blog |
| Halaman legal | ❌ | |
| Test suite backend/frontend | ❌ | |
| CI/CD GitHub Actions | ❌ | |

---

## Backlog Prioritas

### P0 — Wajib sebelum dipakai user beneran
1. Selesaikan **publish flow final** + guard route `/admin` di frontend. ✅ (guard `/admin` ada)
2. **Render engine per-template premium** (bukan layout generik) + data `config` JSON terpetakan penuh. ✅ (iframe + engine substitusi + hook countdown; sisa: katsudoto/optimized)
3. **Section-based editor lengkap** (multi-acara, love story, galeri, maps, audio, gift, ucapan) + schema-driven form. ✅ (6 seksi schema-driven)
4. Perbaiki **enum status RSVP** frontend/backend (`hadir`/`tidak hadir`/`ragu`). ⏳ (pakai `attending`/`declined`)
5. **Proteksi data RSVP** (owner-only) + hilangkan fallback demo untuk slug tak valid. ✅ (guard + 404 not-found)
6. **Verifikasi email + reset password**. ✅ (`auth_tokens.go`)
7. **Dynamic OG/SSR** untuk link share WhatsApp. ✅ (`og_page.go`)

### P1 — Monetisasi & operasional (agar bisa dijual)
1. Aktifkan **Midtrans** (isi key) + webhook + upgrade tier otomatis + invoice.
2. **Voucher/promo** backend + apply saat checkout.
3. **Analytics dashboard** real + event tracking frontend + realtime visitor.
4. **Guest management lanjutan**: link personal, tracking dibuka, blast WhatsApp (integrasikan `wa-gateway`).
5. **Media manager** + optimasi WebP.
6. **Admin panel real**: order, template, media, voucher, report, audit log.
7. **T&C / Privacy / Refund** + cron expiry & cleanup.

### P2 — Diferensiasi & hari-H (keunggulan kompetitif)
1. **QR check-in + layar sapa (guest on screen)**.
2. **Meja/seating + kode souvenir + nomor angpao**.
3. **Amplop digital QRIS + dompet digital pengantin / gift wishlist**.
4. **Reseller/affiliate + white-label** (peluang B2B).
5. **Live streaming embed + video pembuka + Google Calendar + dresscode**.
6. **Multi-bahasa**.
7. **Wedding planner add-on** + AI asset generator (sudah ada, tinggal dipromosikan).

### P3 — Skala & kualitas
1. Pindahkan registry template dari TS ke API/tabel penuh + admin upload ZIP.
2. Object storage S3-compatible, image pipeline (WebP/AVIF + responsive).
3. Blog/konten SEO + halaman legal.
4. Test suite (auth, CRUD undangan, RSVP limit, tier gate) + CI/CD.
5. Monitoring error, backup/restore, load testing.

---

## Bug / ketidakkonsistenan yang sudah teridentifikasi

- Enum RSVP frontend (`maybe`, `not_attending`) ≠ backend (`attending`, `declined`, `pending`).
- Public RSVP list dulu belum diproteksi owner/admin.
- Public invitation fallback ke data demo → slug invalid tampak valid.
- `/admin` belum auth-guard tegas di frontend.
- Music disimpan tapi belum selalu diputar di render publik.
- Beberapa copy masih brand lama (`CintaBuku`/`Undanganku`) — perlu konsisten `LinkUndang`.
