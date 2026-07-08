<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Conventions

## Commands

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Unit/component tests: `npm run test`
- End-to-end tests: `npm run test:e2e`
- Production build: `npm run build`

## Architecture

- Use the Next.js App Router under `src/app`.
- Keep route files thin; product logic belongs in `src/lib` and feature UI in `src/features`.
- Interactive screens that use browser storage, forms, timers, or drag-and-drop must be Client Components.
- Shared shadcn-style primitives live in `src/components/ui`.
- Supabase client setup lives in `src/lib/supabase`; migrations and seed data live in `supabase/`.
- Preserve workout history by snapshotting routine and exercise names into workout records.
- Keep demo/local data scoped by authenticated user id to mirror row-level security expectations.

## Product Rules

- Mobile-first layout with bottom navigation; desktop uses the sidebar.
- Live workout logging must autosave immediately.
- Destructive actions need a confirmation dialog.
- Use Zod for input validation and React Hook Form for non-trivial forms.
- Tests should cover workout engine behavior, data isolation, and critical user flows.
