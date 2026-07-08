# Deploying MATAL

MATAL ships as two container images — the **API** (NestJS + Socket.IO) and the
**web** app (static SPA served by nginx, which also reverse-proxies the API) —
plus **PostgreSQL**. The bundled `docker-compose.prod.yml` wires all three
together and is the simplest way to run MATAL for a small team or a
local/regional deployment.

## Prerequisites

- Docker + Docker Compose (v2)
- A PostgreSQL volume (provided by the compose file) or an external database
- A TLS terminator in front (Caddy, nginx, or a cloud load balancer) for HTTPS

## Quick start (Docker Compose)

```bash
# 1. Configure production environment
cp .env.production.example .env
#    Edit .env — set strong JWT secrets, a real DB password, and your URLs.
#    Generate secrets: openssl rand -base64 48

# 2. Build and start the stack
docker compose -f docker-compose.prod.yml up -d --build

# 3. Watch it come up
docker compose -f docker-compose.prod.yml logs -f api
```

- Web (nginx) → http://localhost:8080
- The API is reached through the web container at `/api` and `/socket.io`; it is
  not published on its own port by default.

**Database migrations run automatically** — the API container executes
`prisma migrate deploy` on startup before the server boots. To create the seed
admin/user and default categories once the stack is up:

```bash
docker compose -f docker-compose.prod.yml exec api \
  npm run db:seed --workspace @matal/api
```

> Change the seeded credentials (`admin@matal.dev` / `ChangeMe123`) immediately,
> or skip seeding and register your own accounts.

## Configuration

All configuration is environment-driven (see `.env.production.example` for the
full list). The API **validates its environment at boot and fails fast** with a
clear message if something is missing — and it **refuses to start in
production** while the JWT secrets still hold their `dev-*` defaults.

Key production values:

| Variable | Notes |
| --- | --- |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Strong random strings (≥16 chars). Required. |
| `DATABASE_URL` | Points at the `postgres` service inside the compose network. |
| `CORS_ORIGINS`, `WEB_APP_URL` | Your public web origin(s). |
| `COOKIE_SECURE` | `true` when served over HTTPS (required for auth cookies). |
| `WEB_PORT` | Host port the web container listens on (default 8080). |
| `VITE_API_URL` | Leave empty for the bundled same-origin proxy. |

Because the web container proxies `/api` and `/socket.io` to the API, the
browser only ever talks to one origin — so cookies work without cross-site
concessions and CORS is a non-issue in the default topology.

## TLS

Terminate HTTPS in front of the `web` container (port 8080). A minimal Caddy
example:

```
quiz.example.com {
    reverse_proxy localhost:8080
}
```

Then set `COOKIE_SECURE=true`, and `CORS_ORIGINS`/`WEB_APP_URL` to the
`https://` origin.

## Building images individually

The build context is always the repository root:

```bash
docker build -f apps/api/Dockerfile -t matal-api .
docker build -f apps/web/Dockerfile -t matal-web --build-arg VITE_API_URL= .
```

## Health & operations

- **Health check:** `GET /api/v1/health` reports the API and database status
  (the compose file uses it as the API container healthcheck). The API stays up
  in a `degraded` state if the database is temporarily unavailable.
- **Logs:** `docker compose -f docker-compose.prod.yml logs -f [api|web]`.
- **Backups:** back up the `matal-postgres-data` volume (or use managed
  Postgres and point `DATABASE_URL` at it).
- **Upgrades:** `git pull` → `docker compose -f docker-compose.prod.yml up -d
  --build`. Migrations apply automatically on the API's next start.

## Separate hosting (advanced)

The two images are independent, so you can also deploy the API to a Node host /
PaaS and the static web bundle to any static host or CDN. In that case build the
web with `VITE_API_URL=https://api.example.com`, host the API separately, and
set `CORS_ORIGINS` on the API to the web origin. The nginx proxy in the bundled
web image is only used in the single-origin Compose topology.

## CI

`.github/workflows/ci.yml` runs lint → typecheck → test → build on every push
and PR to `main`. Keep it green before deploying.
