---
name: Bluestar Alliance project setup
description: Key architectural decisions and gotchas for the Bluestar Alliance recruitment platform
---

## Stack
- Frontend: React+Vite (artifacts/bluestar), API: Express (artifacts/api-server, port 8080)
- DB: PostgreSQL + Drizzle ORM (lib/db), codegen: Orval (lib/api-spec/openapi.yaml)

## Auth
- Bearer tokens in localStorage key `bluestar_token`; `initAuth()` in main.tsx sets up setAuthTokenGetter

## Codegen gotcha
- lib/api-zod/src/index.ts must only export from `./generated/api` (NOT `./generated/types`) — duplicate name conflict
- After changing openapi.yaml: `pnpm --filter @workspace/api-spec run codegen`

## DB tables (all pushed)
- Original: users, jobs, applications, testimonials
- Added: messages, notifications, payment_settings, addon_orders

## FormLabel gotcha
- FormLabel uses useFormField() internally and throws if used outside FormField context
- Use plain Label component instead for standalone labels outside form fields

## Notification bell (Navbar)
- Polls /api/notifications?email=&role= every 30s; shows unread count badge; mark-all-read via PATCH /api/notifications/read-all

## Add-on orders
- Visa sponsorship $500, Flight ticket $800, Work permit $600
- Selected on /apply page, paid via bank transfer, tracked in addon_orders table
