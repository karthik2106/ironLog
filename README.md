# IronLog

IronLog is a mobile-first Push, Pull, Legs workout tracker built for fast use between sets. It supports editable routines, live workout logging, rest timers, workout history, progress charts, settings, exports, and a seeded local demo mode.

## Technology Stack

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-style local components
- Supabase Auth and PostgreSQL schema with RLS
- Neon PostgreSQL cloud sync option
- Recharts
- Zod
- React Hook Form
- Vitest and Playwright

## Installation

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use **Demo mode** to test without cloud credentials.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Apply the migration in `supabase/migrations/001_initial_schema.sql`.
5. Apply the seed in `supabase/seed/001_seed_exercises.sql`.
6. Enable email auth in Supabase Auth settings.

The schema includes normalized tables for profiles, exercises, routines, routine exercises, workout sessions, workout exercises, workout sets, personal records, and user settings. RLS policies restrict user-owned data to the authenticated user while allowing shared exercise library reads.

## Neon Cloud Sync Setup

Set `DATABASE_URL` in `.env.local` or in your deployment environment:

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

Apply the migration in `neon/migrations/001_cloud_store.sql`.

When `DATABASE_URL` is configured, normal email/password sign up and sign in use Neon. Passwords are hashed server-side with Node `scrypt`, and workout data is stored per user in PostgreSQL so the same account can be used from another device.

## Development Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Demo Mode

If cloud environment variables are absent, IronLog runs as a local demo app. Data is seeded with the requested Push, Pull, and Legs routines and persists in browser storage by local user id.

## Data Export

Settings includes JSON and CSV export for workout history. Completed workout history uses exercise and routine snapshots so historical records remain stable after routine edits or exercise replacements.

## Deployment

Deploy to Vercel or any Next.js-compatible host. Configure `DATABASE_URL` for Neon cloud sync, or the Supabase environment variables if you choose Supabase, and apply the matching database migrations before accepting production users.
