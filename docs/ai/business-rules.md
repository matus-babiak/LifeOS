# Business rules

Pravidlá overené v kóde. AI ich pri vývoji nesmie porušiť bez explicitného
schválenia používateľa (a aktualizácie tohto dokumentu).

## Kritické

1. **Jediný používateľ + auth gate**
   - Session cookie `lifeos_session` (HMAC cez `AUTH_SECRET`).
   - Pages/actions/export volajú `requireUser()`.
   - `AUTH_DISABLED` funguje len mimo `production`.
   - Verejné: `/login`, `/ikona`, `/api/telegram*`, `/api/cron/*`.

2. **Fokus max 3 položky na deň**
   - `addFocus` vráti early-return pri `total >= 3`.
   - `saveMorning` ukladá len `items.slice(0, 3)`.

3. **Návyky: nazbierané dni, nie streak reset**
   - Progress = `COUNT(habit_logs)`.
   - Vynechaný deň neresetuje počítadlo.
   - Pri `collected >= targetDays` → status `established`.

4. **Level-up tréningu**
   - Len ak všetky míľniky aktuálnej úrovne sú `done` a `level < 5`.

5. **Aktívne bloky ostávajú otvorené**
   - Otvorené = `closed_at IS NULL`.
   - Uzavretie len explicitnou akciou (UI alebo Telegram callback).

6. **Ciele majú oblasť a termín**
   - `areaId` povinné (existujúca oblasť života).
   - `dueDate` povinné (ISO dátum).
   - `doneAt` null = otvorený; nastavené = dosiahnutý.

7. **Cron a Telegram security**
   - Cron: Bearer `CRON_SECRET`.
   - Telegram webhook: overenie secret tokenu podľa konfigurácie.
   - AI nesmie odstrániť tieto kontroly.

8. **Súkromie dát**
   - Žiadny multi-tenant leak, žiadne logovanie secretov/hesiel.
   - Export a mentor kontext ostávajú viazané na session / bot chat ID.

## Dôležité

1. **Večerný režim od 18:00** (`Europe/Bratislava`) cez `isEvening()`.
2. **„Nikdy 2× po sebe"** pri návykoch je UI upozornenie (`missedYesterday`), nie hard block.
3. **Cieľ návyku**: default 21; voľby 66 alebo custom 7-365.
4. **Frekvencia návyku**: daily / weekdays / per_week (`perWeekTarget` 1-7).
5. **Severity aktívnych blokov**: 1 vysoká, 2 stredná, 3 nízka; null = bez priority; sort null last.
6. **Journal AI kandidáti**: max 2; user musí akceptovať pred vytvorením bloku.
7. **Tolerancie**: najprv text; triage vyžaduje area + energy 1-10.
8. **Týždenná reflexia**: win / pattern / change + auto-súhrn (+ AI cache).
9. **Tréningy 1-3 aktívne**: produktové očakávanie; kód má soft warning pri ≥4, `createTraining` neblokuje.
10. **Gemini bez kľúča**: AI features ticho degenerujú na `null` / fallback, appka ostáva použiteľná.
11. **UI po slovensky**, bez emoji (lucide ikony).
12. **Identitný tón**: hlasy („+1 hlas…"), nie falošné XP/body/odznaky.

## Bežné

1. Friction copy: ráno ~2 min, večer ~3 min.
2. Notes kategórie = 6 area slugov + `lifeos`.
3. Attention buckets: `now` | `later`.
4. Context upload limity: max 5000 docs, 500_000 znakov/súbor, mentor budget ~400k znakov.
5. Telegram odpoveď cieľ ~4000 znakov.
6. Seed oblastí je idempotentný.
7. Dark/light mode cez next-themes.
8. PWA manifest + ikony.

## Poznámky k rozporom

- PRODUCT.md hovorí „žiadne falošné percentá", ale UI návykov percentá zobrazuje.
  Pri nových features nepridávaj ďalšie gamifikačné metriky bez schválenia.
- PRODUCT.md hovorí max 1-3 aktívne tréningy ako tvrdé pravidlo; kód to nevynucuje.
  Nesmieš bez schválenia zmeniť na hard block ani tvrdiť, že hard block už existuje.
