# Admin Section: User Management + Enemy Template Catalog

**Status: implemented, verified, and deployed to production (2026-09-07).** This is the design record from the plan-mode session that produced it — kept for the same reason as `docs/PLAN.md`: durable, in-repo history of *why* things are shaped the way they are, not just what the code currently does.

## Context

MD2-Tracker had exactly one way to create an account (`backend/scripts/seed.js`, run manually against production), no password-change flow, and no way to change credentials without shell access to the container. The Mob/Roaming/Boss name lists used for autocomplete in the Add Enemy modal (`frontend/src/constants/enemyNames.js`) were static, hardcoded, and generic — no per-monster defaults, not editable without a code change + redeploy.

The user wanted an admin section to: manage user accounts and passwords, and create/update the enemy catalog directly from the app. Decisions locked in via questions asked in plan mode:
- **Enemy templates are full per-monster records** (name + suggested health/level/minions/boss-track), not just a name list — picking a name in Add Enemy pre-fills its defaults.
- **Both self-service password change and admin-driven reset** are in scope.

This turned `enemy_templates` from a frontend-only constant into a DB-backed, admin-managed, globally-shared catalog (not per-user — matches how the original name lists were global). `is_admin` became a new column on `users`.

## Data model changes

**Migration: add `is_admin` to `users`**
- `is_admin boolean not null default false`
- Backfill: `UPDATE users SET is_admin = true` for all pre-existing rows — at the time there was exactly one (owner) account seeded via `scripts/seed.js`; grandfathered in as admin so nobody's locked out post-deploy.

**Migration: create `enemy_templates`**
- `id uuid pk default gen_random_uuid()`
- `kind text not null check (kind in ('mob','roaming','boss'))`
- `name text not null`
- `level text` (nullable — mob/roaming only, mirrors `units.level`)
- `health_max integer not null`
- `minion_count integer` (nullable — mob only, suggested minion count)
- `boss_track_max integer` (nullable — boss only)
- `created_at`, `updated_at timestamptz`
- `unique (kind, name)` constraint
- Global table, no `user_id` — shared catalog, matches decision above.

**Migration: seed `enemy_templates`**
- One bulk `INSERT ... ON CONFLICT (kind, name) DO NOTHING`, generated from the 115 names that used to live in `frontend/src/constants/enemyNames.js` (verified correct against the original `index.html` earlier in that session), with generic per-kind defaults matching `AddEnemyModal`'s old hardcoded defaults: mob → `level='1-2', healthMax=4, minionCount=4`; roaming → `level='1-2', healthMax=10`; boss → `healthMax=20, bossTrackMax=8`.
- Runs automatically like all other migrations (`runMigrations()` fires on server startup) — no manual step on deploy.

`frontend/src/constants/enemyNames.js` was deleted once this landed — the catalog is fully DB-backed.

## Backend

**`backend/src/middleware/requireAdmin.js`** — re-fetches the user from `usersRepo.findById` (not session-cached) and checks `isAdmin`, so a demotion takes effect on the admin's very next request rather than waiting for re-login. Small app, correctness over the extra query.

**`backend/src/repositories/users.repo.js`** — `listAll()`, `updatePassword(id, passwordHash)`, `updateIsAdmin(id, isAdmin)`, `remove(id)`; `createUser` gained an `isAdmin` param (default false).

**`backend/src/repositories/enemyTemplates.repo.js`** — `listAll()` (ordered by kind, name), `create()`, `update(id, fields)`, `remove(id)`. Same dynamic-SET-clause pattern as `encounters.repo.js`/`units.repo.js`.

**`backend/src/validation/admin.schema.js`** — `createUserSchema {username, password, isAdmin?}`, `patchUserSchema {isAdmin?, password?}` (refine: at least one field), following `units.schema.js`'s pattern.

**`backend/src/validation/enemyTemplates.schema.js`** — `createTemplateSchema`/`patchTemplateSchema`, mirroring `units.schema.js`'s `createUnitSchema` kind-specific refinement (boss requires `bossTrackMax`, etc.); `kind` isn't patchable after creation (matches units).

**`backend/src/validation/auth.schema.js`** — `changePasswordSchema {currentPassword, newPassword}`.

**`backend/src/services/auth.service.js`** — a shared `createUserWithPassword({username, password, isAdmin})` used by both `registerUser` (isAdmin always false, ALLOW_REGISTRATION-gated) and the admin user-creation path (isAdmin from input, no gate); both still call `seedSampleEncounter`. `changePassword(userId, currentPassword, newPassword)` — `bcrypt.compare` against the stored hash, reject on mismatch, else hash+persist via `usersRepo.updatePassword`.

**`backend/src/routes/admin.routes.js`**, mounted at `/api/admin/users`, `requireAuth` + `requireAdmin` on the whole router:
```
GET    /api/admin/users            list (id, username, isAdmin, createdAt)
POST   /api/admin/users            create — bypasses ALLOW_REGISTRATION
PATCH  /api/admin/users/:id        {isAdmin?, password?}
DELETE /api/admin/users/:id
```
Both PATCH and DELETE reject `req.params.id === req.session.userId` (400 "manage your own account from your profile") — avoids self-lockout/last-admin edge cases without needing an admin-count check.

**`backend/src/routes/enemyTemplates.routes.js`**, mounted at `/api/enemy-templates`:
```
GET    /api/enemy-templates          requireAuth only — used by Add Enemy modal AND the admin table
POST   /api/enemy-templates          requireAuth + requireAdmin
PATCH  /api/enemy-templates/:id      requireAuth + requireAdmin
DELETE /api/enemy-templates/:id      requireAuth + requireAdmin
```

**`backend/src/routes/auth.routes.js`** — `publicUser()` includes `isAdmin`; `PATCH /api/auth/me/password` (requireAuth, `changePasswordSchema`).

**`backend/src/app.js`** — mounts the two new routers.

**Accepted limitation** (no infra built for this): deleting a user doesn't invalidate their existing session (connect-pg-simple sessions aren't FK'd to `users`). Their session dies within 30 days or on their next request that hits `GET /api/auth/me` (already 401s if the user record is gone). Not worth a session-store sweep for a personal-scale app.

## Frontend

- `frontend/src/api/auth.js` — `changePassword(currentPassword, newPassword)`.
- `frontend/src/api/enemyTemplates.js` — `list/create/patch/remove`.
- `frontend/src/api/admin.js` — users `list/create/patch/remove`.
- `frontend/src/stores/auth.store.js` — `isAdmin` flows through automatically via `user`; `changePassword` action.
- `frontend/src/stores/admin.store.js` — users list/create/patch/remove + enemy-templates list/create/patch/remove (one store, two concerns — mirrors how `board.store.js` already owns multiple related concerns).
- `frontend/src/views/AdminView.vue` — single view, two inline sections (tab-toggled, no nested routes): a Users table (username, admin checkbox, reset-password + delete actions, inline create-user form) and an Enemy Templates table (grouped by kind, inline create/edit form, delete), following `EncounterListView.vue`'s existing pattern of inlining forms rather than extracting subcomponents.
- `frontend/src/components/ChangePasswordModal.vue` — small modal reusing the `.modal-backdrop`/`.modal` CSS already defined for `AddEnemyModal`. Triggered from a "Change password" button next to "Log out" in `EncounterListView.vue`.
- `frontend/src/components/AddEnemyModal.vue` — fetches the catalog from `/api/enemy-templates` on mount instead of importing the static name lists; datalist options come from the DB list filtered by `type`. Picking a known name auto-fills health/level/minionCount/bossTrackMax from that template; anything else keeps the old generic defaults.
- `frontend/src/views/EncounterListView.vue` — "Admin" link (only when `auth.user.isAdmin`) and a "Change password" button in the header.
- `frontend/src/router/index.js` — `/admin` → `AdminView`, `meta: { requiresAuth: true, requiresAdmin: true }`; guard redirects to `/` when `requiresAdmin` and `!auth.user?.isAdmin`.

## Bug this plan surfaced

`backend/scripts/seed.js` created the owner account *after* migrations run, so the `is_admin` backfill (which only covers rows that already existed at migration time) never applied to it — on a brand-new deployment, the very first account would have come out non-admin. Fixed by making the seed script pass `isAdmin: true` explicitly rather than relying on the backfill.

## Verification performed

- 31 backend tests (Vitest + Supertest against a real migrated Postgres) + 14 frontend tests, all green. A second, unrelated bug surfaced and got fixed here too: two live-Postgres integration test files running in parallel were racing each other's per-test `TRUNCATE`s — migrations now run once via a Vitest `globalSetup` instead of per-`resetDb()`, and `fileParallelism` is off.
- Migrations run against a throwaway Postgres container: confirmed `enemy_templates` has 115 rows and the existing user ends up `is_admin = true`.
- `docker build` + `docker run` against a fresh Postgres: migrations apply cleanly on a brand-new deploy, admin API round-trips via curl.
- Full Playwright walkthrough: admin creates a user + a custom mob template; the non-admin has no Admin nav link and is redirected away from `/admin`; the new template's defaults auto-fill in Add Enemy; self password-change + re-login round-trip correctly.
- Deployed via the existing GitHub Actions → GHCR → Arcane pipeline; confirmed live in production (`db-1` and `app-1` both came up Healthy).
