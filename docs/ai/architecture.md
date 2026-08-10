# Architektúra

Zdroj pravdy: aktuálny kód v `src/`, `package.json`, `vercel.json`, `drizzle.config.ts`.

## Stack

| Vrstva | Technológia |
|---|---|
| Framework | Next.js 16.2 (App Router), React 19, TypeScript |
| Štýly | Tailwind CSS 4, `globals.css`, next-themes |
| Ikony | lucide-react |
| DB | Drizzle ORM; Neon Postgres (prod) / PGlite (lokálne `./.pglite`) |
| Auth | Vlastné heslo + HMAC cookie (nie Auth.js / OAuth) |
| AI | Google Gemini (`gemini-flash-latest`) cez REST |
| Deploy | Vercel; cron v `vercel.json` |
| Package manager | npm (`package-lock.json`) |

## Vrstvy

```
Browser (UI komponenty, client forms)
    ↓ Server Actions / RSC fetch
App routes `src/app/(app)/*`
    ↓ requireUser()
Server actions + page loaders
    ↓
`src/db/queries.ts` + priame Drizzle volania
    ↓
`src/db/index.ts` → Neon alebo PGlite
```

AI volania idú cez `src/lib/gemini.ts` a prompt logiku v `src/lib/mentor.ts`
(prípadne `telegram-mentor.ts`, `morning-insight.ts`).

## Kde je čo

| Záujem | Umiestnenie |
|---|---|
| UI stránky | `src/app/(app)/**/page.tsx` |
| UI komponenty | `src/components/*` |
| Mutácie dát | `src/app/(app)/**/actions.ts` |
| Čítanie / view modely | `src/db/queries.ts` |
| Schéma | `src/db/schema.ts` |
| Seed oblastí | `src/db/seed.ts` (`ensureSeeded`) |
| Doménové pravidlá | `src/lib/habits.ts`, `dates.ts`, actions constraints |
| AI prompty | `src/lib/mentor.ts` (+ telegram/morning) |
| Auth | `src/auth.ts`, `src/lib/session.ts`, `session-token.ts`, `src/proxy.ts` |
| Export | `src/lib/export.ts`, `src/app/api/export/route.ts` |
| Telegram | `src/app/api/telegram/route.ts`, `src/lib/telegram*.ts` (`telegram-capture.ts` = `/new`) |
| Cron | `src/app/api/cron/reminders/route.ts` |

## Entry pointy

1. `src/app/layout.tsx` - root HTML, theme, PWA meta
2. `src/app/(app)/layout.tsx` - `requireUser` + `ensureSeeded` + `AppShell`
3. `src/proxy.ts` - ochrana rout (Next 16 naming; funguje ako request gate)
4. `src/app/login/page.tsx` - prihlásenie
5. API: export, telegram, cron

## Spustenie

```bash
npm install
npm run db:push   # schéma do PGlite alebo Neon
npm run dev       # http://localhost:3000
```

Lokálne: bez `DATABASE_URL` = PGlite; `AUTH_DISABLED=1` vypne login mimo produkcie.

## Build a deploy

```text
npm run build  →  drizzle-kit push --force && next build
```

Pri každom Vercel deployi sa schéma syncne na produkčnú DB.
Cron: `GET /api/cron/reminders` denne o `0 5 * * *` (05:00 UTC).

## Env premenné (čítané v kóde)

`DATABASE_URL`, `AUTH_SECRET`, `APP_PASSWORD`, `AUTH_DISABLED`,
`GEMINI_API_KEY`, `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `NODE_ENV`.

## Testy

V projekte nie sú unit/e2e testy. Overenie = `npm run lint`, manuálny scenár,
prípadne `npm run build` pri zmenách build/DB.

## Mapovanie: obrazovka → logika → dáta

| Obrazovka | Komponenty (výber) | Logika | Dáta |
|---|---|---|---|
| `/` Dnes | MorningForm, FocusCheckbox, HabitCheckbox, DailyMentor, ActiveBlocksPanel | actions.ts, habits.ts, dates.ts, mentor | checkins, focus, habits, blocks |
| `/treningy` | NewTrainingForm | treningy/actions | trainings, areas |
| `/treningy/[id]` | TrainingEditor, MilestoneCheckbox, TrainingMentorNote | levelUp rules, mentor | trainings, milestones |
| `/navyky` | NewHabitForm, HabitCheckbox patterns | habits.ts, toggleHabit | habits, habit_logs |
| `/tolerancie` | QuickAdd, TriageCard, Schedule | tolerancie/actions | tolerances |
| `/dennik` | NewJournalForm, JournalBlockCandidates | dennik/actions, mentor extract | journal_entries, active_blocks |
| `/tyzden` | WeekReflection, WeeklyReviewForm | weekSummary, mentor | weekly_reviews, checkins… |
| `/vizia` | VisionEditor, NewGoalForm, GoalCard | vizia/actions | visions, goals, areas |
| `/pozornost` | AttentionItemCard | pozornost/actions | attention_items |
| `/oblasti` | export link | export.ts | areas + related |
| `/poznamky` | NewNoteForm | notes.ts | notes |
| `/myslienky` | NewThoughtForm | myslienky/actions | thoughts |
| `/presvedcenia` | BeliefReframe | mentor reframe | beliefs |
| `/kontext` | ContextUploader | context.ts | context_documents |

## Patterns, ktoré AI má preferovať

1. Server Component page + client island komponenty
2. Mutácie cez `"use server"` actions + `requireUser()`
3. View funkcie v `queries.ts` namiesto duplicitných selectov v pages
4. Doménové helpery v `src/lib/*`
5. `revalidatePath` po mutácii
6. Slovenské UI texty, lucide ikony
7. Pred pridaním novej entity: skontrolovať, či nestačí existujúca tabuľka
