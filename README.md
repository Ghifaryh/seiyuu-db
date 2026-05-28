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
- Dynamic duo / pairing pages — discover VAs who frequently work together
- Role announcement and agency news ticker

## Project status

🚧 Active development — personal learning project. Not yet deployed.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Bun | Fast, built-in bundler + cron |
| Backend | ElysiaJS + TypeBox | End-to-end type safety, fast |
| Frontend | Astro v6 + Tailwind v4 | Static-first, minimal JS |
| Database | PostgreSQL 16 | Relational, great JSON + fuzzy search |
| ORM | Drizzle | TypeScript-native, no magic |
| Search | MeiliSearch | Typo-tolerant, multilingual, self-hosted |
| Data sources | AniList GraphQL + Jikan REST | Nightly sync into own DB |
| Container | Docker + Docker Compose | Local dev + VPS production |
| Image registry | GHCR | Free, integrates with GitHub Actions |

## Monorepo structure

```
seiyuu-db/
├── apps/
│   ├── api/          # ElysiaJS backend (port 3001)
│   └── web/          # Astro frontend (port 4321)
├── packages/
│   └── types/        # Shared TypeScript types
├── docker-compose.yml
├── tsconfig.base.json
└── .env.example
```

## Getting started

### Prerequisites
- Bun >= 1.x
- Docker + Docker Compose

### 1. Clone and install
```bash
git clone https://github.com/Ghifaryh/seiyuu-db.git
cd seiyuu-db
bun install
```

### 2. Set up environment
```bash
cp .env.example apps/api/.env
# edit apps/api/.env with your values
```

### 3. Start local services
```bash
# starts PostgreSQL + MeiliSearch
docker compose up -d
```

### 4. Run the apps
```bash
bun run dev:api    # → localhost:3001
bun run dev:web    # → localhost:4321
```

> API docs available at `localhost:3001/swagger` when the API is running.

## Data sources

seiyuu.db does not store or redistribute raw API data publicly. It syncs from AniList and Jikan into a local PostgreSQL database via a nightly background job. Image URLs are sourced from AniList's CDN and served through a proxy layer.

## Roadmap

- [ ] Drizzle schema + migrations
- [ ] AniList + Jikan sync job
- [ ] MeiliSearch indexer
- [ ] Seiyuu search API endpoints
- [ ] Season endpoints
- [ ] Pairing auto-detection
- [ ] Astro pages + components
- [ ] Auth (JWT)
- [ ] Admin panel
- [ ] Docker production setup
- [ ] GitHub Actions CI/CD
- [ ] Deploy to VPS

## License

MIT — personal project, feel free to fork and build on it.
