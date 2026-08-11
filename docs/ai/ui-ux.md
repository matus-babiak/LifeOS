# UI / UX

Zdroj: `AppShell.tsx`, page komponenty, PRODUCT rozhodnutia overené voči kódu.

## Navigácia (aktuálna)

Definovaná v `src/components/AppShell.tsx`:

1. Dnes `/`
2. Tréningy `/treningy`
3. Návyky `/navyky`
4. Tolerancie `/tolerancie`
5. Denník `/dennik`
6. Týždeň `/tyzden`
7. Vízia a ciele `/vizia`
8. Progress focus `/progress-focus`
9. Pozornosť `/pozornost`
10. Oblasti `/oblasti`
11. Poznámky `/poznamky`
12. Myšlienky `/myslienky`
13. Presvedčenia `/presvedcenia`
14. Kontext `/kontext`

Desktop: ľavý sidebar. Mobil: top bar + slide-over menu.
Brand: „LifeOS" + logo mark.

## Vizuálny jazyk

- Pokojný minimalizmus, veľa priestoru
- Jedna akcentová farba + jemné farby oblastí
- Lucide ikony, **žiadne emoji** v UI
- Dark / light mode
- Karty so `rounded-2xl border border-line` sú existujúci pattern dashboardu
  (pri nových screens zachovať konzistenciu s existujúcim systémom)

## Dashboard Dnes

- Pred 18:00: „Dobré ráno", ranný check-in ak nie je hotový
- Od 18:00: „Dobrý večer", večerná reflexia
- Sekcie: aktívne bloky, tolerancie quick-add, mentor, check-in, fokus, návyky, večer

## Vízia a ciele

- Dlhodobá vízia: O 1 rok, O 5 rokov
- Ciele: pri vytvorení výber oblasti + termín; filter podľa oblasti; editácia, zmazanie, dosiahnuté
- Sezóny už nie sú súčasťou UI

## Friction budget

- Ranný check-in má byť krátky (copy ≈ 2 min)
- Večerný ≈ 3 min
- Nové polia na Dnes pridávaj len so silným dôvodom

## Form patterns

- Server actions cez `<form action={...}>`
- Optimistic / client toggle pri focus a habits (návratová hodnota action)
- Loading cez `loading.tsx` + skeleton komponenty
- `input[type=date]` má globálne iOS štýly v `globals.css`, aby ladil s text/select

## Prístupnosť a jazyk

- Všetky používateľské texty po slovensky
- `lang="sk"` v root layoute
- Pri nových textoch nepoužívaj pomlčky „—" ani „–" (pozri AGENTS.md)

## Čo AI nemá robiť v UI

- Nepridávať dashboard clutter (stat strips, promo badges) bez schválenia
- Nemeniť navigáciu „len tak" (14 položiek je citlivé)
- Nezavádzať anglické UI labels
- Nepridávať emoji
