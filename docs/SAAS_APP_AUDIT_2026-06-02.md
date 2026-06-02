# Audit Aplikasi Undangan SaaS - 2026-06-02

Audit ini membaca project aktif di `D:/UNDANGAN`, terutama:

- `apps/web`: Vite + React TypeScript untuk home, dashboard, katalog, builder preview, dan halaman publik.
- `apps/api`: Go + PostgreSQL API untuk auth, template, invitation, RSVP, tier, upload, event, dan admin user.
- `apps/web/public/template-assets`: asset template statis yang dipakai preview.

## Ringkasan Status

Aplikasi sudah punya fondasi SaaS undangan online yang cukup kuat untuk MVP internal: home page, katalog template, dashboard bergaya Linkundangan, builder preview iframe, public invitation, auth backend, tier gating, RSVP, upload media, event tracking, dan registry template lokal.

Bagian yang belum production-ready paling besar ada di: login UI, payment, template manager real, editor konten lengkap per section, media manager UI, public page SSR/dynamic OG, admin security di frontend, dan pemisahan kode supaya tidak terlalu monolitik.

## Fitur Yang Sudah Ada

### Frontend Web

- Home page baru dengan flow marketing: hero, kategori, katalog template, benefit, pricing, footer.
- Katalog template di `/templates`.
- Dashboard mockup lama/aktif di `/dashboard`, `/dashboard/undangan`, dan `/mockup-dashboard`.
- Menu dashboard: Undangan Online, Builder Template, Order/Transaksi, List Premium, Report, Visitor, Reseller, Langganan, Voucher, Bantuan, Profile, Password.
- Builder preview di `/builder-preview`.
- Direct template preview di `/preview/{templateId}`.
- Public invitation basic di `/u/{slug}`.
- Editor basic di `/dashboard/edit/{slug}` untuk nama pasangan, tanggal, status, dan RSVP list.
- AI asset generator UI untuk prompt foto/ornamen.
- Tier gate context dan hook `useTierGate()`.
- Watermark component berbasis tier.
- Tier expiry banner.
- Analytics client `trackEvent()`.
- Fallback data saat API mati, sehingga UI masih bisa tampil demo.

### Template

Registry aktif berisi 8 template:

- `wedding-premium042-wayang-batik`
- `wedding-premium074-indonesia-editorial`
- `adat-jawa-alyssa-rayhan-katsudoto`
- `adat-jawa-alyssa-rayhan-optimized`
- `adat-sunda-050-style-adapted`
- `adat-sunda-050-pro-raras-danis`
- `adat-jawa-050-klasik-alyssa-rayhan`
- `adat-minang-050-klasik-zahra-fadli`

Folder asset publik berisi 14 folder. Yang belum masuk registry aktif:

- `034`
- `adat-sunda-ai-generated-draft`
- `wedding-premium050-original`
- `wedding-premium050-pixel-clean`
- `wedding-premium050-pro-clean`
- `wedding-premium050-pro-match`

### Backend Go API

Endpoint yang sudah ada:

- Health check: `/health`, `/api/health`, `/api/v1/health`
- Auth: register, login, me, update profile, change password
- Template list: `/api/templates`, `/api/v1/templates`
- Invitation list/create/get/update
- RSVP submit dan RSVP list owner/admin
- Feature/tier endpoint: `/api/v1/me/features`
- Publish invitation dengan validasi tier
- Export CSV tier-gated
- Event tracking: `/api/v1/events`
- Upload media image/audio
- AI image generation dengan provider OpenAI/Google/NVIDIA dan fallback SVG
- Admin user CRUD dasar: list, create, update, reset password

### Database/Migration

Schema sudah menyiapkan:

- `users`
- `templates`
- `invitations`
- `rsvps`
- `payments`
- `events`

Kolom monetisasi sudah ada: `tier`, `tier_expires_at`, `is_b2b`, `client_limit`, `custom_domain`, `dynamic_og_enabled`, `watermark_enabled`, `published_at`.

## Yang Masih Lemah

### Produk/User Flow

- Login UI belum benar-benar menjadi flow utama di frontend.
- Dashboard masih campur antara mockup interaktif dan modul real.
- CTA home masih masuk ke mockup/dashboard, belum ke flow auth/pilih metode/pilih template yang final.
- Belum ada flow jelas: daftar/login -> pilih template -> isi data -> preview -> bayar/publish -> share.

### Builder

- Builder preview sudah bisa load HTML template dan inject sample data.
- Editor real baru mengubah data inti, belum section lengkap.
- Data JSON belum dipetakan penuh ke semua template premium.
- Belum ada schema-driven form dari `config_schema`.
- Belum ada validasi zod frontend untuk config invitation.
- Belum ada fitur ganti tema, duplicate invitation, delete, trash, atau restore.

### Template Manager

- Template registry frontend masih hardcoded di `templateEngine.ts`.
- Tabel `templates` sudah ada, tapi UI admin upload/register template belum real.
- Belum ada upload ZIP template, validasi asset, thumbnail, kategori, plan, active/inactive.
- Ada 6 folder template publik yang belum masuk registry.

### Payment/Monetisasi

- Tabel `payments` sudah ada.
- Tier gating sudah ada.
- Publish validation sudah ada.
- Belum ada create checkout/invoice.
- Belum ada Midtrans/Xendit webhook.
- Belum ada idempotency flow nyata.
- Belum ada admin refund/manual payment UI.
- Belum ada grace-period cron downgrade.

### Analytics/Realtime

- Event table dan trackEvent sudah ada.
- Belum ada dashboard analytics real.
- Belum ada chart page view, share click, conversion, source traffic.
- Belum ada realtime visitor SSE/WebSocket.
- RSVP counter belum realtime.

### Public Invitation

- Public route `/u/{slug}` masih SPA/fallback.
- Belum SSR/ISR untuk meta tag dan OG.
- Dynamic OG belum ada.
- `?to=Nama` belum menjadi public route utama SaaS.
- Maps/gift/gallery di public React basic masih banyak placeholder.
- Template statis punya maps/audio/autoscroll masing-masing, tapi belum sepenuhnya dikendalikan builder.

### Security

- Backend auth dan role admin sudah ada.
- Frontend dashboard belum punya auth guard yang tegas.
- Token tidak dipakai di banyak request frontend lama, sehingga create/update real akan gagal saat API secure.
- Public fallback bisa membuat slug salah tetap tampil seperti data demo.
- Belum ada rate limit RSVP/event/upload.
- Upload belum punya scan/transform/thumbnail pipeline.
- JWT default masih punya fallback `dev-secret-change-me`, wajib dikunci production.

### Struktur Kode

- `App.tsx` terlalu besar dan menampung banyak halaman sekaligus.
- `index.css` sangat besar dan berisi banyak layer style lama/baru.
- Ada beberapa project sampingan: `admin-dashboard-undangan`, `lovable`, `undangan-saas-modern`, `clones`.
- Perlu ditentukan satu app utama sebagai source of truth agar development tidak bercabang.

## Prioritas Penambahan

### P0 - Wajib Sebelum Dipakai User Beneran

1. Auth frontend lengkap: register/login/logout, simpan token, route guard dashboard.
2. Sambungkan request frontend ke API dengan Authorization header.
3. Matikan fallback demo untuk route public slug yang tidak ditemukan.
4. Rapikan dashboard utama: bedakan modul real vs placeholder.
5. Editor invitation section-based: cover, mempelai, acara, maps, gallery, audio, gift, RSVP.
6. Publish flow final: draft -> preview -> publish, dengan validasi tier.
7. Test minimal untuk auth, invitation CRUD, RSVP limit, publish tier gate.

### P1 - Monetisasi dan Operasional

1. Payment manual dulu: admin set paid/tier/expires_at.
2. Invoice/order table atau perluasan `payments`.
3. Midtrans/Xendit checkout + webhook.
4. Admin user panel real di frontend.
5. Subscription page real, upgrade click tracking, banner expired/grace period.
6. Export CSV UI untuk Creator+.
7. Rate limit RSVP dan event.

### P2 - Template Scale

1. Pindahkan `templateRegistry` dari hardcoded TS ke API/tabel templates.
2. Admin template manager: upload ZIP, thumbnail, config schema, plan access.
3. Schema-driven builder form dari `config_schema`.
4. Media manager: upload, library, crop/resize, choose asset.
5. Daftarkan atau arsipkan 6 folder template yang belum masuk registry.
6. Buat standar folder template final: `index.html`, `assets`, `FLOW.md`, `asset-map.json`, `template.json`.

### P3 - Shareability dan Performance

1. SSR/edge render untuk public invitation meta tags.
2. Dynamic OG image generator.
3. Image pipeline WebP/AVIF + responsive sizes.
4. Lazy maps dan lazy media yang konsisten.
5. Lighthouse CI untuk home, dashboard, template preview, public invitation.
6. Realtime visitor via SSE/WebSocket.

## Rekomendasi Urutan Kerja Berikutnya

Urutan paling sehat:

1. Jadikan `apps/web` dan `apps/api` sebagai source of truth.
2. Rapikan auth dan token API di frontend.
3. Buat dashboard user real untuk list/create/edit/publish undangan.
4. Buat editor section-based yang menyimpan JSON config.
5. Sambungkan public `/u/{slug}` ke data config real.
6. Baru masuk payment dan admin template upload.

Dengan urutan ini, aplikasi bisa cepat jadi SaaS yang bisa dijual, tanpa kebanyakan fitur kosmetik yang belum tersambung data.

## Verifikasi Audit

- Server web `127.0.0.1:5173` tidak sedang aktif saat audit.
- API `127.0.0.1:8088` tidak sedang aktif saat audit.
- Percobaan `npm run build` dan `go test ./...` timeout di sesi audit ini, lalu proses sisa dihentikan.
- Tidak ada file test/spec yang terdeteksi di `apps/web` dan `apps/api`.
