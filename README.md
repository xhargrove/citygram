# CITYGRAM

City-first social (Next.js 15 + Supabase). **Setup, routes, product rules, and merge expectations are documented in [`CITYGRAM.md`](./CITYGRAM.md)** — start there.

## Quick start

```bash
npm install
npm run dev
```

Configure environment variables from [`.env.local.example`](./.env.local.example) (see `CITYGRAM.md`).

## Scripts

| Command        | Purpose              |
| -------------- | -------------------- |
| `npm run dev`  | Development server   |
| `npm run build` | Production build    |
| `npm run start` | Run production build |
| `npm run lint` | ESLint               |

## Deployment

Hosting is not wired in-repo (no `vercel.json` / GitHub Actions). Use `CITYGRAM.md` plus your host’s UI: set the same `NEXT_PUBLIC_*` variables as local, point Supabase Auth redirect URLs at `{your-app-url}/auth/callback`, and apply `supabase/migrations` + `supabase/storage.sql` on the production Supabase project.
