# Dátový model

Zdroj: `src/db/schema.ts`. Enumy a tabuľky nižšie sú skrátený prehľad pre AI,
nie náhrada schémy. Pri zmene modelu vždy uprav aj túto stránku.

## Hierarchia (produktová)

```
Vízia (1y / 5y)
Ciele (area + dueDate, doneAt = dosiahnuté)
Tréning (area, level 1-5, status)
  ├─ Míľniky (per level)
  └─ Návyky (voliteľne viazané na tréning)
```

Ďalšie paralelné entity: check-iny, fokus, denník, tolerancie, týždenné review,
poznámky, AI poznámky, myšlienky, presvedčenia, progress focus, pozornosť, aktívne bloky, context dokumenty.

## Enumy

- `habit_frequency`: `daily` | `weekdays` | `per_week`
- `habit_status`: `building` | `established` | `archived`
- `training_status`: `active` | `paused` | `completed`
- `attention_bucket`: `now` | `later`
- `active_block_source`: `journal` | `belief` | `manual` | `mentor`

## Tabuľky

| Tabuľka | Účel | Kľúčové polia |
|---|---|---|
| `areas` | 6 oblastí života (seed) | slug, name, color, icon, position |
| `goals` | Ciele podľa oblasti | areaId, title, dueDate, doneAt |
| `trainings` | Identitný tréning | areaId, level, dailyStep, status, mentorNote* |
| `milestones` | Míľniky úrovne | trainingId, level, done |
| `habits` | Návyky | targetDays, frequency, status, identity |
| `habit_logs` | Splnenie dňa | unique (habitId, date) |
| `daily_checkins` | Ráno/večer + mentor cache | date unique, energy, wins… |
| `focus_items` | Denný fokus | date, text, done, position |
| `journal_entries` | Reflexný denník | situation…principle |
| `tolerances` | Energetické úniky | text → areaId+energy triage |
| `weekly_reviews` | Týždenná reflexia | weekStart unique, win/pattern/change |
| `notes` | Kategorizované poznámky | category (area slug alebo `lifeos`) |
| `ai_notes` | Poznámky z Telegram AI odpovedí | category (voľný SK štítok), content |
| `beliefs` | Obmedzujúce presvedčenia | text, reframe, resolved |
| `thoughts` | Voľné myšlienky | content |
| `progress_focus_items` | AI návrhy na vedomú prácu | title, summary, detail, nextStep, status, fingerprint |
| `context_documents` | Obsidian palivo pre AI | path unique, noteDate |
| `visions` | Vízia | horizon `1y`/`5y` unique |
| `attention_items` | Kam ide pozornosť | bucket now/later |
| `active_blocks` | Pretrvávajúce bloky | closedAt null = open, severity 1-3 |

## Seed

`ensureSeeded()` vloží iba 6 oblastí, ak tabuľka `areas` je prázdna.
`ensureSchema()` doplní `goals`, `progress_focus_items` a `ai_notes` a odstráni zastaranú `seasons`.
Štartovacie tréningy z PRODUCT.md **nie sú** v seed kóde.

## Migračná politika

Projekt používa `drizzle-kit push` (nie verzované SQL migrácie v repo).
Build: `drizzle-kit push --force && next build`.

AI preto:

- mení `schema.ts` opatrne,
- nepridáva destruktívne zmeny stĺpcov bez explicitného schválenia,
- aktualizuje `data-model.md` po zmene schémy.
