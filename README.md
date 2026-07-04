<div align="center">

# MATAL

**Play. Learn. Compete.**

A modern, Kurdish-inspired platform for interactive quizzes and live games.

_“matal” (مەتەڵ) is the Kurdish word for a riddle or brain-teaser — every game is a matal to solve._

</div>

---

## Overview

MATAL is a production-quality web application for creating quizzes and hosting
live, real-time game sessions — a host starts a session, players join with a PIN,
and everyone competes in real time with a live leaderboard. It is built for
local/regional use with a small team (or a single developer) in mind: simple,
clean, secure, and a joy to maintain.

The interface has its own visual identity, subtly inspired by Kurdish heritage
(mountain and earth tones, golden sunlight, kilim geometry) blended with modern
product design — with light/dark modes and RTL-ready localization.

> **Status:** Phase 1 (Foundation & Project Setup) complete. See the
> [Roadmap](#roadmap).

## Tech Stack

| Layer          | Technology                                             |
| -------------- | ------------------------------------------------------ |
| Language       | TypeScript (end-to-end)                                |
| Frontend       | React 18 + Vite, Tailwind CSS, TanStack Query, i18next |
| Backend        | NestJS (Clean Architecture, modular)                   |
| Real-time      | Socket.IO                                              |
| Database       | PostgreSQL + Prisma ORM                                |
| Validation     | Zod (shared between client & server)                   |
| Testing        | Jest (API), Vitest + Testing Library (web)             |
| Tooling        | npm workspaces, ESLint, Prettier, GitHub Actions CI    |

## Architecture

MATAL is an npm-workspaces monorepo with a clear separation between the
independent frontend and backend, plus shared packages that keep types and
validation identical on both sides.

```
matal/
├─ apps/
│  ├─ api/            # NestJS backend (REST + Socket.IO gateway)
│  │  ├─ src/
│  │  │  ├─ config/       # env validation (Zod) + typed config
│  │  │  ├─ common/       # filters, interceptors, pipes, shared utils
│  │  │  ├─ database/     # Prisma module & service
│  │  │  └─ modules/      # feature modules (health, realtime, ai, …)
│  │  └─ prisma/          # schema, migrations, seed
│  └─ web/            # React + Vite single-page app
│     └─ src/
│        ├─ components/   # UI components
│        ├─ providers/    # theme, query, i18n providers
│        ├─ hooks/        # data & UI hooks
│        ├─ i18n/         # locales (en, ckb, kmr, ar) + RTL
│        └─ lib/          # API client, socket, query client
├─ packages/
│  ├─ shared-types/   # domain types & API contracts (both apps)
│  └─ validation/     # Zod schemas (both apps)
├─ docker-compose.yml # Postgres (+ optional Redis)
└─ .env.example       # shared configuration for both apps
```

**Backend layering (Clean Architecture):** each feature module flows
`Controller/Gateway → Service (use-cases) → Repository (Prisma)`, with
dependencies pointing inward. Cross-cutting concerns (a standard response
envelope, a global exception filter, Zod validation) live in `common/`.

**Future-ready seams** (present today, no refactor needed later):

- **AI features** — `modules/ai` defines contracts (quiz generation, moderation,
  translation, difficulty analysis) bound to disabled stubs; add real providers
  by swapping the bindings.
- **Multi-tenancy** — the `User` model carries a nullable `organizationId` so
  organizations/schools/companies can be added additively.
- **Localization & RTL** — four locales scaffolded (English, Kurdish Sorani,
  Kurdish Kurmanji, Arabic) with direction-aware layout.
- **API versioning** — all routes under `/api/v1` for painless evolution and a
  future mobile client.

## Prerequisites

- **Node.js ≥ 20** (developed on Node 20 LTS; also runs on newer)
- **npm ≥ 10** (ships with Node)
- **Docker Desktop** — for the local PostgreSQL database

## Getting Started

```bash
# 1. Clone
git clone https://github.com/Hassarok/matal.git
cd matal

# 2. Configure environment (defaults match docker-compose)
cp .env.example .env

# 3. Install dependencies
#    (also builds shared packages and generates the Prisma client)
npm install

# 4. Start the database
docker compose up -d

# 5. Apply migrations and seed demo data
npm run db:migrate
npm run db:seed

# 6. Run both apps (API + web) together
npm run dev
```

- Web app → <http://localhost:5173>
- API health → <http://localhost:3000/api/v1/health>

> The app is resilient to a missing database: the API still boots and reports a
> `degraded` health status until Postgres is available.

**Seeded accounts** (development only — change before any real use):

| Role  | Email             | Password      |
| ----- | ----------------- | ------------- |
| Admin | `admin@matal.dev` | `ChangeMe123` |
| Host  | `host@matal.dev`  | `ChangeMe123` |

## Scripts

Run from the repo root:

| Script                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Run API + web together                         |
| `npm run dev:api`       | Run the API only                               |
| `npm run dev:web`       | Run the web app only                           |
| `npm run build`         | Build all workspaces                           |
| `npm run lint`          | Lint all workspaces                            |
| `npm run typecheck`     | Type-check all workspaces                      |
| `npm test`              | Run all test suites                            |
| `npm run format`        | Format the codebase with Prettier              |
| `npm run db:migrate`    | Apply Prisma migrations (dev)                  |
| `npm run db:seed`       | Seed the database                              |
| `npm run db:studio`     | Open Prisma Studio                             |
| `npm run docker:up`     | Start Postgres (add `--profile with-redis`)    |

## Configuration

All configuration lives in a single root `.env` (see `.env.example`), read by
both apps. Only `VITE_`-prefixed variables are exposed to the browser. Key
variables: `DATABASE_URL`, `API_PORT`, `CORS_ORIGINS`, `VITE_API_URL`.

## Testing

```bash
npm test                       # everything
npm test --workspace @matal/api
npm test --workspace @matal/web
```

## Development Workflow

- **Branches:** feature branches off `main`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) —
  `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
- **Quality gate:** CI runs lint → typecheck → test → build on every push/PR
  (`.github/workflows/ci.yml`). Keep it green.
- **Phased delivery:** each roadmap phase lands as a reviewed, tested unit.

## Design System

MATAL uses a token-driven design system (colours, typography, spacing, radius,
shadows, motion) exposed as CSS variables and surfaced through Tailwind. Brand
colours are fixed; semantic tokens flip between light and dark. The full
component library is delivered in Phase 2.

## Roadmap

1. **Foundation & Project Setup** ✅
2. Design System
3. Authentication & User Management
4. Quiz Builder
5. Live Game Engine
6. Dashboard & Search
7. Reports & Analytics
8. Admin Panel
9. Performance, Security & Testing
10. Deployment & Documentation

## License

Proprietary — all rights reserved (subject to change).
