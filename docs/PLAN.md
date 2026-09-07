# MD2-Tracker Full-Stack Conversion Plan

## Context

MD2-Tracker ("Hellscape Tracker") is currently a single `index.html` file — vanilla JS, no build step, state persisted only to localStorage on one device. This is the **third attempt** at planning a conversion to a full-stack app; the first two rounds of design discussion were lost because the working directory was never a git repository and nothing was written to disk. Two fixes are baked into this plan itself: (1) git is now initialized in the repo, and (2) this plan file itself becomes the durable record of the design, committed to the repo early rather than living only in chat.

Goal: rebuild this as a Node/Express + PostgreSQL backend with a Vue 3 frontend, supporting multiple saved encounters per logged-in user, deployable via GitHub Actions CI/CD to the user's self-hosted Arcane Docker server.

## Decisions locked in with the user

- Data model: move from "one live board" to **multiple named, saved encounters** per user (create/list/resume/delete).
- Auth: **simple username/password login**, encounters are private per-account.
- Registration: **locked down** — `ALLOW_REGISTRATION=false` by default in production; the user's own account is seeded/created directly, not via public sign-up.
- Deploy target: **Arcane** (self-hosted Docker manager) via CI-triggered HTTP API call. Exact Arcane API shape is unknown — isolate it as one swappable step.
- CI/CD: **GitHub Actions**, new GitHub repo (none exists yet), image pushed to **GHCR**.
- Repo shape: **monorepo** (backend + frontend + deploy config together), using npm workspaces.
- Language: **plain JavaScript** (not TypeScript) on both ends, matching the project's low-ceremony original spirit; runtime validation via **zod** covers the API boundary instead.

## Data model being ported (from `index.html`)

Original localStorage shape: `{ heroCount, darkness:{side,pos}, showSample, units:[...] }` where a `unit` is one of:
- **mob**: `{ kind:"mob", name, level, healthMax, notes, showNotes, leader:{wounds}, minions:[{id,wounds}] }`
- **roaming**: `{ kind:"roaming", name, level, healthMax, wounds, notes, showNotes }`
- **boss**: `{ kind:"boss", name, healthMax, wounds, notes, showNotes, bossTrack:{pos,max} }`

Business logic to preserve exactly:
- `distributeMob(unit, amount, mode)` in `index.html` — spreads a wound/heal amount across a mob's leader+minions (wound mode fills in array order up to each member's remaining capacity; heal mode heals most-wounded-first).
- `healthClass(remaining, max)` — >60% ok, >30% warn, else danger, ≤0 dead. Pure display, stays client-side.
- Darkness track state machine: Track A runs 1–9 then flips to Track B (1–4, loops). Stays client-side (Pinia store), persisted via simple PATCH.
- Static reference name lists (~40 mob / ~50 roaming / ~13 boss names) — autocomplete only, no persistence needed; live in frontend constants, not the DB.

## Repo / folder structure

Monorepo via npm workspaces (`"workspaces": ["backend","frontend"]`):

```
MD2-Tracker/
  .github/workflows/{ci.yml, deploy.yml}
  backend/
    migrations/                 # node-pg-migrate
    src/
      app.js, server.js
      db/pool.js
      middleware/{requireAuth.js, errorHandler.js}
      routes/{auth,encounters,units,minions}.routes.js
      services/{wounds.service.js, auth.service.js}
      repositories/{users,encounters,units,minions}.repo.js
      validation/                # zod schemas
    test/
  frontend/
    src/
      router/index.js
      stores/{auth,encounters,board}.store.js   # Pinia
      api/{client.js, auth.js, encounters.js, units.js}
      views/{LoginView, RegisterView, EncounterListView, EncounterBoardView}.vue
      components/{TopBar, HeroStepper, DarknessTracker, AddEnemyModal,
                   MobCard, SingleUnitCard, BossTrack, MiniChip, NotesBlock}.vue
      constants/enemyNames.js
      assets/styles/main.css     # ported CSS, imported globally
  Dockerfile                     # multi-stage combined image
  docker-compose.yml             # local dev: db + backend(nodemon) + frontend(vite)
  docker-compose.prod.yml        # what Arcane runs: db + app
  .env.example
  package.json                  # root workspaces
```

No `shared/` package — the small duplication (enemy name lists) isn't worth a third workspace.

## Database schema

PostgreSQL, **normalized** (not JSONB blobs) so single-unit/single-minion taps are targeted `UPDATE`s, not whole-encounter read-modify-write. UUID primary keys via `pgcrypto`.

- **users**: `id, username unique, password_hash, created_at`
- **encounters**: `id, user_id fk→users cascade, name, hero_count (1-6), darkness_side ('A'|'B'), darkness_pos, is_sample bool, created_at, updated_at` — indexed on `user_id`
- **units**: `id, encounter_id fk→encounters cascade, kind ('mob'|'roaming'|'boss'), name, level, health_max, wounds, leader_wounds (mob only), boss_track_pos, boss_track_max (boss only), notes, show_notes, created_at, updated_at` — indexed on `encounter_id`
- **minions**: `id, unit_id fk→units cascade, wounds, created_at` — indexed on `unit_id`

Kind-specific field consistency enforced in zod validation, not DB CHECKs. Display order (bosses, roaming, mobs, each by insertion order) reproduced via `ORDER BY created_at` + client-side grouping. On account creation, seed one `is_sample=true` encounter mirroring the original sample data.

**Migrations: `node-pg-migrate`** with the raw `pg` driver (no ORM/query builder) — proportionate to 4 tables, keeps SQL visible and debuggable.

## Backend architecture

- **Express** (not Fastify) — small self-hosted app, Express's ecosystem/familiarity wins.
- **Auth: server-side sessions**, not JWT — single-instance app, no need for stateless scaling; instant revocation on logout. `express-session` + `connect-pg-simple` (sessions in the same Postgres, no Redis to manage).
- **Passwords**: bcrypt, cost ~12.
- **Validation**: zod schemas per route group, small parsing middleware, 400 + field errors on failure.
- **CORS**: none in prod (same-origin combined image). Dev uses Vite's proxy (`/api` → backend) instead of enabling CORS, so dev matches prod behavior.

**Business-logic split**: wound/heal distribution and clamping are **server-authoritative** (DB can never end up invalid regardless of client bugs); `healthClass` and the darkness flip stay **client-only** (pure display / trivial state, no need to round-trip).

**REST API** (session-authenticated, scoped to `req.session.userId`):
```
POST   /api/auth/register        (gated by ALLOW_REGISTRATION)
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/encounters
POST   /api/encounters                     {name}
GET    /api/encounters/:id                 (nested units[]+minions[])
PATCH  /api/encounters/:id                 {name?, heroCount?, darknessSide?, darknessPos?}
DELETE /api/encounters/:id

POST   /api/encounters/:id/units           {kind, name, level?, healthMax, minionCount?, bossTrackMax?}
PATCH  /api/units/:id                      {name?, healthMax?, notes?, showNotes?, bossTrackPos?}
DELETE /api/units/:id
POST   /api/units/:id/wound                {amount, mode}
POST   /api/units/:id/leader/wound         {amount, mode}
POST   /api/units/:id/minions              {}

POST   /api/minions/:id/wound              {amount, mode}
DELETE /api/minions/:id

GET    /api/health
```

## Frontend architecture

- **Vue 3 + Vite**, Composition API (`<script setup>`).
- **Pinia** for state (auth / encounters-list / active-board stores) — near-literal port of the original single global `state` object.
- **vue-router**: `/login`, `/register`, `/` (encounter list, protected), `/encounters/:id` (board, protected); nav guard checks auth store hydrated from `GET /api/auth/me`.
- **CSS**: port the existing token-driven `<style>` block almost verbatim into `assets/styles/main.css`, imported globally — class names (`.card`, `.mini`, `.deal-row`, `.boss-track-row`, etc.) map directly onto the planned components, near-zero visual regression risk.
- **API client**: thin `fetch` wrapper, `credentials:'include'`, base path `/api`, global 401 → redirect to `/login`. No axios.

## Docker setup

- **Single combined production image**: multi-stage `Dockerfile` — stage 1 builds the Vite frontend, stage 2 is the Express server serving `frontend/dist` as static files (SPA fallback) alongside `/api/*`. One process, one port — simplest for Arcane to manage, no CORS/inter-container networking needed.
- **Local dev** (`docker-compose.yml`): `db` (postgres:16-alpine) + `backend` (nodemon, bind-mounted) + `frontend` (Vite dev server, proxying `/api`).
- **Production** (`docker-compose.prod.yml`, what Arcane runs): `db` + `app` (image from GHCR), env vars `DATABASE_URL`, `SESSION_SECRET`, `PORT`, `NODE_ENV=production`, `ALLOW_REGISTRATION=false`, `COOKIE_SECURE=true`. Migrations run automatically on `app` startup before `listen()`. Express sets `trust proxy` for correct secure-cookie behavior behind Arcane's reverse proxy.

## CI/CD (GitHub Actions)

**`ci.yml`** (PR + push, any branch): checkout → `npm ci` → lint (ESLint + vue plugin) → backend tests (Vitest+Supertest against a GH Actions Postgres service container, migrated first) → frontend build as a smoke test.

**`deploy.yml`** (push to `main` only, `needs: ci`):
1. Build + push combined image to **GHCR** using the built-in `GITHUB_TOKEN` (no extra registry secret needed), tagged `latest` + `:sha`.
2. **Arcane deploy step — isolated/stubbed**: a single script parameterized by `secrets.ARCANE_BASE_URL` + `secrets.ARCANE_API_TOKEN`, marked TODO pending the real Arcane API shape. Everything upstream (image name/tag/registry) is stable regardless of what this call ends up looking like.

## Rollout order (runnable at every stage)

1. Scaffold folders + root workspaces `package.json`, extend `.gitignore`, `.env.example`. Commit early and often from here on.
2. DB layer: migrations for the 4 tables; bring up `db` via compose; verify; tiny manual seed script for the (single, locked) user account.
3. Backend API, tested manually slice by slice: health/error-middleware → auth (register/login/logout/me + sessions) → encounters CRUD → units/minions CRUD → wound/heal endpoints (port `distributeMob` here, with unit tests alongside).
4. Full local dev compose (`db`+`backend`) running end-to-end against containerized Postgres.
5. Frontend rewrite in order: Vite/Vue/router/Pinia/API-client scaffold → Login/Register (prove auth round-trip) → Encounter List → Encounter Board (port each card type + carried-over CSS) → wire wound/heal calls → Add Enemy modal + name lists → darkness tracker + hero stepper.
6. Wire Vite dev proxy; manual full walkthrough locally.
7. Dockerize: combined multi-stage `Dockerfile`; verify `docker build && docker run` serves the whole app against compose Postgres.
8. Fill in any remaining backend integration tests.
9. CI/CD: add both workflows; create the GitHub repo, push; add `ARCANE_BASE_URL`/`ARCANE_API_TOKEN` secrets (deploy step can be a harmless no-op until Arcane's API is confirmed); verify build-and-push succeeds.
10. First deploy done manually via Arcane's UI using `docker-compose.prod.yml` to validate env vars once; subsequent `main` pushes deploy automatically.

## Testing strategy

- **Vitest** for both packages (one test runner).
- **Backend unit tests**: `distributeMob` wound/heal modes incl. edge cases (overkill spillover, over-heal clamp, zero minions, all-dead group, heal-priority ordering).
- **Backend integration tests**: Supertest against the exported `app` for encounters/units/minions CRUD + wound endpoints, run against a real migrated Postgres per test run.
- **Frontend**: no heavy e2e; at most 1–2 Vitest+`@vue/test-utils` tests on Pinia store actions (API client mocked) — the real wound logic is tested server-side.
- **Lint**: ESLint + `eslint-plugin-vue` as a fast CI gate before tests.

## Open item (blocked on user, not guessed at)

- **Arcane's real API shape** for triggering redeploy — isolated as one parameterized script/step in `deploy.yml` so it's a one-line swap once known; nothing else in the pipeline depends on it.

## Verification

- Each backend slice (step 3) manually exercised via curl/Thunder Client before moving on.
- `npm run test -w backend` passes (unit + integration) before Dockerizing.
- `docker build . && docker compose -f docker-compose.prod.yml up` locally serves the full app against Postgres, login → create encounter → add mob/roaming/boss → wound/heal/minion-tap all work, matching the original app's behavior.
- CI green on a test PR before merging to `main`; first `deploy.yml` run confirmed to push an image to GHCR (Arcane call can no-op until wired for real).
