# AGENTS.md — Panduan Kerja Agent untuk LinkUndang

Dokumen ini adalah titik masuk untuk **semua agent** yang bekerja di repo ini.
Baca bersama `PRD.md` (rencana & work package) dan skill
`.opencode/skills/saas-undangan-indonesia/SKILL.md` (pengetahuan domain/pasar).

## 1. Sumber Kebenaran

- **Kode:** `apps/web` (Vite React + TS) dan `apps/api` (Go + PostgreSQL) adalah
  satu-satunya aplikasi produksi.
- **Rencana & status WP:** `PRD.md` → bagian 7.
- **Domain knowledge & backlog:** `.opencode/skills/saas-undangan-indonesia/`.
- Folder lain (`admin-dashboard-undangan/`, `clones/`, `lovable/`, `undangan-saas-modern/`)
  adalah **referensi historis** — jangan jadikan target edit kecuali diminta.

## 2. Alur Kerja Wajib

1. Baca `PRD.md` bag. 3 (konvensi) & bag. 8 (ownership).
2. Ambil **satu** Work Package (WP) yang `⬜` dan dependensinya sudah `✅`.
3. Tandai WP di `PRD.md` menjadi `🟨` (agar agent lain tahu sedang dikerjakan).
4. Kerjakan hanya file yang tercantum di WP. Satu branch per WP: `feat/WP-xxx-judul`.
5. Penuhi AC + Definition of Done (`PRD.md` bag. 9).
6. Tandai WP `✅` dan tulis ringkas perubahan.

> Jangan mengerjakan dua WP sekaligus. Jangan menyentuh file milik WP lain tanpa
> koordinasi (lihat matriks ownership di `PRD.md` bag. 8).

## 3. Perintah Build / Test

```bash
# Frontend
cd apps/web && npm install
npm run dev            # dev server
npm run build          # WAJIB hijau sebelum WP selesai

# Backend
cd apps/api && go build ./...
go test ./...          # WAJIB hijau sebelum WP selesai

# Stack produksi (di VPS)
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
curl http://linkundang-api:8088/api/health
```

## 4. Konvensi Penting

- Bahasa UI/istilah: `undangan`, `tamu`, `ucapan`/`buku tamu`, `amplop digital`,
  `konfirmasi kehadiran`/RSVP, `paket`/`tier`, `voucher`, `reseller`,
  `custom domain`, `layar sapa`, `check-in QR`.
- Enum RSVP: `attending` / `declined` / `pending` (frontend & backend harus sama).
- Brand: **LinkUndang** (jangan `CintaBuku`, `Undanganku`, `IndoInvite`).
- Tier gating ditegakkan di backend (`tiers.go`), bukan hanya UI.
- Semua request ber-auth mengirim `Authorization: Bearer <token>`.
- Migrasi DB bersifat aditif (`add column if not exists`); jangan hapus kolom.
- Jangan menambah komentar kode yang tidak perlu.

## 5. Kondisi Infrastruktur

- **Status:** `linkundang-api` sehat (`/api/health` = `{"status":"ok"}`). WP-000 (password
  DB), WP-001 (pecah `App.tsx`), dan WP-002 (pecah CSS) **selesai**.
- Stack produksi: `linkundang-web` (Nginx), `linkundang-api` (Go), `linkundang-db` (Postgres).
- Template undangan di-mount dari `~/linkundang/template` → `/template-assets`.
- Struktur frontend pasca WP-001/002 ada di `PRD.md` §3.7–§3.8: routing di
  `apps/web/src/App.tsx`, data/tipe/helper di `apps/web/src/app/*`, UI di
  `apps/web/src/pages/*` & `apps/web/src/components/*`, CSS di `apps/web/src/styles/*`
  (diakses lewat agregator `@import` di `index.css` / `premium-theme.css`).
- **Selalu ubah urutan `@import` CSS dengan hati-hati** — urutan = cascade asli.

## 6. Glosarium Singkat Teknis

| Istilah | Arti di repo ini |
| --- | --- |
| Owner | pemilik undangan (user yang login) |
| Guest/tamu | penerima undangan, tanpa login |
| config | data undangan JSON (`invitations.config`) |
| config_schema | skema form editor (`templates.config_schema`) |
| tier | paket: free/creator/pro/business |
| gating | pembatasan fitur per tier |
| WP | Work Package di `PRD.md` |
