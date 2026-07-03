---
name: Bluestar project setup
description: pnpm monorepo, React/Vite frontend, Express API, Drizzle/PostgreSQL, Railway deployment config
---

## Stack
- pnpm workspace monorepo, Node.js 24, TypeScript 5.9
- Frontend: `artifacts/bluestar` — React + Vite + Tailwind v4 + shadcn/ui + wouter, port 22341
- API: `artifacts/api-server` — Express 5, port 8080, esbuild CJS bundle → `dist/index.mjs`
- DB: PostgreSQL + Drizzle ORM (`lib/db`), schema-push workflow (no migrations)
- Auth: HMAC Bearer tokens in localStorage (`bluestar_token`), codegen from `lib/api-spec/openapi.yaml`

## Replit dev workflows
- API: `PORT=8080 pnpm --filter @workspace/api-server run dev` (workflow name: `artifacts/api-server: API Server`)
- Frontend: `PORT=22341 BASE_PATH=/ pnpm --filter @workspace/bluestar run dev` (workflow name: `artifacts/bluestar: web`)
- Managed artifact.toml workflows inject PORT/BASE_PATH; if configuring manually these must be in the command

## vite.config.ts
- PORT and BASE_PATH are now optional with defaults (5173 and "/") — they used to throw if missing, breaking `vite build` without env vars
- BASE_PATH must be `/` for Railway builds; artifact.toml sets it automatically for Replit

## Railway deployment
- `railway.toml` — single service: Express serves built React static files + API
- Build: `pnpm install --frozen-lockfile && BASE_PATH=/ pnpm --filter @workspace/bluestar run build && pnpm --filter @workspace/api-server run build`
- Start: `NODE_ENV=production node --enable-source-maps artifacts/api-server/dist/index.mjs`
- Static files served from `artifacts/bluestar/dist/public` (override with `STATIC_DIR` env var)
- Required Railway env vars: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`
- **Schema push not yet wired into Railway build** — must run `pnpm --filter @workspace/db run push` manually on first deploy (Task #3)

## Express 5 catch-all pattern
- `app.get("*", ...)` is INVALID in Express 5 (path-to-regexp v8 rejects it)
- Use `app.use(handler)` without a path as the SPA catch-all
- API 404 handler (`app.use("/api", ...)`) must come BEFORE the SPA catch-all to prevent HTML leaking to API clients

## Codegen
- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- Then `pnpm run typecheck:libs` before checking artifact packages
