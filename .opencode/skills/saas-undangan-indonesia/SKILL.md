---
name: saas-undangan-indonesia
description: Domain knowledge & feature backlog untuk SaaS undangan online Indonesia (undangan digital pernikahan/event). Gunakan saat merancang, membangun, atau melengkapi fitur linkundang.web.id — misalnya fitur undangan, RSVP, tamu/guest, template, builder, amplop digital, QR check-in, WhatsApp blast, paket/tier, voucher, reseller, custom domain, atau saat membandingkan dengan kompetitor seperti undangan.me, wedew.id, invi.id, inviteanywhere, akuakad, suratan, janiva.
---

# SaaS Undangan Online Indonesia

Skill ini merangkum hasil riset pasar SaaS undangan digital Indonesia (kompetitor,
fitur wajib, model monetisasi) dan memetakan **gap** terhadap proyek
`linkundang.web.id`. Tujuannya: melengkapi modul yang belum ada / masih kurang.

Gunakan skill ini ketika:
- Menambah / merancang fitur baru untuk proyek undangan SaaS.
- Menyusun roadmap, paket harga, atau tier.
- Membandingkan fitur proyek dengan kompetitor.
- Menentukan prioritas pekerjaan (P0–P3).

## Cara pakai

1. Baca **Referensi** di bawah untuk detail.
2. Sebelum menulis kode fitur, cek status di `reference/feature-gap-backlog.md`
   agar tidak menduplikasi yang sudah ada.
3. Ambil pola UX/istilah dari `reference/competitor-matrix.md`.
4. **Untuk memilih pekerjaan:** buka `PRD.md` (root repo) → bagian 7 (Work Packages).
   Ambil satu WP yang belum selesai, taati matriks ownership (PRD bag. 8), dan
   ikuti alur kerja di `AGENTS.md`.
5. **Untuk menilai prioritas pasar:** lihat `reference/roadmap.md` (fase F0–F4
   yang sudah dipetakan ke work package).

## Ringkasan pasar (2026)

- Pasar sangat ramai: puluhan platform kecil menengah + beberapa pemain besar
  (Wedew, Invitation.id, Akuakad, Invi.id, Undangan.co.id, InviteAnywhere).
- Rentang harga: **Rp30.000 – Rp1.199.000**. Tiga model:
  1. **Freemium self-service** (undanganku.app, wevitation, adaundangan) — gratis 1 undangan, upgrade.
  2. **Self-service berbayar sekali bayar / paket masa aktif** (janiva, seundang, undangan.one).
  3. **Dibuatkan tim/admin (concierge) + custom design** (sannubari, wedew, invi.id) — harga lebih tinggi.
- "Aktif selamanya" (one-time payment) kini jadi daya jual utama; langganan mulai ditinggalkan untuk end-user.
- Diferensiasi bergeser dari **estetika template** ke **manajemen tamu & operasional hari-H**.

## Modul inti wajib (feature taxonomy)

Kategori fitur yang dipakai hampir semua platform:

1. **Public Invitation** — cover/splash, nama tamu personal, countdown, detail
   multi-acara, Google Maps, save to calendar, dresscode, quotes/ayat, love
   story, galeri foto/video, background music, video pembuka, live streaming,
   amplop digital, gift wishlist, RSVP, ucapan/buku tamu, watermark/tier.
2. **Guest Management (Tamu)** — CRUD, import/export CSV, link personal per
   tamu, blast WhatsApp/email, tracking dibuka, status RSVP per tamu, grup/
   segmen, meja/seating, kode souvenir, nomor angpao, QR check-in.
3. **Builder/Editor** — section-based, drag & drop, realtime edit, schema-driven
   form, ganti tema, duplicate/delete/trash, versioning.
4. **Template** — katalog, kategori, akses per-tier, upload admin, thumbnail, preview.
5. **Media** — upload, library, crop/resize, optimasi WebP/AVIF, audio library, object storage.
6. **Monetisasi** — paket/tier, checkout, payment gateway (Midtrans/Xendit/QRIS),
   voucher/promo, invoice, refund, renewal/expiry, reseller/affiliate, add-on.
7. **Analytics** — page view, visitor realtime, sumber traffic, konversi,
   statistik RSVP/ucapan, ekspor laporan, KPI admin.
8. **Komunikasi** — email transaksional (verifikasi/reset/notif), WhatsApp
   Gateway blast, push notification, mobile app.
9. **Admin/Ops** — manajemen user, template, media, order, voucher, report,
   audit log, setting, backup, monitoring, cron.
10. **Security/Compliance** — rate limit, captcha, verifikasi email, reset
    password, revoke sesi, CORS ketat, T&C/privacy/refund, ekspor/hapus data (UU PDP).
11. **Platform/SEO** — SSR/dynamic OG, sitemap, robots, blog/konten, multi-bahasa, custom domain.

## Istilah baku (pakai konsisten)

- `undangan` (bukan `invitation` di UI), `tamu`/`guest`, `ucapan`/`buku tamu`,
  `amplop digital`/`wedding gift`, `konfirmasi kehadiran`/`RSVP`,
  `layar sapa`/`guest on screen`, `check-in QR`, `blast WhatsApp`,
  `paket`/`tier`, `voucher`, `reseller`/`affiliate`, `custom domain`.
- **Enum RSVP (kanonikal di DB & API): `attending` / `declined` / `pending`.**
  Label UI berbahasa Indonesia: `Hadir` / `Tidak hadir` / `Ragu`. JANGAN memakai
  nilai lain (`hadir`, `maybe`, `not_attending`) di kontrak data; hanya label
  tampilan yang boleh berbahasa Indonesia.

## Referensi

- `reference/competitor-matrix.md` — daftar kompetitor, fitur & harga.
- `reference/feature-gap-backlog.md` — status fitur proyek + backlog P0–P3.
- `reference/roadmap.md` — peta fase F0–F4 → Work Package di `PRD.md`.
- `PRD.md` (root) — PRD master: review modul, roadmap, work package per agent.
- `AGENTS.md` (root) — panduan operasi agent (build/test/deploy, ownership, WP).

## Prinsip saat mengerjakan proyek ini

- `apps/web` (Vite React) + `apps/api` (Go + PostgreSQL) adalah source of truth.
- Jangan edit langsung di VPS kecuali hotfix darurat (lihat README proyek).
- Setiap fitur: buat & tes lokal → commit → push GitHub → deploy VPS → verifikasi.
- Hormati tier gating di backend (`apps/api/cmd/api/tiers.go`), bukan hanya UI.
- Jaga enum RSVP & status konsisten antara frontend dan API (`attending`/`declined`/`pending`).
- Setelah WP-001 (pecah `App.tsx`) selesai, kerjakan fitur di `apps/web/src/modules/*`,
  bukan menambah halaman baru ke `App.tsx`.
