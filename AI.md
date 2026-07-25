# LifeOS AI mentor: ako to funguje

Ukážka AI vrstvy v LifeOS. Mentor nie je chatovací bot, ale kontextový komentár nad tvojimi dátami (návyky, energia, sezóna, denník, tréningy, presvedčenia).

## Na čo to slúži

AI dopĺňa identitný rámec appky: *kým sa stávam a čo ma k tomu dnes približuje*.

| Funkcia | Kde | Účel |
|---|---|---|
| Denný mentor | stránka **Dnes** | 2-4 vety, ktoré ťa dnes nakopnú do akcie |
| Týždenná AI reflexia | stránka **Týždeň** | interpretácia dát týždňa popri auto-súhrne |
| Mentorská poznámka k tréningu | detail **Tréningu** | krátky postreh k úrovni, míľnikom a denníku |
| Reframe presvedčenia | stránka **Presvedčenia** | vzorec myslenia + rastový reframe + malý krok |

Bez `GEMINI_API_KEY` appka funguje ďalej: AI bloky sa jednoducho nezobrazia (`null`).

## Nastavenie

1. Získaj API kľúč z [Google AI Studio](https://aistudio.google.com/apikey).
2. Do `.env.local` (lokálne) alebo do env premenných na Verceli doplň:

```bash
GEMINI_API_KEY=tvoj_kluc
```

3. Model je pevne nastavený v `src/lib/gemini.ts` na `gemini-flash-latest`.
4. Volanie ide na Google Generative Language API (`generateContent`). Žiadny SDK, len `fetch`.

```ts
// src/lib/gemini.ts (skrátene)
const MODEL = "gemini-flash-latest";

export async function generateText(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  // POST .../models/${MODEL}:generateContent
  // pri chybe alebo prázdnej odpovedi → null
}
```

## Architektúra prepojenia

```
UI (Server Component + Suspense)
  → queries.ts (zber kontextu z DB + cache)
    → mentor.ts (zostavenie promptu)
      → gemini.ts (volanie API)
        → uloženie výsledku do DB
```

### Vrstvy

1. **UI** (`DailyMentor`, `WeekReflection`, `TrainingMentorNote`, `BeliefReframe`)  
   Async server komponenty. Na stránke **Dnes** a **Presvedčenia** bežia v `Suspense` so skeletonom, aby sa zvyšok stránky vykreslil hneď.

2. **Orcheštrácia** (`src/db/queries.ts`)  
   Načíta relevantné riadky z Postgresu, zostaví kontext, zavolá `generateText`, výsledok uloží (cache), vráti text do UI.

3. **Prompty** (`src/lib/mentor.ts`)  
   Štyri builder funkcie: tón mentora, jazyk (slovenčina), dĺžka odpovede a štruktúra kontextu.

4. **API klient** (`src/lib/gemini.ts`)  
   Jediné miesto s modelom a HTTP volaním. Fail-soft: chýbajúci kľúč alebo chyba = `null`.

### Cache (aby sa Gemini nevolalo zbytočne)

| Výstup | Uloženie | Opätovné generovanie |
|---|---|---|
| Denný mentor | `daily_checkins.mentor_message` | raz denne (ak už existuje, len číta) |
| Týždenná reflexia | `weekly_reviews.ai_reflection` + `ai_reflection_date` | raz denne |
| Poznámka k tréningu | `trainings.mentor_note` + `mentor_note_date` | raz denne |
| Reframe | `beliefs.reframe` | raz natrvalo (kým sa nezmaže záznam) |

## Funkcionality podrobnejšie

### 1. Denný mentor

**Kontext do promptu:** aktívna sezóna, minulá týždenná reflexia, konzistencia návykov za 14 dní, posledné zápisy denníka, dnešná energia, identitný fokus, stav návykov (vrátane „včera vynechané"), denné kroky tréningov.

**Tón:** prísny, ale podporujúci. Bez pozdravu, rovno na vec. Prepája dnešok s dlhším vzorcom.

### 2. Týždenná AI reflexia

**Kontext:** priemerná energia, štatistiky návykov, počet zápisov denníka, predsavzatia z minulého týždňa.

**Účel:** nie zopakovať čísla, ale ukázať súvislosť alebo vzorec. Ide popri pravidlovom auto-súhrne z `weekSummary`.

### 3. Mentorská poznámka k tréningu

**Kontext:** názov, úroveň 1-5, PRED / prečo / PO, míľniky aktuálnej úrovne, súvisiace zápisy denníka.

**Účel:** 1-3 vety povzbudenia alebo konkrétneho postrehu na detaile tréningu.

### 4. Reframe presvedčenia

**Kontext:** samotný text limitujúcej myšlienky.

**Štruktúra odpovede (3 kroky):**
1. pomenovať vzorec alebo skreslenie myslenia,
2. dať reframe k rastovému mindsetu,
3. navrhnúť jeden malý krok alebo overovaciu otázku.

## Tok dát (príklad: denný mentor)

```
1. Používateľ otvorí /
2. page.tsx renderuje <Suspense><DailyMentor /></Suspense>
3. getMentorMessage() skontroluje mentor_message v check-ine
4. Ak chýba: z DB zoberie sezónu, review, logy, denník
5. buildMentorPrompt(ctx) → textový prompt
6. generateText(prompt) → Gemini
7. Výsledok sa uloží do daily_checkins
8. UI zobrazí text (alebo nič, ak Gemini zlyhá)
```

## Súbory na rýchlu orientáciu

```
src/lib/gemini.ts          # API klient, model, env kľúč
src/lib/mentor.ts          # všetky prompty a typy kontextu
src/db/queries.ts          # getMentorMessage, getWeekAiReflection,
                           # getTrainingMentorNote, getBeliefReframe
src/db/schema.ts           # mentor_message, ai_reflection, mentor_note, reframe
src/components/DailyMentor.tsx
src/components/WeekReflection.tsx
src/components/TrainingMentorNote.tsx
src/components/BeliefReframe.tsx
```

## Dizajnové rozhodnutia (pre demo AI nástroja)

- **Kontext z DB, nie chat história.** Mentor vie len to, čo LifeOS už zbiera.
- **Jedno volanie = jedna krátka odpoveď.** Žiadny streaming chat, žiadne tool calling.
- **Cache first.** Opätovné načítanie stránky neplaťí API znova.
- **Graceful degradation.** Bez kľúča alebo pri chybe UI ostáva použiteľné.
- **Suspense na pomalých miestach.** AI sa dopíše, zvyšok dashboardu je hneď.
- **Slovenčina a mentorský tón** sú zakódované v promptoch, nie v UI copy.
