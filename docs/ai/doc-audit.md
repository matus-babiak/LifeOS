# Audit pôvodnej dokumentácie

Audit pri vzniku AI Knowledge Base. Kód je technická pravda.

## Aktuálne (zodpovedá realite)

| Dokument / časť | Poznámka |
|---|---|
| `PRODUCT.md` - hlavná otázka appky, identitný rámec, single user, SK UI | Platí |
| `PRODUCT.md` - model Vízia → Sezóna → Tréning → Návyky/Reflexie | Platí v schéme |
| `PRODUCT.md` - friction budget, návyky bez streak resetu, míľniky, max 3 fokus | Väčšinou platí (fokus tvrdo v kóde) |
| `PRODUCT.md` - 6 oblastí, PWA, dark/light, markdown export | Platí |
| `README.md` - lokálny dev s PGlite, Vercel+Neon setup, env zoznam | Väčšinou platí |
| `README.md` - `/ikona`, PWA inštrukcie | Platí |
| `AGENTS.md` - Next.js docs warning, zákaz dlhých pomlčiek | Platí a ostáva v platnosti |

## Zastarané

| Tvrdenie | Kde | Realita |
|---|---|---|
| Auth: GitHub OAuth (Auth.js) | `PRODUCT.md`, `README.md` Stack | Heslo + HMAC cookie; žiadny `next-auth` |
| AI mentor odsunutý za MVP | `PRODUCT.md` etapy | Mentor, Telegram, cron, reframe, context upload sú v kóde |
| UX má 6 sekcií | `PRODUCT.md` | Nav má 13 položiek |
| Seed: oblasti + tréningy Predaj/Zdravie/Trpezlivosť | `PRODUCT.md` | Seed len 6 oblastí |
| Cron posiela top aktívny blok | `README.md` | Cron posiela morning insight z denníka/beliefs/thoughts |
| Stack riadok Auth.js GitHub OAuth | `README.md` | Password auth |

## Duplicitné

- `CLAUDE.md` iba odkazuje na `AGENTS.md` (zámerne tenké, OK)
- Produktový popis sa opakuje v `README.md` úvode a `PRODUCT.md` (OK ako entry + detail)

## Konfliktné

| Konflikt | Docs | Kód |
|---|---|---|
| Max 1-3 aktívne tréningy ako tvrdé pravidlo | PRODUCT model | Soft warning v UI; `createTraining` neblokuje |
| Žiadne falošné percentá | PRODUCT tón | Habit UI zobrazuje % progress |
| AI mimo MVP vs AI v appke | PRODUCT etapa 4 poznámka | Viaceré AI features |

## Chýbajúce (pred touto KB)

- Aktuálny zoznam obrazoviek a flows
- Reálny auth model
- Mapa AI features
- Business rules s prioritou
- Popis Telegram + cron správania podľa kódu
- AI development workflow (plan vs implement)
- Harness / safety constraints
- Golden example plánovania

Tieto medzery rieši `docs/ai/*`.

## Pravidlo údržby

`PRODUCT.md` a `README.md` sa v tejto fáze **neprepisujú potichu**.
Opravy faktov v starých docs patria do samostatnej, schválenej úlohy.
Do vtedy AI používa `docs/ai/` + kód.
