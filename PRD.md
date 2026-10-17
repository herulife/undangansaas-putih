# PRD — LinkUndang (SaaS Undangan Digital Indonesia)

- **Versi:** 2.0 (menggantikan `lovable/prd.txt` v1.0 yang bersifat mockup)
- **Tanggal:** 15 Oktober 2026
- **Status:** Aktif — siap dikerjakan paralel oleh beberapa agent
- **Produk:** `linkundang.web.id`
- **Dokumen terkait:** `.opencode/skills/saas-undangan-indonesia/` (SKILL + matriks kompetitor + backlog), `AGENTS.md`, `README.md`, `docs/SAAS_APP_AUDIT_2026-06-02.md`, `docs/SAAS_GAP_AUDIT_2026-05-30.md`

> **Cara pakai dokumen ini (WAJIB dibaca agent sebelum menulis kode):**
> 1. Baca bag. 3 (Arsitektur & Konvensi) dan bag. 8 (Aturan kolaborasi) supaya tidak bentrok file dengan agent lain.
> 2. Pilih **satu Work Package (WP)** dari bag. 7 yang statusnya belum selesai dan tidak sedang dikerjakan agent lain.
> 3. Kerjakan HANYA file yang tercantum di kolom **File**. Jangan mengedit file di luar kepemilikan WP.
> 4. Penuhi kriteria **Acceptance Criteria (AC)** dan **Definition of Done (bag. 9)** sebelum menandai WP selesai.
> 5. Perbarui status WP di bag. 7 (ubah `⬜` → `🟨` saat mulai, → `✅` saat selesai).

---

## 1. Ringkasan Produk

LinkUndang adalah platform SaaS undangan digital (pernikahan, khitanan, ulang tahun,
wisuda, anniversary, dan acara lain). Pengguna dapat membuat undangan sendiri
(self-service) atau meminta dibuatkan admin (concierge), lalu menyebarkan tautan
abadi ke tamu. Tamu dapat membuka undangan, RSVP, mengisi buku tamu, dan menitip
kado tanpa perlu login.

- **Value proposition:** buat undangan digital gratis, tanpa masa aktif, bisa diedit
  kapan saja, mudah disebar lewat tautan.
- **Model bisnis:** freemium (Free) + berbayar (Creator / Pro / Business), add-on,
  reseller/B2B, white-label.
- **Pembeda yang dibidik (2026):** manajemen tamu & operasional hari-H — tracking
  dibuka, blast WhatsApp, QR check-in + layar sapa, seating — plus AI asset generator
  dan program reseller/white-label. Lihat `reference/competitor-matrix.md`.

### Target pasar & harga acuan

| Segmen | Penawaran | Harga acuan pasar |
| --- | --- | --- |
| End user (self-service) | Free sampai Pro | Rp0 / Rp39k–Rp199k |
| End user (concierge/admin) | Custom design | Rp200k–Rp799k+ |
| Reseller / B2B / white-label | Kuota klien + komisi | Rp300k–Rp1.199k |

---

## 2. Persona & Alur Utama

- **Pemilik acara (owner):** daftar → pilih metode (buat sendiri / dibuatkan admin) →
  pilih template → isi data → preview → publish → bagikan → kelola tamu & RSVP.
- **Tamu (guest):** buka tautan (`/u/{slug}?to=Nama`) → lihat undangan → RSVP /
  ucapan / peta / kado / simpan kalender / bagikan.
- **Admin/operator:** kelola user, template, order/pembayaran, voucher, report,
  media, setting.
- **Reseller:** beli kuota klien, kelola klien, label/white-label.

Flow lengkap ada di `docs/flow-saas-link-undangan.md` dan
`BUILDER_FLOW_AND_SAAS_PLAN.md`.

---

## 3. Arsitektur & Konvensi Teknis

### 3.1 Stack

| Layer | Teknologi | Lokasi |
| --- | --- | --- |
| Web (SPA) | Vite + React + TypeScript | `apps/web` |
| API | Go + chi + pgx | `apps/api/cmd/api` |
| DB | PostgreSQL | `apps/api/migrations` + `migrations.go` |
| Template undangan | HTML/CSS/JS statis per folder | `template/` (bind mount → `/template-assets`) |
| Reverse proxy | Nginx | `apps/web/nginx.conf` |
| Orkestrasi | Docker Compose | `docker-compose.production.yml` |
| Email | Resend | `apps/api/cmd/api/email.go` |
| Gateway pembayaran | Midtrans Snap (manual transfer sebagai fallback) | `apps/api/cmd/api/payments_midtrans.go` |
| WhatsApp | container `wa-gateway` (belum diintegrasikan) | `~/wa-gateway` |

### 3.2 Skema DB (sudah ada di `migrations.go`)

`users`, `auth_tokens`, `templates`, `invitations`, `rsvps`, `payments`,
`vouchers`, `guests`, `media_assets`, `custom_domains`, `events`, `app_settings`.

Tier: `free` / `creator` / `pro` / `business`. Role: `user` / `admin` / `reseller` / `client`.
Status RSVP: `attending` / `declined` / `pending` (frontend & backend **sudah konsisten**).
Status invitation: `draft` / `published`.

### 3.3 Peta endpoint API (dari `app.go`)

Lihat `.opencode/skills/saas-undangan-indonesia/reference/` dan `apps/api/cmd/api/app.go`.
Kelompok: auth (+verify email, reset password), templates, invitations, rsvps,
guests (CRUD + import/export CSV), domains, uploads/media, ai/images, payments
(midtrans + webhook + manual admin), admin (users/payments/templates), events,
`/api/v1` me/features + publish + exports, `/u/{slug}` (SSR OG), sitemap.

### 3.4 Perintah kerja

```bash
# Web
cd apps/web && npm install && npm run dev      # dev server
cd apps/web && npm run build                   # build produksi (cek TS + Vite)

# API
cd apps/api && go build ./... && go test ./...  # build + test Go

# DB + stack produksi
cp .env.example .env.production
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build

# Health
curl http://linkundang-api:8088/api/health
```

### 3.5 Konvensi kode

- Istilah UI mengikuti glosarium skill: `undangan`, `tamu`, `ucapan`/`buku tamu`,
  `amplop digital`, `konfirmasi kehadiran`/RSVP, `paket`/`tier`, `voucher`,
  `reseller`, `custom domain`, `layar sapa`, `check-in QR`.
- Enum RSVP HARUS `attending` / `declined` / `pending` (jangan pakai `maybe`/`not_attending`).
- Jangan tambahkan komentar kode yang tidak perlu. Ikuti gaya file sekitarnya.
- Semua request frontend yang butuh auth WAJIB mengirim header `Authorization: Bearer <token>`.
- Tier gating dihormati di **backend** (`tiers.go`), bukan hanya UI.
- Brand konsisten **LinkUndang** (hapus sisa `CintaBuku` / `Undanganku` / `IndoInvite`).

### 3.6 Kondisi infrastruktur

`linkundang-api` sempat **crash-loop** karena password DB tidak cocok: container API
terbuat dengan `DATABASE_URL=...:change-me@...` (env lama ter-bake), sedangkan DB
volume diinisialisasi dengan `change-me`. **Sudah diperbaiki (WP-000):** password
role DB diselaraskan dengan `.env.production` lalu container API di-`--force-recreate`
agar memuat env baru. API sekarang `Up` dan `/api/health` = `{"status":"ok"}`.

Catatan operasional: jika mengubah password DB lagi, WAJIB `ALTER USER` di DB **dan**
`docker compose --env-file .env.production -f docker-compose.production.yml up -d --force-recreate linkundang-api`, karena env container tidak ikut berubah saat `restart`.

### 3.7 Struktur frontend (setelah WP-001)

`apps/web/src/App.tsx` kini hanya shell routing (~240 baris). Layout aktual:

```
apps/web/src/
  App.tsx                 # router shell + default export
  app/
    types.ts              # semua tipe domain (Invitation, RSVP, Auth*, dsb.)
    api.ts                # apiBase/apiURL, auth storage, authHeaders, useAuthSession
    useAPIData.ts         # hook data API (invitations, rsvp, payments, templates)
    format.ts             # formatter (rupiah, tanggal, kalender, maps, resolve event)
  components/             # CountdownTimer, common (Loading/NotFound/Nav),
                          # dashboard-icons, PlaceholderModule, AIAssetGenerator
  pages/
    AuthPages.tsx, HomePage.tsx, TemplatesPage.tsx,
    WeddingAdminDashboardPage.tsx, BuilderPreviewPage.tsx
    dashboard/            # DashboardPage, Sidebar + dashboardModules.ts, panel-panel
    editor/               # EditorPage, editorConfig.ts
    mockup/               # MockupPage, MockupPanels, MockupCreateInvitationWizard,
                          # MockupMenuIcon, mockupData.ts
    public/               # PublicInvitationPage (+ Template*Page, RSVP, event card)
```

Aturan: file yang mengekspor komponen **tidak boleh** juga mengekspor
konstanta/fungsi non-komponen (lint `react-refresh/only-export-components`).
Taruh data/tipe/helper di file `.ts` terpisah (mis. `dashboardModules.ts`,
`mockupData.ts`). Semua import lintas-modul memakai jalur tanpa ekstensi.

### 3.8 Struktur CSS (setelah WP-002)

`index.css` dan `premium-theme.css` kini **agregator `@import`** yang hanya
menyusun urutan; isi sebenarnya dipecah per domain:

```
apps/web/src/
  index.css               # @import styles/index/01..22-*.css (urutan asli)
  premium-theme.css       # @import styles/premium/01..19-*.css (per section)
  styles/
    index/  NN-<domain>.css   # domain: landing | dashboard | editor | invitation
                              #         | base | admin ; 20-22 bagian
    premium/ NN-<section>.css # navbar, hero, kategori, pricing, footer, faq, dst.
```

Aturan penting:
- **Urutan `@import` = urutan cascade asli.** Jangan mengurutkan ulang bagian,
  karena banyak selector punya spesifisitas sama (yang belakangan menang).
- Menambah gaya domain baru: buat file `styles/index/NN-<domain>.css` lalu
  daftarkan `@import` pada posisi yang tepat di `index.css`.
- Menambah tema/landing section: tambahkan file di `styles/premium/` + `@import`.
- `styles/index/11-invitation.css` sengaja 1 blok `@media` besar (atomik).
- Verifikasi perubahan CSS: `npm run build` harus tetap menghasilkan output yang
  setara; perubahan murni struktur tidak boleh mengubah tampilan.


---

## 4. Review & Inventaris Modul (status per 2026-10-15)

Legenda: ✅ selesai/tersambung · 🟡 sebagian · ⬜ belum.

### M1 Public Invitation

| Fitur | Status | Catatan |
| --- | --- | --- |
| Cover/splash + nama tamu personal (`?to=`) | 🟡 | Route & shim `URLSearchParams` ada; personalisasi belum konsisten di semua template |
| Countdown + detail acara | ✅ | Countdown ter-hook via `templateEngine.ts` |
| Multi-acara (akad/resepsi/ngunduh mantu) | ⬜ | Pasar mendukung s/d 10 acara |
| Google Maps embed | 🟡 | Masih placeholder di render generik |
| Save to Google Calendar | ⬜ | — |
| Dresscode | ⬜ | — |
| Quotes/ayat | 🟡 | — |
| Love story timeline | 🟡 | — |
| Galeri foto/video | 🟡 | Render per-template belum penuh |
| Background music | 🟡 | Pilihan disimpan, belum selalu diputar |
| Video pembuka | ⬜ | — |
| Live streaming embed | ⬜ | — |
| Amplop digital | 🟡 | UI ada, belum lengkap |
| Gift wishlist | ⬜ | — |
| RSVP + buku tamu | ✅ | Enum sudah konsisten `attending`/`declined`/`pending` |
| Watermark per tier | ✅ | `tierGate.tsx` `TierWatermark` |
| Render engine per-template premium | 🟡 | iframe `srcDoc` + substitusi token; sisa `adat-jawa-katsudoto`/`optimized` (tanggal dari runtime) |
| Dynamic OG/SSR | ✅ | `og_page.go` (`GET /u/{slug}`), tapi `og:image` fallback SVG belum dirender WhatsApp (butuh raster) |

### M2 Guest Management (Tamu)

| Fitur | Status | Catatan |
| --- | --- | --- |
| CRUD tamu | ✅ | `guests.go` + tabel `guests` |
| Import/export CSV | ✅ | `importGuestsCSV` / `exportGuestsCSV` |
| Link personal per tamu | 🟡 | Kolom `personal_url` ada, belum dipakai konsisten |
| Tracking dibuka per tamu | ⬜ | Kolom `opened_at` sudah ada, event `guest_opened` sudah di enum |
| Status RSVP per tamu | 🟡 | — |
| Grup/segmen tamu | ⬜ | — |
| Blast WhatsApp | ⬜ | Container `wa-gateway` ada, belum diintegrasikan |
| Blast email | ⬜ | — |
| Meja/seating + denah | ⬜ | — |
| Kode souvenir anti-double-redeem | ⬜ | — |
| Nomor angpao otomatis | ⬜ | — |
| QR check-in + layar sapa | ⬜ | **Prioritas tinggi** (standar pasar 2026) |

### M3 Builder / Editor

| Fitur | Status | Catatan |
| --- | --- | --- |
| Edit dasar (nama/tanggal/status) | ✅ | — |
| Section-based editor lengkap | 🟡 | Sebagian seksi schema-driven |
| Schema-driven form dari `config_schema` | 🟡 | — |
| Drag & drop | ⬜ | — |
| Realtime preview | 🟡 | — |
| Ganti tema/warna/font | 🟡 | — |
| Duplicate/delete/trash/restore | ⬜ | — |
| Validasi ketersediaan slug | ⬜ | — |
| Multi-bahasa | ⬜ | — |

### M4 Template

| Fitur | Status | Catatan |
| --- | --- | --- |
| Registry template | 🟡 | Hardcoded di `templateEngine.ts` + seed tabel `templates` |
| Katalog publik + kategori | ✅ | — |
| Akses per-tier | ✅ | `tier_access` |
| Admin upload/manage (ZIP, thumbnail) | 🟡 | Endpoint create/update ada; upload ZIP & thumbnail belum |
| Standar folder (`template.json`, FLOW.md) | 🟡 | Sebagian |
| Versioning template | ⬜ | — |

### M5 Media

| Fitur | Status | Catatan |
| --- | --- | --- |
| Upload gambar/audio | ✅ | `uploads.go` + `media_assets` |
| Media library / pilih ulang | ⬜ | — |
| Crop/resize, thumbnail | ⬜ | — |
| Optimasi WebP/AVIF | ⬜ | — |
| Audio library | ⬜ | — |
| Ornamen/sticker library | ⬜ | — |
| Object storage S3-compatible | ⬜ | Masih file lokal VPS |

### M6 Monetisasi

| Fitur | Status | Catatan |
| --- | --- | --- |
| Tier & feature gating | ✅ | `tiers.go` |
| Checkout/order | 🟡 | `payments_midtrans.go` ada; key kosong → `isEnabled=false` |
| Midtrans webhook | 🟡 | Kode ada, belum aktif |
| Xendit | ⬜ | Enum provider sudah ada |
| QRIS | ⬜ | — |
| Voucher/promo | 🟡 | Tabel `vouchers` + seed; CRUD & apply checkout belum |
| Invoice user | ⬜ | — |
| Refund/cancel/manual payment | 🟡 | Manual payment admin ada |
| Renewal/cron expiry downgrade | 🟡 | Grace period ada, cron belum |
| Reseller/affiliate | 🟡 | UI ada, backend belum |
| Add-on | ⬜ | — |
| Custom domain publish flow | 🟡 | `domains.go`, flow UI belum tuntas |

### M7 Analytics

| Fitur | Status | Catatan |
| --- | --- | --- |
| Event tracking endpoint | ✅ | `events.go` |
| Track dari frontend | 🟡 | Belum semua event dikirim |
| Dashboard analytics per undangan | ⬜ | — |
| Realtime visitor (SSE/WebSocket) | ⬜ | UI masih mock |
| Sumber traffic & konversi | ⬜ | — |
| Statistik RSVP/ucapan | 🟡 | — |
| KPI & report admin | ⬜ | — |
| Ekspor PDF | ⬜ | — |

### M8 Komunikasi

| Fitur | Status | Catatan |
| --- | --- | --- |
| Email transaksional (Resend) | ✅ | welcome + publish + payment (`email.go`) |
| Verifikasi email | ✅ | `auth_tokens.go` |
| Reset password | ✅ | `auth_tokens.go` |
| Notifikasi RSVP ke owner | ⬜ | — |
| WhatsApp blast | ⬜ | `wa-gateway` ada |
| Push notification | ⬜ | — |
| Aplikasi mobile | ⬜ | — |

### M9 Admin / Ops

| Fitur | Status | Catatan |
| --- | --- | --- |
| Admin user CRUD | ✅ | `admin_users.go` |
| Admin order/transaksi | 🟡 | Manual payment; list order belum |
| Admin template manager | 🟡 | create/update; upload ZIP belum |
| Admin media manager | ⬜ | — |
| Admin voucher | ⬜ | — |
| Admin report/analytics | ⬜ | — |
| Audit log | ⬜ | — |
| Setting tersimpan DB | 🟡 | `app_settings` ada, UI belum |
| Monitoring error + log viewer | ⬜ | — |
| Backup/restore rutin | ⬜ | — |
| Cron (expiry, cleanup orphan) | ⬜ | — |

### M10 Security / Compliance

| Fitur | Status | Catatan |
| --- | --- | --- |
| Rate limit | ✅ | `rate_limit.go` |
| CAPTCHA/honeypot public RSVP | ⬜ | — |
| Validasi MIME upload | 🟡 | — |
| Limit storage per-tier | ⬜ | — |
| Session revocation/logout server-side | ⬜ | Logout client-side saja |
| CORS produksi ketat | 🟡 | `WEB_ORIGIN` env |
| T&C / Privacy / Refund | ⬜ | — |
| Ekspor/hapus data (UU PDP) | ⬜ | — |
| Guard `/admin` + `RequireAdmin` | 🟡 | Backend ada; guard frontend perlu dipastikan |

### M11 Platform / SEO

| Fitur | Status | Catatan |
| --- | --- | --- |
| sitemap.xml + robots.txt | ✅ | `sitemap.go`, `public/robots.txt` |
| Blog/konten SEO | ⬜ | — |
| Halaman legal | ⬜ | — |
| Test suite backend | 🟡 | `tiers_test.go`, `utils_rate_limit_test.go` |
| Test suite frontend | ⬜ | — |
| CI/CD GitHub Actions | ⬜ | — |

---

## 5. Temuan & Utang Teknis (hasil review kode)

### 5.1 Blocker (harus dibereskan lebih dulu)

1. ~~**API crash-loop** — password DB di `.env.production` ≠ password volume Postgres. (WP-000)~~
   **SELESAI (WP-000)** — API sehat, `/api/health` ok.
2. **Monolith frontend** — **SELESAI (WP-001 + WP-002)**: `App.tsx` **5.975 → 239
   baris** (shell routing + modul di `app/`, `components/`, `pages/`; §3.7) dan
   `index.css` **11.681 baris** + `premium-theme.css` **808 baris** dipecah jadi
   `styles/index/*` + `styles/premium/*` dengan agregator `@import` (§3.8). Hash
   CSS build tidak berubah (`index-Xm8uwRLN.css`). Ini membuka jalan kerja paralel
   per-domain.
3. **Kode mockup bercampur kode nyata** — komponen `Mockup*`
   (`LinkundanganStyleMockupPage`, `MockupDashboardContent`, `MockupCreateInvitationWizard`,
   `MockupTablePanel`, dst.) masih dikompilasi bersama aplikasi produksi.

### 5.2 Inkonsistensi & bug

- Copy produk masih bercampur brand lama (`CintaBuku`, `Undanganku`, `IndoInvite`).
- Public invitation masih bisa fallback ke data demo untuk slug tidak valid.
- Music tersimpan tetapi belum selalu diputar di render publik.
- RSVP list sudah diproteksi owner/admin (`rsvps.go`), bagus — pastikan UI memakai token.
- `og:image` fallback SVG tidak dirender WhatsApp (butuh PNG/JPEG).
- Belum ada test frontend; backend test sangat minim.

### 5.3 Peluang cepat

- `media_assets`, `vouchers`, `custom_domains`, `app_settings`, `guests` **tabelnya sudah ada**
  — tinggal disambungkan ke UI/admin.
- Email transaksional, rate limit, verifikasi email, reset password, dynamic OG
  **sudah jadi** — jangan dibuat ulang.

---

## 6. Roadmap Fase

| Fase | Tema | Tujuan | Ketergantungan |
| --- | --- | --- | --- |
| **F0** | Stabilisasi & Fondasi Kerja | API hidup, frontend dipecah modular, CI/test dasar, ownership jelas | — |
| **F1** | Fondasi Produk & Keandalan | Alur pembuatan undangan end-to-end real, render template lengkap, tamu lanjutan | F0 |
| **F2** | Monetisasi & Operasional | Pembayaran, voucher, invoice, admin panel real, analytics, media manager | F1 |
| **F3** | Diferensiasi Hari-H | QR check-in + layar sapa, seating, blast WA, amplop QRIS, live streaming, multi-bahasa, reseller | F2 |
| **F4** | Skala & Kualitas | Registry template API, object storage, blog/SEO, legal, test+CI lengkap, monitoring/backup | F3 |

> **Aturan fase:** work package (WP) hanya boleh dimulai bila seluruh WP `Depends`
> -nya berstatus `✅`. WP dalam fase yang sama boleh dikerjakan paralel selama
> tidak berbagi file (lihat bag. 8).

---

## 7. Work Packages

Kolom **Status:** ⬜ belum · 🟨 dikerjakan · ✅ selesai.
**Size:** S (≤0.5 hari) · M (1–2 hari) · L (3–5 hari) · XL (>5 hari, pecah lagi).

### F0 — Stabilisasi & Fondasi Kerja

| ID | Modul | Output | File utama | AC | Depends | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WP-000 | Infra | API sehat kembali | `.env.production`, volume `linkundang-db` | `docker ps` API `Up`, `/api/health` 200, log tak lagi SASL error | — | S | ✅ |
| WP-001 | Frontend/Infra | Pecah `App.tsx` ke struktur modular | `apps/web/src/{app,pages,components}` | Tidak ada file >600 baris; semua route lama tetap berfungsi; `npm run build` hijau; lint setara baseline | WP-000 | L | ✅ |
| WP-002 | Frontend/Infra | Pecah `index.css` + `premium-theme.css` per domain | `apps/web/src/styles/*` | Build hijau, visual tidak berubah (hash CSS identik), tidak ada `!important` baru | WP-001 | M | ✅ |
| WP-003 | Frontend | Pisahkan/hapus kode mockup dari bundle produksi | `apps/web/src/pages/mockup/*` | Komponen `Mockup*` tidak lagi diimpor di route produksi | WP-001 | M | ✅ |
| WP-004 | Platform | Test + CI dasar | `apps/api/**/*_test.go`, `apps/web/**`, `.github/workflows/ci.yml` | `go test ./...` & `npm run build` jalan di CI; minimal 1 test per paket API kritis | WP-000 | M | ✅ |
| WP-005 | Platform | `AGENTS.md` + peta ownership | `AGENTS.md` | Ada perintah build/test/deploy + matriks ownership + aturan WP | — | S | ✅ |

### F1 — Fondasi Produk & Keandalan

| ID | Modul | Output | File utama | AC | Depends | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WP-101 | Public Invitation | Render engine lengkap semua template | `apps/web/src/templateEngine.ts`, `template/**` | Semua template di registry ter-render; countdown/tanggal benar; fallback aman | WP-001 | L | ✅ |
| WP-102 | Public Invitation | Maps embed, Save to Google Calendar, dresscode, quotes, love story, multi-acara | `apps/web/src/pages/public/*`, `apps/api/cmd/api/invitations.go` | 6 fitur bisa diisi di editor & tampil di publik | WP-101 | L | ✅ |
| WP-103 | Public Invitation | Music & galeri foto/video real + lazy load | `apps/web/src/pages/public/*` | Audio diputar sesuai setting; galeri tampil dari config; lazy load aktif | WP-101 | M | ✅ |
| WP-104 | Builder/Editor | Editor section-based lengkap dari `config_schema` | `apps/web/src/pages/editor/*` | ≥12 seksi (cover, mempelai, acara, maps, story, galeri, video, gift, kado, lampiran, musik, ucapan) | WP-001, WP-002 | XL→pecah | ✅ |
| WP-105 | Builder/Editor | Duplicate/delete/trash/restore + validasi slug | `apps/api/cmd/api/invitations.go`, builder UI | CRUD lengkap + cek ketersediaan slug sebelum publish | WP-104 | M | ✅ |
| WP-106 | Auth | Guard route + flow auth final + header token konsisten | `apps/web/src/App.tsx`, `apps/web/src/app/api.ts` | `/dashboard` & `/admin` terproteksi; semua call ber-token | WP-001 | M | ✅ |
| WP-107 | Guest Mgmt | Link personal per tamu + tracking dibuka + status RSVP per tamu | `apps/api/cmd/api/guests.go`, guest UI | Tautan unik per tamu; event `guest_opened` tercatat; RSVP terhubung tamu | WP-101 | L | ✅ |
| WP-108 | Analytics | Dashboard RSVP/buku tamu real + moderasi ucapan | `apps/api/cmd/api/rsvps.go`, dashboard | Owner lihat & moderasi RSVP/ucapan; export CSV | WP-106 | M | ✅ |

### F2 — Monetisasi & Operasional

| ID | Modul | Output | File utama | AC | Depends | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WP-201 | Monetisasi | Aktifkan Midtrans + webhook + upgrade otomatis + invoice | `apps/api/cmd/api/payments_midtrans.go` | Sandbox checkout sukses; webhook upgrade tier; invoice tampil | WP-106 | L | ✅ |
| WP-202 | Monetisasi | Voucher: CRUD admin + apply checkout | `apps/api/cmd/api/*`, admin UI | Voucher percent/fixed mengurangi total; kuota berkurang | WP-201 | M | ✅ |
| WP-203 | Monetisasi | Manual transfer end-to-end + cron expiry | `apps/api/cmd/api/admin_payments_templates.go`, cron | Upload bukti → admin verifikasi → tier aktif; expiry downgrade otomatis | WP-201 | M | ✅ |
| WP-204 | Admin/Ops | Admin panel real: order, template, media, voucher, report, audit log | `apps/web/src/modules/admin/*`, API admin | Semua menu admin baca DB, bukan mock | WP-201, WP-202 | XL→pecah | ✅ |
| WP-204a | Admin/Ops | Audit log backend + helper + menu | `apps/api/cmd/api/admin.go`, `migrations.go` | Aksi admin tercatat; endpoint list audit | WP-202 | M | ✅ |
| WP-204b | Admin/Ops | Shell admin console + guard role | `apps/web/src/modules/admin/AdminConsolePage.tsx` | `/admin` hanya role admin; tab menu | WP-204a | M | ✅ |
| WP-204c | Admin/Ops | Order/pembayaran admin | `AdminConsolePage.tsx`, `payments_manual.go` | List order DB; verifikasi/tolak manual | WP-204a | M | ✅ |
| WP-204d | Admin/Ops | Media admin (global) | `apps/api/cmd/api/admin.go` | List media semua user + total storage | WP-206 | M | ✅ |
| WP-204e | Admin/Ops | Voucher admin | `AdminConsolePage.tsx` | List/hapus voucher dari DB | WP-202 | S | ✅ |
| WP-204f | Admin/Ops | Ringkasan/report admin | `apps/api/cmd/api/admin.go` | Statistik user, revenue, pending, storage | WP-205 | M | ✅ |
| WP-205 | Analytics | Analytics dashboard + event tracking lengkap + realtime visitor | `apps/api/cmd/api/events.go`, dashboard | Page view/share/publish/upgrade tercatat; grafik realtime | WP-106 | L | ✅ |
| WP-206 | Media | Media manager + WebP + limit storage per tier | `apps/api/cmd/api/uploads.go`, `media_assets` | Library pilih ulang, konversi WebP, limit per tier | WP-001 | L | ✅ |
| WP-207 | Komunikasi | Notifikasi RSVP ke owner (email/WA) | `apps/api/cmd/api/email.go` | Owner dapat notif saat RSVP masuk | WP-108 | M | ✅ |
| WP-208 | Security/Legal | T&C/Privacy/Refund + honeypot RSVP + session revoke | `apps/web/src/pages/legal/*`, `apps/api/cmd/api/auth*.go` | Halaman legal live; honeypot aktif; logout server-side | WP-106 | M | ✅ |

### F3 — Diferensiasi Hari-H

| ID | Modul | Output | File utama | AC | Depends | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WP-301 | Guest Mgmt | QR check-in + layar sapa (guest on screen) | `apps/api/cmd/api/checkin.go`, UI check-in | Scan QR → status hadir; layar sapa realtime | WP-107 | XL→pecah | ⬜ |
| WP-302 | Guest Mgmt | Seating + kode souvenir + nomor angpao | API + UI seating | Atur meja per tamu; kode souvenir anti double-redeem | WP-301 | L | ⬜ |
| WP-303 | Komunikasi | Integrasi WA blast via `wa-gateway` + template pesan | `apps/api/cmd/api/whatsapp.go` | Kirim undangan massal + status terkirim | WP-107 | L | ⬜ |
| WP-304 | Monetisasi | Amplop digital QRIS + gift wishlist | API + publik | Donasi QRIS & wishlist tampil di undangan | WP-201 | M | ⬜ |
| WP-305 | Public Invitation | Live streaming embed, video pembuka | `apps/web/src/modules/invitation/*` | Embed YouTube/IG/Zoom + video pembuka | WP-102 | M | ⬜ |
| WP-306 | Platform | Multi-bahasa (ID/EN) | `apps/web/src/lib/i18n/*` | Toggle bahasa di undangan & dashboard | WP-001 | L | ⬜ |
| WP-307 | Monetisasi | Reseller/affiliate + white-label | API + UI reseller | Kuota klien, komisi, label white-label | WP-204 | L | ⬜ |

### F4 — Skala & Kualitas

| ID | Modul | Output | File utama | AC | Depends | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WP-401 | Template | Registry template dari API + admin upload ZIP | `apps/api/cmd/api/templates.go`, admin UI | Template dikelola tanpa ubah kode | WP-204 | L | ⬜ |
| WP-402 | Media | Object storage S3-compatible + image pipeline | `apps/api/cmd/api/uploads.go` | Upload ke S3; WebP/AVIF + responsive | WP-206 | L | ⬜ |
| WP-403 | Platform/SEO | Blog/konten SEO + halaman legal lengkap | `apps/web/src/modules/blog/*` | Artikel SEO + sitemap dinamis | WP-306 | M | ⬜ |
| WP-404 | Platform | Test suite lengkap + CI/CD + Lighthouse | `**/*_test.*`, `.github/workflows/*` | Coverage API kritis; CI deploy otomatis | WP-004 | L | ⬜ |
| WP-405 | Ops | Monitoring error, backup/restore, load test | script ops | Error tracking + backup harian + laporan load | WP-004 | M | ⬜ |

---

## 8. Aturan Kolaborasi Paralel (anti-bentrok)

Banyak agent bekerja bersamaan. Untuk mencegah konflik merge, patuhi matriks
kepemilikan berikut. **Satu file hanya boleh diedit oleh satu WP pada satu waktu.**

| Wilayah file | Pemilik WP (contoh) |
| --- | --- |
| `apps/web/src/App.tsx`, `apps/web/src/app/api.ts` | WP-001, WP-106 (bergantian) |
| `apps/web/src/pages/*`, `apps/web/src/components/*` | WP-001 (selesai), WP-003, WP-101, WP-102, WP-103, WP-104, WP-105, WP-106 |
| `apps/web/src/app/types.ts`, `apps/web/src/app/format.ts` | WP-001 (selesai) — perubahan kontrak lewat WP API terkait |
| `apps/web/src/styles/*` | WP-002 (selesai) — tambah bagian baru lewat WP terkait |
| `apps/web/src/modules/builder/*` | WP-104, WP-105 |
| `apps/web/src/modules/invitation/*` | WP-101, WP-102, WP-103, WP-305 |
| `apps/web/src/modules/admin/*` | WP-204, WP-401 |
| `apps/web/src/modules/guest/*` | WP-107, WP-301, WP-302 |
| `apps/api/cmd/api/guests.go` | WP-107, WP-301 |
| `apps/api/cmd/api/rsvps.go` | WP-108 |
| `apps/api/cmd/api/payments_*.go` | WP-201, WP-202, WP-203 |
| `apps/api/cmd/api/events.go` | WP-205 |
| `template/**` | WP-101 |

Ketentuan umum:

1. **Satu WP = satu branch** (`feat/WP-xxx-judul`), PR kecil dan fokus.
2. Jika harus menyentuh file milik WP lain, koordinasikan (tunggu WP itu selesai
   atau buat WP baru yang menyentuh file tersebut).
3. Perubahan kontrak API (request/response) WAJIB diperbarui di `apps/api/cmd/api/models.go`
   dan disinkronkan ke tipe frontend di `apps/web/src/lib/api.ts`.
4. Migrasi DB bersifat aditif (`add column if not exists`), jangan menghapus kolom.

---

## 9. Definition of Done & QA

Sebuah WP dianggap **selesai** jika:

- [ ] Semua Acceptance Criteria terpenuhi.
- [ ] `cd apps/api && go build ./... && go test ./...` hijau.
- [ ] `cd apps/web && npm run build` hijau (tidak ada error TS).
- [ ] Tidak ada regresi pada route/fitur yang sudah ada (uji manual minimal).
- [ ] Tier gating & auth dihormati di backend, bukan hanya UI.
- [ ] Tidak menambah brand lama; istilah sesuai glosarium skill.
- [ ] Status WP di bag. 7 diperbarui menjadi `✅`.
- [ ] Kontrak API/model disinkronkan frontend↔backend.

QA minimum per fase: smoke test alur `register → login → buat undangan → edit →
publish → buka `/u/{slug}?to=Nama → RSVP → buku tamu → dashboard RSVP`.

---

## 10. Out of Scope (sampai fase dinyatakan)

- Migrasi total ke framework/stack lain (tetap Vite React + Go).
- Aplikasi mobile native (evaluasi ulang di F3/F4).
- Fitur AI lanjutan di luar generator aset (`ai_images.go`) tanpa WP khusus.
- Integrasi pembayaran internasional (Stripe/PayPal) sebelum pasar Indonesia matang.

---

## 11. Lampiran

- **Skill produk & pasar:** `.opencode/skills/saas-undangan-indonesia/SKILL.md`
- **Matriks kompetitor:** `.../reference/competitor-matrix.md`
- **Backlog gap fitur:** `.../reference/feature-gap-backlog.md`
- **Panduan agen:** `AGENTS.md`
- **Audit historis:** `docs/SAAS_APP_AUDIT_2026-06-02.md`, `docs/SAAS_GAP_AUDIT_2026-05-30.md`
- **Flow & builder:** `docs/flow-saas-link-undangan.md`, `BUILDER_FLOW_AND_SAAS_PLAN.md`
