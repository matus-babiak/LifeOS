# LifeOS - produktový dokument

Osobný operačný systém pre rast, sebarealizáciu a vedomé budovanie života.

**Hlavná otázka appky:** „Kým sa stávam a aké kroky ma k tomu každý deň približujú?"
Nie todo-list, ale identitný rámec - každá funkcia posilňuje prácu na tom, *kým sa chcem stať*.

Jediný používateľ: Matúš. Dáta súkromné. UI výhradne po slovensky.

## Model entít

```
Vízia (kým chcem byť - o 1 rok / o 5 rokov)
  └─ Sezóna / Fáza života (12 týždňov, končí retrospektívou)
      └─ Tréning (1-3 aktívne naraz, úroveň 1-5, míľniky, „prečo", denný krok)
          ├─ Návyky (denné kroky tréningu; môžu existovať aj samostatne)
          └─ Reflexie (učenie sa z praxe)
Oblasti života (6): Myseľ a charakter, Zdravie, Kariéra, Financie, Vzťahy, Hodnoty a duchovno
```

Pôvodné koncepty „Projekt" a „Skill tree" boli zámerne rozpustené do Tréningu (menej entít = reálne používanie).

## Kľúčové pravidlá (dohodnuté v discovery)

- **Friction budget:** ranný check-in ≤ 2 min, večerný ≤ 3 min. Celkovo 10-30 min denne.
- **Návyky:** fáza budovania s cieľom **21 dní** (ľahký) / **66 dní** (náročný) / vlastné číslo.
  Vynechaný deň **neresetuje** počítadlo - počítajú sa nazbierané dni. Platí pravidlo „nikdy 2× po sebe"
  (appka zvýrazní až druhé vynechanie). Po dosiahnutí cieľa stav „zabehnutý". Žiadne klasické streaky.
- **Úrovne tréningu:** míľnikový model - každá úroveň má 3-5 konkrétnych míľnikov; level-up po ich splnení + vlastnom usúdení.
- **Denný fokus:** max 3 položky, predvyplnené z denných krokov aktívnych tréningov. Prenášanie nesplnených vyladíme počas praxe.
- **Týždenná reflexia (srdce appky):** nedeľa. Appka ju **predpripraví z denných dát** (energia, návyky, témy z denníka, kroky tréningov) - používateľ len číta a odpovedá na 3 otázky: najväčšie víťazstvo / čo sa opakovalo / čo zmením. Rieši zlyhanie z Obsidianu: prázdna stránka + 45 min práce → 10 min čítania.
- **Tón:** „identitné hlasy" namiesto „splnené" (+1 hlas pre človeka, ktorý…). Žiadne falošné percentá - len úrovne, míľniky, týždenná konzistencia (5/7).
- **Gamifikácia minimálna:** úrovne + hlasy + konzistencia. Žiadne XP, body, odznaky.

## UX

- 6 sekcií: **Dnes** (dashboard), **Tréningy**, **Denník**, **Týždeň**, **Vízia**, **Oblasti**.
- „Dnes" má dva režimy: ráno check-in + fokus, večer (po 18:00) večerná reflexia + zhodnotenie návykov.
- Pokojný minimalizmus: veľa priestoru, jedna akcentová farba + jemné farby oblastí, **žiadne emoji** - lucide ikony.
- Plnohodnotná responzivita mobil aj desktop (sidebar / hamburger). Dark/light mode.
- **PWA**: manifest + apple-touch-icon → ikona na ploche cez Safari, standalone režim.

## Technika

- Next.js (App Router, TypeScript), Tailwind CSS, lucide-react, next-themes.
- Vercel Postgres (Neon) + Drizzle ORM. Privátny repo `matus-babiak/LifeOS` → auto-deploy Vercel.
- Auth: GitHub OAuth (Auth.js), povolený iba vlastníkov účet. Online-only (offline až neskôr).
- **Markdown export** (ZIP) vo formáte vaultu: `1 Sebareflexia/1 Denné poznámky/RRRR/M Mesiac/DD.MM.RRRR.md`,
  týždenné reflexie do `2 Weekly review`. Slúži aj ako záloha.

## Etapy výstavby

| Etapa | Obsah |
|---|---|
| 1 | Auth, layout, PWA, dark/light + denný check-in (ráno/večer) + fokus + návyky - hotovo |
| 2 | Tréningy (úrovne, míľniky, denné kroky) + reflexný denník - hotovo |
| 3 | Týždenná reflexia (auto-súhrn) + sezóna + vízia - hotovo |
| 4 | Markdown export + prehľad oblastí + ladenie |

Odsunuté za MVP: AI mentor (dátový model je naň pripravený), priama synchronizácia s Obsidian vaultom.
Štartovacie dáta: predvyplnených 6 oblastí + tréningy Predaj, Zdravie (10 000 krokov), Trpezlivosť.
