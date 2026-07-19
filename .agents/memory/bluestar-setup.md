---
name: Bluestar project setup
description: Core architecture decisions and env var requirements for the Bluestar Alliance monorepo.
---

# Bluestar Alliance — Setup Notes

## Architecture
- pnpm monorepo: `artifacts/bluestar` (React/Vite, port 5000), `artifacts/api-server` (Express, port 8080), `lib/db` (Drizzle/PostgreSQL)
- Auth: custom HMAC token stored in `localStorage` as `bluestar_token`, sent as `Authorization: Bearer <token>`
- DB migrations: `pnpm --filter @workspace/db run push-force`
- API build: esbuild via `build.mjs`; all new routes must be registered in `artifacts/api-server/src/routes/index.ts`

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
- `VAPID_PUBLIC_KEY` — already set
- `VAPID_PRIVATE_KEY` — secret (value: ZAmXc0YdV5OsdMwE6663RSYKN1dnQfYzlGJZRjC1sok)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — secrets for email
- `SMTP_FROM`, `SMTP_FROM_NAME` — optional overrides
- `LISTMONK_URL`, `LISTMONK_USERNAME`, `LISTMONK_PASSWORD`, `LISTMONK_LIST_ID` — optional Listmonk

## Admin Dashboard Tabs
All tabs: overview | applications | jobs | testimonials | chat | email | newsletter | payment | orders | users | team
- `team` tab: superadmin only — create/edit/disable admins, set per-tab permissions
- `users` tab: view all users + their applications, reset password, delete user

## DB Tables
users, jobs, applications, testimonials, messages, notifications, payment_settings, addon_orders, push_subscriptions, newsletter_subscribers

## Admin Permission System
- `requireAdmin()` in admin.ts: accepts role "admin" OR "superadmin", checks isDisabled
- `requireSuperAdmin()`: only "superadmin" role
- Frontend reads `permissions` from `/auth/me` response; parses JSON; filters visible tabs
- `/auth/me` now returns permissions + isDisabled alongside user fields
