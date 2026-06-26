# Bluestar Alliance

A professional global recruitment platform connecting skilled workers with industrial employers worldwide. Built for Bluestar Alliance — 18+ years in international staffing across mining, construction, oil & gas, maritime, and more.

## Run & Operate

- `pnpm --filter @workspace/bluestar run dev` — run the frontend (port 22341, served at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — HMAC secret for tokens

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Custom HMAC token (Bearer in Authorization header, stored in localStorage as `bluestar_token`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bluestar/src/pages/` — all page components (home, jobs, apply, testimonials, about, contact, login, register, admin)
- `artifacts/bluestar/src/components/layout/` — Navbar and Footer
- `artifacts/bluestar/src/index.css` — Tailwind theme (navy primary, gold accent)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — token creation/verification
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle schema definitions

## Architecture decisions

- Token-based auth: HMAC-signed Bearer tokens stored in localStorage; no cookies/sessions
- Notifications are now auth-gated: GET/PATCH endpoints require Authorization header; identity derived server-side from token
- Logout uses `onSettled` (not `onSuccess`) to ensure localStorage and query cache are cleared even if the API call fails
- Color theme: deep navy (`224 76% 28%`) primary, gold/amber (`44 96% 52%`) accent — matches professional industrial recruitment branding

## Product

- **Public**: Home with hero slider, Jobs listing with filters, Apply form, Testimonials, About, Contact
- **Auth**: Register / Login pages, token stored in localStorage
- **Applicant portal**: Track application status, receive messages and notifications
- **Admin dashboard**: Manage jobs, review and update applications, payment settings, addon orders

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- After codegen, run `pnpm run typecheck:libs` before checking artifact packages
- API server workflow is `artifacts/api-server: API Server`; frontend workflow is `artifacts/bluestar: web`
- If port 8080 conflict occurs on restart, the old API server process may still be alive — kill it with `kill -9 <pid>` before restarting the managed workflow
- Notifications fetch must include `Authorization: Bearer <token>` header — the server no longer accepts client-supplied email/role query params

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
