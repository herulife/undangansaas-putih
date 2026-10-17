# LinkUndang Undangan SaaS

Fondasi awal SaaS undangan digital untuk domain `linkundang.web.id`.

## Struktur

- `apps/web` - Vite React untuk landing, dashboard, katalog template, dan halaman undangan publik.
- `apps/api` - Go API untuk data template, undangan, RSVP, dan healthcheck.
- `docker-compose.yml` - PostgreSQL lokal untuk development.

## Jalan Lokal

1. Copy env:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

2. Jalankan database:

```bash
docker compose up -d postgres
```

3. Jalankan API:

```bash
npm run dev:api
```

4. Jalankan web:

```bash
npm run dev:web
```

Web lokal: `http://localhost:5173`
API lokal: `http://localhost:8088`

## Flow Kerja

Urutan kerja resmi project:

```text
Local development di D:\UNDANGAN
  -> test dan build lokal
  -> commit
  -> push ke GitHub herulife/undangansaas.git
  -> deploy ke VPS
  -> verifikasi domain production
```

Repository target:

```text
https://github.com/herulife/undangansaas.git
```

Aturan kerja:

- Semua fitur dibuat dan dites lokal terlebih dahulu.
- Jangan edit langsung di VPS kecuali hotfix darurat.
- Setelah lokal stabil, push ke GitHub sebagai sumber kebenaran.
- VPS mengambil versi dari GitHub agar production bisa direproduksi.
- Setiap deploy harus dicek minimal: web load, API health, dan fitur utama yang berubah.

## Deploy VPS

Production stack memakai `docker-compose.production.yml`.

```bash
git pull --ff-only
cp .env.example .env.production
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

Service production:

- `linkundang-web` - static Vite React via Nginx.
- `linkundang-api` - Go API.
- `linkundang-db` - PostgreSQL.

Health check setelah deploy:

```bash
curl http://linkundang-api:8088/api/health
```

## Roadmap MVP

- Auth user dan workspace.
- CRUD template dan undangan.
- Editor konten undangan.
- Upload media ke object storage.
- RSVP dan guestbook.
- Paket harga, pembayaran, dan custom domain.
