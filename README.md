# Hellscape Tracker (MD2-Tracker)

[![CI](https://github.com/Daoenti/MD2-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Daoenti/MD2-Tracker/actions/workflows/ci.yml)
[![Deploy](https://github.com/Daoenti/MD2-Tracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/Daoenti/MD2-Tracker/actions/workflows/deploy.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![Vue 3](https://img.shields.io/badge/frontend-Vue%203-42b883?logo=vue.js&logoColor=white)
![Express](https://img.shields.io/badge/backend-Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/deploy-Docker-2496ED?logo=docker&logoColor=white)

A self-hosted encounter tracker for [Massive Darkness 2](https://cmon.com/game/massive-darkness-2): track hero count, the Darkness track, and per-encounter mobs/roaming monsters/bosses with wound and heal tracking. Started life as a single-file `index.html` app persisted to `localStorage`; this repo is its full-stack rewrite — multiple saved encounters per account, server-authoritative game rules, and an admin section for managing users and the enemy catalog.

## Features

- **Multiple saved encounters** per account — create, resume, and delete, instead of one live board.
- **Mob / Roaming / Boss tracking** — wound/heal with server-side clamping, minion-level taps, boss track pips, notes.
- **Hero stepper and Darkness track** (Track A 1–9, flips to Track B 1–4, loops).
- **Accounts** — username/password login, server-side sessions; public registration is disabled by default.
- **Admin section** — manage user accounts (create/promote/reset password/delete) and a database-backed catalog of enemy templates (per-monster default health/level/minions/boss-track length) that pre-fill the Add Enemy form.

## Tech stack

- **Backend**: Node.js + Express, PostgreSQL via the raw `pg` driver and `node-pg-migrate` (no ORM), `zod` for request validation, `express-session` + `connect-pg-simple` for auth, `bcrypt` for passwords.
- **Frontend**: Vue 3 (Composition API) + Vite + Pinia + vue-router.
- **Testing**: Vitest — backend unit + integration tests (Supertest against a real migrated Postgres), frontend Pinia store tests.
- **Deploy**: multi-stage Docker image (Express serves the built Vue SPA + `/api`), GitHub Actions CI/CD building and pushing to GHCR, deployed to a self-hosted [Arcane](https://github.com/getarcaneapp/arcane) Docker manager instance behind Traefik.

Plain JavaScript throughout (no TypeScript) — validation at the API boundary via zod covers the same ground with less ceremony.

## Project structure

```
MD2-Tracker/
  backend/            Express API, Postgres migrations, tests
  frontend/           Vue 3 + Vite SPA
  docs/               Design records (PLAN.md, ADMIN_PLAN.md)
  Dockerfile           Multi-stage combined image
  docker-compose.yml    Local dev (db + backend + frontend)
  docker-compose.prod.yml.example   Template for what a production deploy looks like
  .github/workflows/    CI (lint/test/build) and Deploy (GHCR + Arcane redeploy)
```

## Local development

Prerequisites: Node 20+, Docker (for Postgres).

```bash
npm install
cp .env.example .env   # then edit as needed

# start Postgres
docker run -d --name md2-dev-pg -e POSTGRES_USER=md2 -e POSTGRES_PASSWORD=md2 \
  -e POSTGRES_DB=md2_tracker -p 5432:5432 postgres:16-alpine

# create the owner account (migrations run automatically)
SEED_USERNAME=admin SEED_PASSWORD=changeme npm run seed -w backend

# run backend (:3000) and frontend (:5173, proxies /api to the backend) in separate terminals
npm run dev:backend
npm run dev:frontend
```

Or use `docker compose up` for the equivalent containerized dev setup.

## Testing

```bash
npm run test -w backend    # unit + integration (needs DATABASE_URL pointed at a migrated Postgres)
npm run test -w frontend   # Pinia store tests
npm run lint                # ESLint, both workspaces
```

## Deployment

Pushing to `main` runs `ci.yml` (lint, tests, frontend build) and then `deploy.yml`: builds the combined Docker image, pushes it to GHCR tagged `latest` and `:<sha>`, and triggers a redeploy on a self-hosted Arcane instance via its API. See `docker-compose.prod.yml.example` for the shape of what Arcane runs (copy it to `docker-compose.prod.yml`, which is gitignored, and fill in your own domain/network).

## Design history

- [`docs/PLAN.md`](docs/PLAN.md) — the original single-file → full-stack conversion plan.
- [`docs/ADMIN_PLAN.md`](docs/ADMIN_PLAN.md) — the admin section (user management + enemy template catalog) added afterward.
