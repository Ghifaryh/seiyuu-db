# AGENTS.md

## Setup & dev workflow

1. `MEILI_MASTER_KEY=<key> docker compose up -d` — starts MeiliSearch (7700). PostgreSQL runs on the user's STB
2. Copy `apps/api/.env.example` → `apps/api/.env` and fill in real values
3. `bun install` from root (Bun workspaces monorepo)
4. `bun run dev:api` (port 3001, sync skipped by default) and `bun run dev:web` (port 4321) from root
5. Seed admin: `bun run apps/api/src/seed-admin.ts` (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from env)
6. Swagger docs: `http://localhost:3001/swagger`

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
- All tables use `source: text('source').unique()` for idempotent upserts — `ON CONFLICT (source) DO UPDATE`

## API patterns

- All routes under `/api/v1/*` (grouped in `apps/api/src/routes/v1/index.ts`)
- Public and admin routes for the same resource **share a file**: separate Elysia instances composed together
- `adminMiddleware` — accepts `admin` and `superadmin` roles (JWT verification)
- `superAdminMiddleware` — only `superadmin` (user management endpoints)
- Request validation uses `t.Object()` inline schemas (Elysia's type system, TypeBox under the hood)
- All routes delegate to service layer in `apps/api/src/services/`
- `SYNC_ON_STARTUP=false` set in root `package.json` dev:api script — startup sync skipped by default
- Nightly 2am cron via `Bun.cron` for scheduled sync

## Sync pipeline

- AniList GraphQL fetcher → normaliser → Drizzle upserts → MeiliSearch bulk index
- Rate limiting: `Bun.sleep(700)` between AniList pages (~85 req/min, under 90 limit)
- On-demand seiyuu enrichment: visiting a seiyuu profile triggers full career fetch from AniList (fire-and-forget, sets `enriched = true` so it only runs once)
- Manual sync via admin: `POST /api/v1/sync/season/:year/:quarter` or `/admin/sync` page

## Frontend patterns

- **All pages fetch from real API** — no mock data remains
- Tailwind v4 is imported via `@import "tailwindcss"` in global CSS (no `tailwind.config.*`)
- Admin uses `AdminLayout.astro` + `AdminSplitLayout.astro` (latter includes a live-preview iframe)
- `AdminGuard.astro` — client-side auth check, redirects to `/admin/login` if no valid JWT
- `Avatar.astro` — reusable component, shows image if `imageUrl` exists, initials circle fallback
- `apps/web/src/lib/season.ts` — season utilities shared across pages
- **Astro `<script>` blocks are compiled as ES modules** — inline `onclick` handlers can't reach module-scoped functions. Use event delegation with data attributes instead. Astro template variables (`{id}`) are NOT interpolated in `<script>` blocks — use `window.location.pathname` or `define:vars`

## Auth

- Two-tier: `superadmin` (can manage users) and `admin` (everything except user management)
- Login stores JWT + user in `localStorage` under keys `seiyuu_token` / `seiyuu_user`
- `/admin/login` redirects to `/admin` if already logged in
- Password change: users can change own, superadmin can change any

## News CRUD

- `GET /api/v1/news/:id` — single post with joined seiyuu data
- `POST /api/v1/news` — create (admin, body optional)
- `PATCH /api/v1/news/:id` — edit (admin)
- `DELETE /api/v1/news/:id` — delete (admin)
- "Has body" toggle: posts without body require `sourceUrl`. Public list opens source in new tab. Public detail redirects to source URL.

## Pairings

- `POST /api/v1/pairings/:id/detect` — auto-find shared anime between both seiyuu, populates `pairingAnime` table
- Detection runs in background after pairing creation
- Pairing create uses search-as-you-type pickers (not slow dropdown of all 400+ seiyuu)

## Known quirks

- Astro v6 prod build requires `@astrojs/node` adapter (has Bun compatibility issues — dev mode works fine)
- No test infrastructure, no linter, no typecheck scripts exist
- `verbatimModuleSyntax: true` on API — use `type` keyword explicitly for type-only imports

## Deployment

- `apps/api/Dockerfile` — Bun-based production image
- `apps/web/Dockerfile` — Node-based with Astro SSR adapter (Bun has adapter compat issues)
- `docker-compose.prod.yml` — production stack: MeiliSearch + API + Web
- `.github/workflows/deploy.yml` — builds both images on push to main, pushes to GHCR
- GHCR images: `ghcr.io/<owner>/seiyuu-db-api:latest` and `ghcr.io/<owner>/seiyuu-db-web:latest`
- API env vars needed in production: `DATABASE_URL`, `MEILI_MASTER_KEY`, `JWT_SECRET`
- PostgreSQL is NOT containerized — runs on the user's infrastructure with the same connection string
