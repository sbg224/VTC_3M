# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Engineering System (AES)

Ce projet est régi par l'AI Engineering System (AES), référentiel documentaire situé dans `ia/`.

En début de session, charger systématiquement :
- `ia/SYSTEM.md`
- `ia/RULES_OF_ENGAGEMENT.md`
- `ia/WORKFLOW.md`
- `ia/AGENT.md`

Ces quatre documents définissent la gouvernance, les règles de comportement et le processus de travail applicables à toute intervention (AES-D008). Ils priment sur toute habitude par défaut de l'agent.

Le reste de `ia/` (`CONTEXT.md`, `STACK.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `AUDIT.md`, `STANDARDS.md`, `CHECKLIST.md`, `LEARNING.md`, `CHANGELOG.md`, `PROMPTS.md`) est consulté sélectivement, selon le besoin de la tâche en cours (WORKFLOW.md §3).

## Commands

### Backend (`cd backend`)
- `npm run dev` — start with nodemon (port from `PORT` env, default 5001)
- `npm start` — production start
- `npm test` — run Jest test suite (`--runInBand --forceExit`; tests import the Express `app` directly via supertest, no DB/network needed)
- `npx jest tests/priceService.test.js` — run a single test file
- `npm run seed` — run `src/seed.js`

### Frontend (`cd frontend`)
- `npm run dev` — Vite dev server on port 3000, proxies `/api`, `/pdfs`, `/uploads` to `http://localhost:5001`
- `npm run build` — production build to `dist/`
- `npm run preview` — preview a production build
- `npm run cy:open` / `npm run cy:run` — Cypress E2E (interactive / headless)
- `npm run test:e2e` — run the fixed Cypress suite (home, reservation, login, dashboard specs)
- `npm run test:speed` — build then run a Lighthouse audit (`scripts/lighthouse-audit.js`)

### First-time setup
`./start.sh` from repo root installs both apps, copies `backend/.env.example` → `backend/.env` if missing, kills anything on ports 5001/3000, and starts both dev servers. Requires `backend/.env` to be filled in for email/SMS/Stripe to actually work (see `README.md` and `STRIPE_SETUP.md`).

Default admin account is created automatically on backend startup from env vars (`ADMIN_LOGIN_EMAIL`/`ADMIN_PASSWORD`, falling back to `admin@vtc3m.fr` / `Admin2024!`). **In production**, `backend/src/index.js` refuses to boot if those defaults are still in effect — real values must be set in the environment.

## Architecture

### Backend (`backend/src/`)
Layered Express app: `routes/` → `middleware/` → `controllers/` → `models/` (Sequelize) → `services/`.

- **`index.js`** — single entrypoint that wires all middleware and routes and owns startup sequencing (DB connect → `sequelize.sync()` → `runMigrations()` → seed/update admin account → load pricing config → start cron → `app.listen`). Exports the configured `app` without starting it when required by tests (`require.main === module` guard), so Jest+supertest can hit routes with zero DB/network setup.
- **DB**: SQLite by default (`backend/database.sqlite`, path overridable via `DB_PATH`); switches to Postgres automatically if `DATABASE_URL` is set (see `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md`). `sequelize.sync()` only creates missing tables — never uses `force: true`. Schema changes on existing tables go through the hand-rolled migration runner in `db/runMigrations.js` (an ordered array of `{ name, up }` migrations, each idempotent via `describeTable` checks, tracked in a migrations table).
- **Models** (`models/index.js`): `Driver`, `Reservation`, `PricingConfig`, `Review`, `RevokedToken`, `Contact`, `ContactEvent`, with associations defined centrally in that file (e.g. `Driver.hasMany(Reservation)`, `Review` 1:1 with `Reservation`, `Contact` optionally belongs to `Driver` for the digital business card module).
- **Auth**: JWT stored in an httpOnly cookie (`vtc_session`), with `Authorization: Bearer` header as a fallback (used by scripts/tests). `middleware/auth.js` verifies the JWT, checks a `RevokedToken` blacklist by `jti` (used for logout/compromise revocation, cleaned by an hourly cron in `index.js`), and attaches `req.driver` + `req.tokenPayload`. `middleware/checkSubscription.js` runs after `auth.js` on paid routes and gates access by `Driver.status` (`trial` with unexpired `trialEndDate` / `active` / `expired` → 402 / `suspended` → 403 / `pending` → 403); admins always bypass it. `middleware/requireAdmin.js` gates admin-only routes.
- **Roles**: a `Driver` record with `role: 'admin'` is the platform admin (no public page, no subscription); regular drivers have `role` unset/`'driver'`. Route-level split lives in the frontend (`AdminRoute` vs `DriverRoute` in `App.jsx`) and is enforced again server-side via `requireAdmin`/`checkSubscription`.
- **Stripe webhook** (`POST /api/billing/webhook`, `controllers/billingController.js`): mounted directly in `index.js` with `express.raw()` **before** the global `express.json()` parser and before the `billing` router is mounted — Stripe signature verification needs the raw body Buffer, and mounting the route only inside the router (stripped prefix) silently breaks this. Don't move this route into `routes/billing.js`.
- **Security middleware stack** (order matters, see `index.js`): helmet w/ CSP → CORS (origin allowlist from `FRONTEND_URL`, plus a private-IP regex allowed only outside production) → `hpp()` → `cookieParser()` → morgan→winston HTTP logging → Stripe webhook raw route → `express.json({ limit: '10kb' })` → `middleware/sanitize.js` (XSS stripping on all input) → Content-Type enforcement on POST/PUT → global rate limiter (200 req/15min per IP on `/api`). `trust proxy` is only enabled in production (needed for correct `req.ip` behind Nginx/Traefik — see `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md`), deliberately off in dev.
- **PDFs** (`services/pdfService.js`, PDFKit) are never served statically — always via authenticated, driver-scoped routes (`/api/reservations/:id/pdf-reservation`, `/pdf-invoice`) to avoid leaking one driver's client PDFs to another.
- **Other services**: `emailService.js` (Nodemailer/SMTP), `smsService.js` (Twilio — silently disabled if credentials absent), `geoService.js` / `priceService.js` (trip distance & pricing, backed by `PricingConfig`, cached in-memory and refreshed via `updatePricingCache`), `sseService.js` (server-sent events), `vcardService.js` (digital business card `.vcf` generation).

### Frontend (`frontend/src/`)
React 18 + Vite, plain CSS (`styles/global.css`), no CSS framework/component library.

- **Routing** (`App.jsx`): all routes below `/` except `Home` are lazy-loaded. Three route guards wrap protected pages: `ProtectedRoute` (any authenticated driver), `AdminRoute` (`driver.role === 'admin'`, else redirect to `/dashboard`), `DriverRoute` (authenticated non-admin, else redirect to `/admin`). Auth state comes from `AuthProvider`/`useAuth()` (`services/auth.jsx`), which resolves on mount by calling `GET /api/auth/me` (the session cookie is httpOnly, so the frontend cannot know login state without asking the server) — routes render a loading fallback until that resolves.
- **API client** (`services/api.js`): single axios instance (`withCredentials: true` for the session cookie), grouped into per-domain API objects (`reservationAPI`, `authAPI`, `adminAPI`, `billingAPI`, `crmAPI`, `contactAdminAPI`, etc.) rather than ad hoc fetches. A response interceptor redirects to `/login` on 401 (except during login/register/me calls) and dispatches a `subscription:required` window event on 402 for the dashboard to react to.
- **Pages**: `pages/Dashboard.jsx` (driver) and `pages/AdminDashboard.jsx` are split into view/subcomponents under `pages/dashboard-views/` and `pages/admin-dashboard/` respectively rather than being monoliths — follow that pattern when extending either dashboard (add a new view component, don't grow the page file).
- **Public driver pages**: `/book/:slug` (`BookingPage.jsx`) and `/contact/:slug` (`ContactCard.jsx`) are per-driver public pages keyed by `Driver.slug`; these are deliberately noindexed (see recent commit history) since content is near-duplicate across drivers.
- Vite dev server proxies `/api`, `/pdfs`, `/uploads` to the backend at `http://localhost:5001` — don't hardcode the backend origin in frontend code.

## Testing notes
- Backend tests (`backend/tests/*.test.js`, Jest + Supertest) import `app` from `src/index.js` directly and never call `.listen()` — no live server or DB seeding required for most of them; some hit the real Sequelize models against the local SQLite file.
- Frontend Cypress specs assume both dev servers are running (`baseUrl: http://localhost:3000`) and read admin credentials out of `backend/.env` (`ADMIN_LOGIN_EMAIL`/`ADMIN_PASSWORD`) via `cypress.config.cjs` rather than hardcoding them.

## Repo docs worth knowing about
- `README.md` — setup, env vars, API endpoint list
- `AUDIT_COMPLET_2026-07-14.md` / `AUDIT_OPERATIONNEL_2026-04-12.md` — standing technical/operational audits; check before assuming an area is unreviewed
- `CHECKLIST_PREPROD.md` — pre-production checklist
- `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md` — production deployment plan (Proxmox, Postgres, Traefik/Nginx reverse proxy) — relevant context for `trust proxy` and CORS behavior in `index.js`
- `STRIPE_SETUP.md` — Stripe product/webhook configuration for the billing module
