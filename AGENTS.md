# AGENTS.md

## Setup & dev workflow

1. `docker compose up -d` — starts MeiliSearch (7700). PostgreSQL runs on the user's STB (`100.84.225.86:5432`)
2. Copy `apps/api/.env.example` → `apps/api/.env`
3. `bun install` from root (Bun workspaces monorepo)
4. `bun run dev:api` (port 3001) and `bun run dev:web` (port 4321) from root
5. Swagger docs: `http://localhost:3001/swagger`

## Monorepo structure

- `apps/api` — ElysiaJS backend (Bun-only, never Node.js). Workspace name: `@seiyuu-db/api`
- `apps/web` — Astro v6 frontend (Tailwind v4 via `@tailwindcss/vite`, not PostCSS). Workspace name: `@seiyuu-db/web`
- `packages/` — declared in workspaces but does **not exist** yet

## Database (Drizzle + PostgreSQL)

- **Run from `apps/api/`**, not root
- `bun run db:generate` — generates migration files from schema
- `bun run db:migrate` — applies migrations (requires `DATABASE_URL` env)
- Schema barrel: `apps/api/src/db/schema/index.ts` — re-exports all tables
- Drizzle patterns: no `relations()` helpers are used; FKs are set via `references()` constraints only
- Conflict resolution on sync: `ON CONFLICT (source) DO UPDATE` for upserts

## API patterns

- All routes under `/api/v1/*` (grouped in `apps/api/src/routes/v1/index.ts`)
- Each route file exports a named Elysia instance with its own prefix
- Public and admin routes for the same resource **share a file**: separate Elysia instances (`publicFooRoutes`, `adminFooRoutes`) composed together
- Admin routes use `adminMiddleware` (JWT verification + role check)
- Request validation uses `t.Object()` inline schemas (Elysia's type system, TypeBox under the hood)
- All routes delegate to service layer in `apps/api/src/services/`
- Startup sync (`runStartupSync`) and nightly 2am cron (`scheduleCron`) run after `app.listen()` — not blocking, fire-and-forget
- To skip startup sync in dev: `SYNC_ON_STARTUP=false bun run dev:api`

## Frontend notes

- **All pages currently use hardcoded mock data** — no real API integration yet
- Three dynamic pages set `export const prerender = false`: `seiyuu/[id]`, `season/[year]/[quarter]`, `pairings/[id]`
- Tailwind v4 is imported via `@import "tailwindcss"` in global CSS (CSS-first config, no `tailwind.config.*`)
- Admin uses `AdminLayout.astro` + `AdminSplitLayout.astro` (latter includes a live-preview iframe)
- Season utilities in `apps/web/src/lib/season.ts` — used by both API and web (duplicated logic)

## TypeScript

- Root `tsconfig.json`: uses `"types": ["bun"]`, `"moduleResolution": "bundler"`, `"verbatimModuleSyntax": true`
- API sub-config extends `tsconfig.base.json`
- Web sub-config extends `astro/tsconfigs/strict`
- No typecheck script configured anywhere — `tsc --noEmit` is not wired up

## Testing & linting

- **No test infrastructure exists** (no test files, no vitest/jest config)
- **No linter or formatter configured** (no ESLint, Prettier, Biome, etc.)

## Sync pipeline

- AniList GraphQL fetcher → normaliser → Drizzle upserts → MeiliSearch bulk index
- Rate limiting: `Bun.sleep(700)` between AniList pages
- MeiliSearch index settings in `apps/api/src/sync/lib/meili.ts` (typo-tolerant on name fields)
- Manual sync via admin: `POST /api/v1/sync/season/:year/:quarter`
