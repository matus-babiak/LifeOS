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
7. Vízia `/vizia`
8. Pozornosť `/pozornost`
9. Oblasti `/oblasti`
10. Poznámky `/poznamky`
11. Myšlienky `/myslienky`
12. Presvedčenia `/presvedcenia`
13. Kontext `/kontext`

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

## Friction budget

- Ranný check-in má byť krátky (copy ≈ 2 min)
- Večerný ≈ 3 min
- Nové polia na Dnes pridávaj len so silným dôvodom

## Form patterns

- Server actions cez `<form action={...}>`
- Optimistic / client toggle pri focus a habits (návratová hodnota action)
- Loading cez `loading.tsx` + skeleton komponenty

## Prístupnosť a jazyk

- Všetky používateľské texty po slovensky
- `lang="sk"` v root layoute
- Pri nových textoch nepoužívaj pomlčky „—" ani „–" (pozri AGENTS.md)

## Čo AI nemá robiť v UI

- Nepridávať dashboard clutter (stat strips, promo badges) bez schválenia
- Nemeniť navigáciu „len tak" (13 položiek je citlivé)
- Nezavádzať anglické UI labels
- Nepridávať emoji
