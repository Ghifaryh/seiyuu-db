# seiyuu.db

A seiyuu-focused database and discovery site built for real fans. Search Japanese voice actors by kanji, romaji, or any name order — the way you actually think of them.

![Bun](https://img.shields.io/badge/Bun-black?style=flat&logo=bun)
![ElysiaJS](https://img.shields.io/badge/ElysiaJS-black?style=flat)
![Astro](https://img.shields.io/badge/Astro-black?style=flat&logo=astro)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-black?style=flat&logo=postgresql)

## What is this?

Existing anime databases (AniList, MAL, BehindTheVoiceActors) either treat seiyuus as secondary to anime, have poor search for Japanese names, or lack a clean modern UI. seiyuu.db is built specifically around voice actors with:

- Kanji, romaji, and flexible name order search (Kayano Ai = Ai Kayano = 茅野愛衣)
- Current season view — browse airing anime and their full voice cast
- Seiyuu profiles with role history, season filter, and singer discography
- Game role tracking — video game voice roles with source links
- Dynamic duo / pairing pages — discover VAs who frequently work together with auto-detection
- Role announcement and agency news ticker with multi-seiyuu tagging
- Admin panel — manage seiyuu enrichment, news, pairings, users, and manual sync

## Project status

✅ Deployed at [seiyuu-db.gehu.me](https://seiyuu-db.gehu.me) — active development

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Bun | Fast, built-in bundler + cron |
| Backend | ElysiaJS + TypeBox | End-to-end type safety, fast |
| Frontend | Astro v6 + Tailwind v4 | Static-first, minimal JS |
| Database | PostgreSQL 16 | Relational, great JSON + fuzzy search |
| ORM | Drizzle | TypeScript-native, no magic |
| Search | MeiliSearch | Typo-tolerant, multilingual, self-hosted |
| Data sources | AniList GraphQL | Nightly sync into own DB |
| Container | Docker + Docker Compose | Local dev + VPS production |
| Image registry | GHCR | Free, integrates with GitHub Actions |
| Reverse proxy | Caddy | Auto-TLS, simple config |

## Monorepo structure

```
seiyuu-db/
├── apps/
│   ├── api/          # ElysiaJS backend (port 3001)
│   └── web/          # Astro frontend (port 4321)
├── docker-compose.yml          # Dev: MeiliSearch only
├── docker-compose.prod.yml     # Prod: MeiliSearch + API + Web
├── portainer-stack.yml         # Portainer deployment stack
├── .github/workflows/deploy.yml
└── tsconfig.base.json
```

## Getting started

### Prerequisites
- Bun >= 1.x
- Docker + Docker Compose
- PostgreSQL (external, not containerized)

### 1. Clone and install
```bash
git clone https://github.com/Ghifaryh/seiyuu-db.git
cd seiyuu-db
bun install
```

### 2. Set up environment
```bash
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env with your DATABASE_URL, MEILI_MASTER_KEY, JWT_SECRET, etc.
```

### 3. Start local services
```bash
MEILI_MASTER_KEY=<key> docker compose up -d  # starts MeiliSearch (7700)
```

### 4. Run the apps
```bash
bun run dev:api    # → localhost:3001
bun run dev:web    # → localhost:4321
```

### 5. Seed admin account
```bash
ADMIN_EMAIL=admin@seiyuu.db ADMIN_PASSWORD=... bun run apps/api/src/seed-admin.ts
```

> API docs available at `localhost:3001/swagger` when the API is running.

## Deployment

Push to main triggers GitHub Actions → builds Docker images → pushes to GHCR. Deploy via Portainer stack:

- `ghcr.io/ghifaryh/seiyuu-db-api:latest` — Bun-based API
- `ghcr.io/ghifaryh/seiyuu-db-web:latest` — Node-based Astro SSR

Required env vars in production: `DATABASE_URL`, `MEILI_MASTER_KEY`, `JWT_SECRET`.

PostgreSQL is NOT containerized — runs on separate infrastructure.

## Auth

Two-tier: `superadmin` (can manage users) and `admin` (everything except user management). JWT stored in localStorage. Password change available per-user.

## License

MIT — personal project, feel free to fork and build on it.
