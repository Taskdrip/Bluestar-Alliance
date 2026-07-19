---
name: Bluestar project setup
description: Core architecture decisions and env var requirements for the Bluestar Alliance monorepo.
---

# Bluestar Alliance — Setup Notes

## Architecture
- pnpm monorepo: `artifacts/bluestar` (React/Vite, port 5000), `artifacts/api-server` (Express, port 8080), `lib/db` (Drizzle/PostgreSQL)
- Auth: custom HMAC token stored in `localStorage` as `bluestar_token`, sent as `Authorization: Bearer <token>`
- DB migrations: `pnpm --filter @workspace/db run push` (or `push-force`)
- API build: esbuild via `build.mjs`; all new routes must be registered in `artifacts/api-server/src/routes/index.ts`

## Database
- Runtime-managed by Replit: `DATABASE_URL=postgresql://postgres:password@helium/heliumdb?sslmode=disable`
- PGHOST=helium, PGPORT=5432, PGUSER=postgres, PGDATABASE=heliumdb
- Do NOT set DATABASE_URL manually — it's injected automatically at runtime
- After any schema change: `pnpm --filter @workspace/db run push`
- After pnpm install or node_modules missing, both workflows need to be restarted

## Getting Everything Running (if broken)
1. `pnpm install` at workspace root
2. `pnpm --filter @workspace/db run push`
3. Restart `artifacts/api-server: API Server` workflow
4. Restart `artifacts/bluestar: web` workflow (if needed)

## User Roles
- `"user"` — regular site user / applicant
- `"admin"` — admin with optional permission restrictions
- `"superadmin"` — full access, can manage admin team, cannot be deleted or demoted

## Users Schema Additions (beyond original)
- `permissions` (text, nullable) — JSON array of allowed tab IDs; null = full access
- `isDisabled` (boolean, default false) — disabled admins get 403

## Communication System (built July 2026)
- **In-app chat**: per-application message threads (`/api/messages/:applicationId`)
- **Push notifications**: web-push via VAPID keys; subscriptions in `push_subscriptions` table; helper at `artifacts/api-server/src/lib/pushNotify.ts`
- **Email**: nodemailer SMTP via `/api/email/send`
- **Newsletter**: `/api/newsletter/*`; local DB + optional Listmonk integration
- **PWA**: service worker at `artifacts/bluestar/public/sw.js`, registered in `src/lib/registerSW.ts`

## Required Env Vars / Secrets
- `SESSION_SECRET` — set
- `VAPID_PUBLIC_KEY` — already set
- `VAPID_PRIVATE_KEY` — secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — secrets for email
- `SMTP_FROM`, `SMTP_FROM_NAME` — optional overrides
- `LISTMONK_URL`, `LISTMONK_USERNAME`, `LISTMONK_PASSWORD`, `LISTMONK_LIST_ID` — optional Listmonk

## Admin Dashboard Tabs
All tabs: overview | applications | jobs | testimonials | chat | email | newsletter | payment | orders | users | popup | team
- `popup` tab: manage sitewide announcement popup (image upload, title, body, active toggle)
- `team` tab: superadmin only — create/edit/disable admins, set per-tab permissions
- `users` tab: view all users + their applications, reset password, delete user

## Public vs. Admin Routes
- `GET /api/payment-settings` — PUBLIC (applicants need bank details after addon selection)
- `GET /api/admin/payment-settings` — admin only
- `GET /api/announcement-popup` — public (returns 404 when no active popup — handled gracefully)
- `POST /api/addon-orders` — public, supports `paymentMethod: "bank_transfer" | "pay_later"`

## Apply Page Flow
- Auth gate: shows Create Account / Sign In tabs; auto-switches to Sign In on 409 duplicate email, pre-fills email
- Industry → sub-role two-level selector (14 industries, 8-12 roles each)
- Pay Later: creates addon order with `paymentMethod: "pay_later"`, shows amber confirmation screen
- On application submit: if addons selected → payment screen; else → success screen

## DB Tables
users, jobs, applications, testimonials, messages, notifications, payment_settings, addon_orders, push_subscriptions, newsletter_subscribers, announcement_popup

## Admin Permission System
- `requireAdmin()` in admin.ts: accepts role "admin" OR "superadmin", checks isDisabled
- `requireSuperAdmin()`: only "superadmin" role
- Frontend reads `permissions` from `/auth/me` response; parses JSON; filters visible tabs
- `/auth/me` now returns permissions + isDisabled alongside user fields
