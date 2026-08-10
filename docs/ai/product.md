# Produkt: LifeOS

Stav overený z kódu (schéma, stránky, server actions, AI liby).
Dátum baseline: commit na `main` v čase vzniku tejto KB.

## Čo to je

LifeOS je osobný operačný systém pre rast a vedomé budovanie života.
Hlavná otázka appky: „Kým sa stávam a aké kroky ma k tomu každý deň približujú?"

Nie je to klasický todo-list. Funkcie majú posilňovať prácu na identite
(kým sa chcem stať), nie len checkboxovanie úloh.

## Pre koho

- Jediný používateľ: Matúš
- Dáta súkromné
- UI výhradne po slovensky
- Online-only (offline sync nie je v kóde)

## Aký problém rieši

Pomáha denne a týždenne udržiavať spojenie medzi víziou, cieľmi, tréningami, návykmi,
reflexiou a pretrvávajúcimi mentálnymi blokmi. Rieši aj zlyhanie „prázdnej stránky"
pri týždennej reflexii: appka pripraví súhrn z denných dát.

## Hlavný používateľský cieľ

Každý deň vedieť:

1. na čom dnes záleží (fokus),
2. ktoré návyky a tréningy posúvajú identitu,
3. čo ma blokuje (aktívne bloky, tolerancie),
4. čo sa z praxe učím (denník, týždeň).

## Hlavné flows

### Ráno (dashboard `/`, pred 18:00 Bratislava)

1. Pozrieť otvorené aktívne bloky
2. Rýchlo zapísať toleranciu („Čo ma práve štve?")
3. Prečítať denného AI mentora (ak je `GEMINI_API_KEY`)
4. Ranný check-in: energia 1-10, identitný fokus, 1-3 fokus položky
5. Označiť návyky na dnes

### Večer (dashboard `/`, od 18:00)

1. Večerná reflexia: víťazstvá / čo som sa naučil / čo zlepším
2. Zhodnotenie návykov a fokusu

### Tréning

1. Zoznam tréningov → detail
2. Míľniky úrovne, level-up po splnení míľnikov (max level 5)
3. Denný krok tréningu sa predvyplní do ranného fokusu (max 3)

### Reflexia

1. Denník: Situácia → Reakcia → Pocit → Čo to ukazuje → Lekcia → Princíp
2. AI môže navrhnúť kandidátov na aktívne bloky (max 2), používateľ akceptuje
3. Týždeň: auto-súhrn + 3 otázky + voliteľná AI reflexia

### AI mentor (implementované)

- Denný mentor na dashboarde
- Telegram chat s kontextom LifeOS + Obsidian poznámky (`/kontext`)
- Reframe obmedzujúcich presvedčení
- Mentor note pri tréningu
- Cron ráno (~05:00 UTC): morning insight do Telegramu

## Hlavné obrazovky (nav)

Dnes, Tréningy, Návyky, Tolerancie, Denník, Týždeň, Vízia a ciele, Pozornosť,
Oblasti, Poznámky, Myšlienky, Presvedčenia, Kontext.

Plus: `/login`, `/ikona` (verejná), `/treningy/[id]`.

## MVP podľa aktuálneho kódu

V kóde je hotové viac než pôvodný PRODUCT.md predpokladal:

- Denný check-in, fokus, návyky
- Tréningy + míľniky
- Denník, týždeň, vízia a ciele (bez sezón)
- Oblasti + markdown export
- Tolerancie, pozornosť, poznámky, myšlienky, presvedčenia
- Aktívne bloky
- AI mentor (web + Telegram + cron)
- Upload Obsidian kontextu

## Mimo scope (zatiaľ neznáme / nie v kóde)

- Offline režim
- Multi-user / tímové funkcie
- Priama continuous sync s Obsidian vaultom (je len upload súborov)
- Klasické XP, body, odznaky
- Automatické tvrdé limity „max 3 aktívne tréningy" (v UI je soft warning)

## Produktové rozhodnutia (stále platné, pokiaľ kód nehovorí inak)

- Identitný rámec namiesto todo mindsetu
- Friction budget: ráno ≤ 2 min, večer ≤ 3 min (copy v UI)
- Návyky: nazbierané dni, nie klasické streaky; „nikdy 2× po sebe" je UI upozornenie
- Gamifikácia minimálna: úrovne, hlasy, konzistencia
- Pokojný minimalizmus, lucide ikony, žiadne emoji v UI
- Dark/light mode, PWA

## Neznáme

- Presný produkčný obsah DB (tréningy mimo seedu)
- Či sa mŕtvy kód okolo „oldest open block" reminder ešte plánuje zapojiť
- Preferovaná budúca navigácia (13 položiek vs pôvodných 6)
