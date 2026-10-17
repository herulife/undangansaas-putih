# Roadmap Fase LinkUndang → Work Package

Peta ringkas fase pengembangan dan Work Package (WP) terkait. Detail lengkap
(AC, dependency, file, ukuran) ada di `PRD.md` (root) bagian 7.

Legenda status: ⬜ belum · 🟨 dikerjakan · ✅ selesai.

## F0 — Stabilisasi & Fondasi Kerja

Tujuan: API hidup, frontend dipecah modular (anti-bentrok), CI/test dasar.

| WP | Ringkas | Status |
| --- | --- | --- |
| WP-000 | Perbaiki crash-loop API (password DB) | ⬜ |
| WP-001 | Pecah `App.tsx` (5.975 baris) → struktur modular | ⬜ |
| WP-002 | Pecah `index.css`/`premium-theme.css` per domain | ⬜ |
| WP-003 | Pisahkan/hapus kode mockup dari bundle produksi | ⬜ |
| WP-004 | Test + CI dasar | ⬜ |
| WP-005 | `AGENTS.md` + peta ownership | ⬜ |

## F1 — Fondasi Produk & Keandalan

Tujuan: alur buat/publish undangan end-to-end real, render template lengkap,
tamu & RSVP lanjutan.

| WP | Ringkas | Status |
| --- | --- | --- |
| WP-101 | Render engine lengkap semua template | ⬜ |
| WP-102 | Maps, Google Calendar, dresscode, quotes, love story, multi-acara | ⬜ |
| WP-103 | Music & galeri real + lazy load | ⬜ |
| WP-104 | Editor section-based lengkap dari `config_schema` | ⬜ |
| WP-105 | Duplicate/delete/trash/restore + validasi slug | ⬜ |
| WP-106 | Guard route + flow auth final + token konsisten | ⬜ |
| WP-107 | Link personal tamu + tracking dibuka + RSVP per tamu | ⬜ |
| WP-108 | Dashboard RSVP/buku tamu real + moderasi | ⬜ |

## F2 — Monetisasi & Operasional

| WP | Ringkas | Status |
| --- | --- | --- |
| WP-201 | Midtrans aktif + webhook + upgrade otomatis + invoice | ⬜ |
| WP-202 | Voucher CRUD + apply checkout | ⬜ |
| WP-203 | Manual transfer E2E + cron expiry | ⬜ |
| WP-204 | Admin panel real (order/template/media/voucher/report/audit) | ⬜ |
| WP-205 | Analytics dashboard + tracking lengkap + realtime | ⬜ |
| WP-206 | Media manager + WebP + limit per tier | ⬜ |
| WP-207 | Notifikasi RSVP ke owner | ⬜ |
| WP-208 | T&C/Privacy/Refund + honeypot RSVP + session revoke | ⬜ |

## F3 — Diferensiasi Hari-H

| WP | Ringkas | Status |
| --- | --- | --- |
| WP-301 | QR check-in + layar sapa | ⬜ |
| WP-302 | Seating + kode souvenir + nomor angpao | ⬜ |
| WP-303 | Blast WhatsApp via `wa-gateway` | ⬜ |
| WP-304 | Amplop QRIS + gift wishlist | ⬜ |
| WP-305 | Live streaming embed + video pembuka | ⬜ |
| WP-306 | Multi-bahasa (ID/EN) | ⬜ |
| WP-307 | Reseller/affiliate + white-label | ⬜ |

## F4 — Skala & Kualitas

| WP | Ringkas | Status |
| --- | --- | --- |
| WP-401 | Registry template dari API + admin upload ZIP | ⬜ |
| WP-402 | Object storage S3 + image pipeline | ⬜ |
| WP-403 | Blog/SEO + halaman legal | ⬜ |
| WP-404 | Test suite lengkap + CI/CD + Lighthouse | ⬜ |
| WP-405 | Monitoring error, backup/restore, load test | ⬜ |

## Catatan strategi

- Pasar sudah penuh fitur dasar → keunggulan di **manajemen tamu + operasional
  hari-H** (F1 tamu lanjutan, F3 QR check-in/seating/blast WA) dan **kecepatan
  setup self-service** (F1 builder).
- Monetisasi (F2) harus stabil sebelum menambah diferensiasi (F3).
- F0 wajib lebih dulu karena semua kerja paralel bergantung pada frontend yang
  sudah dipecah agar tidak bentrok file.
