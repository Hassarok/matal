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

> **Status:** Phases 1–9 complete (through Performance, Security & Testing).
> See the [Roadmap](#roadmap). Explore the components at `/style-guide`.

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
| User  | `user@matal.dev`  | `ChangeMe123` |

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
colours are fixed; semantic tokens flip between light and dark.

Components are built on headless Radix primitives (shadcn-style) and fully
re-skinned to MATAL's identity — Button, Input, Textarea, Label, Card, Badge,
Alert, Avatar, Dialog, Dropdown Menu, Toast, Skeleton, Separator — plus brand
pieces (Logo, star spinner, kilim divider). Everything supports light/dark and
LTR/RTL and is accessible by default.

Visit **`/style-guide`** — the living component gallery and visual QA page, with
toggles to preview every component in light/dark and LTR/RTL.

## Authentication

- **JWT access + rotating refresh tokens** stored in httpOnly, SameSite cookies
  (XSS/CSRF-resistant). The access token is a short-lived JWT; the refresh token
  is an opaque, DB-backed value that is rotated on every use and revocable.
- **Argon2id** password hashing; **role-based access control** (`USER`, `ADMIN`)
  via `@Roles()` + guards.
- **Rate limiting** on sensitive endpoints (`@nestjs/throttler`) and shared
  **Zod** validation on both client and server.
- **Email verification & password reset** are wired end-to-end on the backend;
  in development the links are printed to the API console (no email provider
  required). Swap the `EmailService` binding for SMTP later — no consumer
  changes.
- Frontend: `Register`, `Login`, and `Profile` pages built on the design system
  with `react-hook-form` + Zod, silent token refresh, and route guards.

## Quiz Builder

- **Quiz** + **Question** models with a seeded **Category** table. Owner-scoped
  CRUD, search/filter, and duplicate — with ownership enforced server-side.
- **Six question types** (multiple choice, true/false, multiple select, short
  answer, poll, ordering), each validated by a shared Zod discriminated union.
  Type-specific data is stored in a JSON column, keeping one clean table.
- **Builder UI**: quiz metadata (title, description, cover URL, category,
  difficulty, visibility, tags) + a per-type question editor with up/down
  reordering, plus a **My Quizzes** management page (search, filter, edit,
  duplicate, delete).
- Media is referenced by **image URL** for now; a `StorageService` seam is in
  place so real uploads can be added later without refactoring.

## Live Games

- **Real-time host ↔ player flow** over Socket.IO (namespace `/game`): the host
  creates a room from a quiz, players join with a 6-digit **PIN** and a nickname
  (no account required), and everyone moves through lobby → question → reveal →
  podium together.
- **Server-authoritative** timing and scoring — the correct answer never leaves
  the server for players; points are speed-weighted (fast correct answers score
  higher), with streak tracking and a live leaderboard.
- **All six question types** are playable, with a per-type answer UI (tiles,
  true/false, multi-select, short answer, ordering) and a host answer key + live
  answered-count.
- **Reconnection** is built in: players get a grace period and re-sync to the
  current question via a stored token; the host can rejoin an in-progress game.
- Live state lives in an **in-memory store behind an interface** (swap in Redis
  to scale across instances); only completed games are persisted to Postgres
  (`games`, `game_players`, `game_responses`) to feed reports & analytics.

## Dashboard & Search

- **Personal dashboard** (`/dashboard`, the post-sign-in home): a greeting,
  quick actions (new quiz, my quizzes, join a game), and at-a-glance lists of
  your most recent quizzes and hosted games.
- **Game history** — a read endpoint (`GET /api/v1/games/history`) serves each
  host's completed games (winner, players, date) from the Phase 5 tables.
- **Quiz search & management** — the owner-scoped quiz list gains sorting
  (recently updated / oldest / title) and pagination on top of the existing
  search and category/difficulty filters.
- **Quiz preview** (`/quizzes/:id`) — a read-only view of a quiz and its full
  answer key, with one-click **Host** and **Edit** actions.

## Reports & Analytics

- **Per-game reports** (`/games/:id`, `GET /api/v1/games/:id/report`) — final
  standings with each player's correct-answer count, plus a per-question
  breakdown (correct rate and average response time) computed from the stored
  `game_responses`.
- **Cross-game analytics** (`GET /api/v1/games/analytics`) — games hosted,
  players engaged, questions played, average players per game, and a
  most-played-quizzes leaderboard.
- **Reports home** (`/reports`) — analytics at a glance over the full,
  paginated list of completed games, each linking to its detailed report.
  Recent games on the dashboard link straight through.

## Admin Panel

- **Role-gated** — every `/api/v1/admin/*` route requires an authenticated
  `ADMIN` (JWT + `RolesGuard`), and the `/admin` page is behind an admin-only
  route guard; the entry only appears in the menu for admins.
- **Platform overview** — totals for users, quizzes, questions and games.
- **User management** — searchable, paginated user list with per-user quiz/game
  counts; promote/demote between `USER` and `ADMIN`; delete accounts (with
  guards preventing admins from changing or deleting their own).
- **Quiz moderation** — searchable, paginated list of all quizzes across owners
  with delete.

## Performance, Security & Testing

- **Security** (in place since earlier phases, verified here): Helmet headers, a
  credentialed CORS allow-list, global + per-route rate limiting
  (`@nestjs/throttler`), httpOnly/SameSite JWT cookies with rotating refresh
  tokens, role guards, shared Zod validation, and a global exception filter that
  never leaks internals to clients.
- **Performance:** route-level code splitting (`React.lazy` + `Suspense`) and
  manual vendor chunking, so the initial bundle stays lean and heavy/optional
  deps (socket.io, i18n, forms) load only when needed — no chunk over ~350 kB.
- **Testing:** expanded coverage — unit tests for the games reports/analytics
  aggregation and admin self-guards/mapping (API), plus game-UI component tests
  (answer input, leaderboard) on the web. **71 tests** across both apps.

## Roadmap

1. **Foundation & Project Setup** ✅
2. **Design System** ✅
3. **Authentication & User Management** ✅
4. **Quiz Builder** ✅
5. **Live Game Engine** ✅
6. **Dashboard & Search** ✅
7. **Reports & Analytics** ✅
8. **Admin Panel** ✅
9. **Performance, Security & Testing** ✅
10. Deployment & Documentation

## License

Proprietary — all rights reserved (subject to change).
