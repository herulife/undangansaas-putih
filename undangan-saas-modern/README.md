# Undangan SaaS Modern

Starter SaaS undangan online dengan arsitektur modular, UI premium minimalis, REST API, JWT auth, PostgreSQL, Redis, dan Docker.

## Stack

- Frontend: Vite, React, TypeScript, TailwindCSS
- Backend: Golang, Gin, JWT, PostgreSQL, Redis
- Infra lokal: Docker Compose

## Struktur

```text
apps/
  web/      Vite React dashboard dan public invitation UI
  api/      Go REST API dengan clean architecture ringan
docs/       Catatan arsitektur dan roadmap SaaS
```

## Jalan Lokal

1. Copy environment:

```bash
cp .env.example .env
```

2. Jalankan database dan cache:

```bash
docker compose up -d postgres redis
```

3. Jalankan API:

```bash
cd apps/api
go mod tidy
go run ./cmd/api
```

4. Jalankan web:

```bash
cd apps/web
npm install
npm run dev
```

Web: `http://localhost:5174`
API: `http://localhost:8090`

## Modul MVP

- Authentication dengan JWT
- Workspace dan subscription plan
- Template undangan
- Invitation builder
- RSVP dan guestbook
- Public invitation page SEO-friendly
- Analytics event tracking
- Custom domain ready

