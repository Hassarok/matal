# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MATAL is a Kurdish-inspired interactive quiz & live-game platform (Kahoot-style). Scope is **moderate / local-regional**, not enterprise SaaS — prioritize simplicity, clean architecture, and readable code over premature scale. Built phase by phase (10-phase roadmap: Foundation → Design System → Auth → Quiz Builder → Live Game Engine → Dashboard → Reports → Admin → Perf/Security → Deploy).

## Repository layout

npm workspaces monorepo (no pnpm/Turborepo). Node >= 20.

- `apps/api` — NestJS 10 backend + Socket.IO game gateway (`@matal/api`)
- `apps/web` — React 18 + Vite SPA (`@matal/web`)
- `packages/shared-types` — domain types & DTO contracts (`@matal/shared-types`)
- `packages/validation` — Zod schemas shared by API and web (`@matal/validation`)

## Commands

Run from the repo root:

```bash
npm run dev            # api + web concurrently (api :3000, web :5173)
npm run dev:api        # NestJS watch mode only
npm run dev:web        # Vite only
npm run build          # build all workspaces
npm run build:packages # build shared-types + validation only (run after editing them)
npm run lint           # eslint across workspaces (--max-warnings 0)
npm run typecheck      # tsc --noEmit across workspaces
npm run test           # tests across workspaces
npm run format         # prettier --write

# Database (Postgres via Docker)
npm run docker:up      # start Postgres (add --profile with-redis manually for Redis)
npm run db:migrate     # prisma migrate dev
npm run db:generate    # prisma generate
npm run db:seed        # seed categories/data
npm run db:studio      # Prisma Studio
```

Single test:
- API (Jest): `npm run test --workspace @matal/api -- path/to/file.spec.ts` or `-t "test name"`
- Web (Vitest): `npm run test --workspace @matal/web -- path/to/file.test.ts`

## Non-obvious conventions (read before editing)

**Shared packages build to CommonJS.** The API consumes the built CJS from `dist/`, so **run `npm run build:packages` after editing `shared-types` or `validation`** or the API won't see changes. The web app instead aliases `@matal/*` to the packages' TS **source** in `apps/web/vite.config.ts` (Rollup can't CJS-transform symlinked workspace pkgs). Consequence: use explicit named re-exports in each package's `index.ts` — **not `export *`**.

**Validation is Zod-based and per-route, not class-validator.** Controllers apply `ZodValidationPipe` with a schema from `@matal/validation` (e.g. `@Body(new ZodValidationPipe(saveQuizSchema))`). There is no global `ValidationPipe`. DTO types are inferred from the Zod schemas.

**Password hashing uses Node built-in scrypt** (`apps/api/src/modules/security`), not argon2/bcrypt — avoids native modules.

**Env lives in a single repo-root `.env`** consumed by both apps (Vite `envDir` points to the root). API env is validated/typed via `config/env.validation.ts` → `configuration.ts`; access with `ConfigService.get('auth.accessSecret')` etc.

## API architecture

- **Routing:** global prefix `/api` + URI versioning → routes live at `/api/v1/...`. Controllers declare `@Controller({ path: '...', version: '1' })`.
- **Response envelope:** all successful HTTP responses are wrapped as `{ success: true, data }` by `ResponseInterceptor`; errors as a structured envelope by `AllExceptionsFilter`. WebSocket messages pass through untouched. The web `lib/api.ts` unwraps this and does silent token refresh on 401.
- **Auth:** JWT access/refresh with rotating refresh tokens stored hashed (one row per session, single-use). Delivered via httpOnly cookies (`ACCESS_COOKIE`). Guards: `JwtAuthGuard`, `RolesGuard` + `@Roles()`; `@CurrentUser()` decorator injects the authenticated user. Roles are `{ USER, ADMIN }`.
- **Feature modules** (`src/modules/*`) follow Clean Architecture: controllers/gateways → services → Prisma. Cross-cutting infra modules (config, prisma, security, email, storage, ai) are imported once in `app.module.ts`. Global rate limiting via `ThrottlerModule` (100 req/min/IP; auth routes tighten with `@Throttle`).
- **Seams for later scale:** the AI provider (`modules/ai`), storage, and email are behind interfaces with simple default implementations (e.g. `ConsoleEmailService`). Follow this pattern — interface at the seam, simple impl behind it — rather than over-engineering.

## Live game engine (`apps/api/src/modules/games` + `apps/web/src/*game*`)

Server-authoritative Kahoot-style flow (lobby → question → reveal → podium) over Socket.IO on namespace `/game`. `GameGateway` owns sockets, rooms, timers, and broadcasting; `GamesService` owns game state; scoring/timing are server-side (`scoring.ts`). Reconnection has a 30s grace period. Event names and payload types are shared in `@matal/shared-types` (`game.ts`, `GameEvents`).

Live game state lives behind the `GameStateStore` abstract class with a default `InMemoryGameStateStore` — swappable for a Redis-backed store for multi-instance scale **without touching the engine**. Only completed games are persisted to Postgres (`Game`, `GamePlayer`, `GameResponse`) to feed reports; anonymous players (nickname only) are never stored as `User`s.

Web side: `hooks/useHostGame.ts` and `hooks/usePlayerGame.ts` drive the two roles over `lib/gameSocket.ts`.

## Database (Prisma, `apps/api/prisma/schema.prisma`)

Postgres. Table/column names are **snake_case** (`@map`); the generated client stays camelCase. Prisma enums mirror types in `@matal/shared-types`. Six question types share one `Question` table via a JSON `content` column (no sparse columns). `User.organizationId` is a nullable multi-tenant seam present from day one. State is tracked so `prisma migrate dev` needs a running Postgres.

## Web architecture

React 18 + Vite + React Router 7. TanStack Query for server state (`lib/queryClient.ts`), react-hook-form + Zod resolvers for forms. UI is **shadcn/ui (Radix-based) re-skinned to MATAL design tokens** in `components/ui`; brand components in `components/brand`. i18n via i18next with four locales (`en`, `ar`, `ckb`, `kmr` — includes RTL). `@/` aliases `src/`. Auth-gated routes wrap in `<RequireAuth>`; `<RedirectIfAuthed>` guards login/register.

## Git workflow

Commit + push to `main` at the end of each completed phase (Conventional Commits), after builds and tests pass. Push directly to `main` for clean incremental history. Do not bulk-generate future phases.
