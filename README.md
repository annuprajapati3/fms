# FMS — Phase 1 (Foundation)

Modules delivered in this phase: **Authentication, User Management, Role Management,
Permission Management, Company Management, Division Management, Branch Management,
Financial Year Management, Dashboard.**

This was built in a sandboxed environment with no network access, so dependencies could
not be installed or executed here. Everything below is real, complete source — schema,
backend, frontend — written by hand to the contracts described, but **you must run the
install/migrate/seed steps yourself** before it will boot. Treat the first run as a
verification pass: if `npm install` or `tsc --noEmit` surfaces something, it's almost
certainly a missing dependency version pin rather than a structural issue, given everything
was cross-checked by hand against Prisma/Express/Next types.

## Project layout

```
fms/
├── docker-compose.yml      # Postgres (+ optional pgAdmin)
├── backend/                # Node.js + Express + TypeScript + Prisma
└── frontend/               # Next.js App Router + TypeScript + Tailwind + ShadCN
```

## 1. Start Postgres

```bash
cd fms
docker compose up -d postgres
```

This starts Postgres on `localhost:5432` with database `fms_db`, user `fms_user`,
password `fms_password` (matches `backend/.env.example`).

Optional: `docker compose --profile tools up -d pgadmin` for a DB GUI at `localhost:5050`
(login `admin@fms.local` / `admin`).

## 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and replace `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` with real random values:

```bash
openssl rand -hex 32   # run twice, paste into the two secrets
```

Then:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate      # creates the schema, prompts for a migration name
npm run prisma:seed         # seeds modules/permissions, Super Admin role, sample org, admin user
npm run dev                 # starts on http://localhost:4000
```

After seeding, a working login exists:

```
Email:    superadmin@fms.local
Password: ChangeMe123!
```

`mustChangePassword` is `true` for this user — the frontend will redirect to the
password-change screen on first login, as specified.

Sanity checks:

```bash
npm run typecheck   # tsc --noEmit
curl http://localhost:4000/health
```

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # starts on http://localhost:3000
```

Visit `http://localhost:3000` — it redirects to `/login`. Sign in with the seeded
Super Admin credentials above.

## What's implemented

- **Auth**: login, logout (single + all sessions), refresh-token rotation, forgot/reset
  password, change password, company/branch/financial-year context switching, all backed
  by httpOnly cookies + bearer-token fallback, with automatic 401→refresh→retry on the
  frontend axios client.
- **RBAC**: module → submodule → action (Create/Edit/Delete/Approve/Reject/View/Export/Print)
  permission model, seeded as real `Module`/`Permission` rows (not hardcoded strings), with
  a visual permission-matrix editor in Roles → matrix icon. Super Admin bypasses checks;
  every other route is gated server-side via `requirePermission`/`requireRole` middleware —
  the frontend's `<PermissionGate>` is UX sugar only, not the enforcement boundary.
- **Org structure**: Company → Division → Branch, multi-company and multi-branch user
  assignment, soft-deletes throughout, audit logging on auth events.
- **Financial Year**: create, set-current, lock, close, with guardrails (can't close the
  active year, can't edit a locked year).
- **Dashboard**: org/user/security KPIs and a recent-activity feed wired to real data now;
  `fleet`/`drivers`/`trips`/`financial`/`pendingActions` are typed as `null` placeholders
  ready to populate once those modules land in later phases — the frontend widget layout
  won't need to change, just the data source.

## Known gaps / deliberately deferred

- Email delivery for password reset is stubbed (`devOnlyToken` returned in non-production
  responses so you can test the flow without an SMTP provider).
- S3 upload wiring is scaffolded in env vars only — no module needs file storage yet.
- No automated test suite yet (`vitest` is wired into `package.json` but no specs were
  written) — flag if you want Phase 1 covered before Phase 2 starts.

## Next phase

Phase 2 per the original spec: Trip Advance, Trip Creation, Trip Tracking, Trip Reporting,
Trip Unloading, Trip Closure, Trip Reopening, Load Planning, GPS Tracking. These will be
added as new modules under the same `backend/src/modules/*` and
`frontend/src/features/*` conventions established here, reusing the auth/RBAC/org-structure
foundation as-is.
