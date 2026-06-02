# Architecture

## Prinsip

- Modular monolith dulu, microservice nanti saat beban dan tim sudah membutuhkan.
- Domain logic tidak bergantung langsung pada HTTP, database, atau cache.
- API kontrak stabil, payload eksplisit, dan mudah dites.
- UI dibangun dari komponen reusable dengan state lokal yang sederhana.

## Backend

```text
cmd/api                 composition root
internal/config         environment loading
internal/http           router, middleware, handlers
internal/auth           password, JWT, auth service
internal/invitation     invitation domain
internal/platform       PostgreSQL dan Redis adapters
```

## Data Model Awal

- users
- workspaces
- workspace_members
- templates
- invitations
- rsvps
- analytics_events

## Scaling Path

1. Single API instance + PostgreSQL + Redis.
2. Tambah CDN untuk asset undangan dan static web.
3. Pisahkan queue worker untuk email, image processing, dan analytics.
4. Read replica PostgreSQL untuk public invitation traffic.
5. Event stream untuk audit, billing, dan marketing automation.

