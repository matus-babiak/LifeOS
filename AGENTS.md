<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Štýl textov

Nikdy nepoužívaj pomlčky „—" ani „–" (v UI textoch, dokumentoch, komentároch, commitoch). Vety preformuluj s čiarkou, dvojbodkou alebo obyčajným spojovníkom "-".

## Cursor Cloud specific instructions

- App: LifeOS, a single-user Next.js 16 (App Router) personal-growth app. UI is in Slovak. Standard scripts live in `package.json` (`dev`, `lint`, `build`, `db:push`).
- Local dev uses an embedded PGlite database (dir `./.pglite`, gitignored) instead of Neon Postgres. No `DATABASE_URL` is needed locally; when it is unset the code falls back to PGlite.
- Auth is disabled locally via `AUTH_DISABLED=1` in `.env.local` (gitignored, so it does not persist across fresh VMs). If `.env.local` is missing, create it with `AUTH_DISABLED=1`, otherwise every route redirects to `/login`. `AUTH_DISABLED` only takes effect when `NODE_ENV !== production`.
- Before the first `npm run dev`, run `npm run db:push` to create the PGlite tables. The `.pglite` dir is not committed, so a fresh VM has no tables until you push the schema; the schema-refresh step is intentionally kept out of the startup update script (it is a migration).
- The six life "areas" are auto-seeded lazily on first DB access (`ensureSeeded` in `src/db/seed.ts`), no separate seed command is needed.
- `npm run build` runs `drizzle-kit push --force && next build`. It works locally against PGlite; all app routes are dynamic (server-rendered on demand), so no DB query runs during static prerender.
- Optional integrations degrade gracefully when their env vars are absent: Gemini AI mentor features (`GEMINI_API_KEY`) return null, and GitHub OAuth login (`AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`/`AUTH_SECRET`/`ALLOWED_GITHUB_LOGIN`) is only used in production. None are required for local development with `AUTH_DISABLED=1`.
- Dev server runs on http://localhost:3000.
