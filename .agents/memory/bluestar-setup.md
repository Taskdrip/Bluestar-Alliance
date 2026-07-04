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

## Replit preview requires port 5000
- Replit webview only proxies port 5000 (external port 80). The repo's original workflow ran the frontend on port 22341, which made the preview unreachable (502) until the workflow's PORT was changed to 5000 via `configureWorkflow` (not by hand-editing `.replit`, which is blocked).
- The Vite dev server needs an explicit `server.proxy` entry forwarding `/api` to `http://localhost:8080` — without it, relative `/api/...` fetches from the frontend hit Vite's own SPA fallback (returns `index.html`) instead of the Express API, causing confusing runtime errors like "X.filter is not a function" (X is actually an HTML string).
- DB schema must be pushed after a fresh clone/migration (`pnpm --filter @workspace/db run push`) and seeded via `scripts/seed.ts` — run it with `node --input-type=module < scripts/seed.ts` from inside `lib/db/` (no root-level `tsx` binary is installed; `pg` only resolves from `lib/db`'s node_modules).

## Railway deploy: pnpm lockfile mismatch (ERR_PNPM_LOCKFILE_CONFIG_MISMATCH)
- This project deploys to Railway via `railway.toml` using `pnpm install --frozen-lockfile`, with source pulled from a connected GitHub repo (`Taskdrip/Bluestar-Alliance`), separate from the Replit git history.
- Root `package.json` had no `packageManager` field, so Railway's Nixpacks builder could resolve a different pnpm version than the one used in this Replit workspace. Different pnpm versions can serialize/parse the `overrides` section of `pnpm-workspace.yaml` differently, tripping `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` on `--frozen-lockfile` even when the lockfile is otherwise up to date locally.
- Fix: pin `"packageManager": "pnpm@<exact-version>"` in root `package.json` so Railway/Nixpacks uses corepack to install the identical pnpm version. Always re-verify with `pnpm install --frozen-lockfile` locally after any `pnpm-workspace.yaml` or lockfile change.
- Main agent cannot `git push`/`git commit` directly (blocked as destructive ops) — the Replit checkpoint system auto-commits at end of turn, but the user must push via the Replit Git pane themselves to get fixes onto GitHub/Railway.
