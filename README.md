# CITYGRAM

City-first social (Next.js 15 + Supabase).

| Doc | Role |
|-----|------|
| **[`CITYGRAM.md`](./CITYGRAM.md)** | **Primary** — product rules, routes, setup, production hosting, **launch gate** checklist |
| **[`docs/context/handoff-overview.md`](./docs/context/handoff-overview.md)** | **Secondary** — engineer handoff, deployment status, invariant summary |

## Quick start

```bash
npm install
npm run dev
```

Copy [`.env.local.example`](./.env.local.example) to `.env.local` and set variables (details in **`CITYGRAM.md`** → Setup).

## Scripts

| Command         | Purpose              |
| --------------- | -------------------- |
| `npm run dev`   | Development server   |
| `npm run build` | Production build     |
| `npm run start` | Run production build |
| `npm run lint`  | ESLint               |

## Deployment

- **Build:** the repo is **build-ready** (`npm run lint` + `npm run build`). There is **no** `vercel.json` and **no** GitHub Actions workflow—**not required** for a first deploy; connect the repo in your host’s UI (e.g. Vercel) and set environment variables there.
- **Still required for production:** production Supabase project; run `supabase/migrations/001_citygram_schema.sql`, optional `supabase/seed.sql`, Storage bucket **`post-media`**, then `supabase/storage.sql`; set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and **`NEXT_PUBLIC_APP_URL`** (canonical HTTPS origin); in Supabase Auth, allow **`{NEXT_PUBLIC_APP_URL}/auth/callback`**. Full steps: **`CITYGRAM.md`** → *Production hosting*.

## Launch gate

Before release, run the manual checklist in **`CITYGRAM.md`** → **Launch gate (manual smoke test)** (signup → feed → explore / passport / city → create with media → notifications → sign out/in → confirm home-city-only posting).
