# Golden example: Planning Agent

Overené voči aktuálnemu kódu (`ActiveBlocksPanel`, `active_blocks.source_type`).
Toto nie je hypotetický stav.

## Používateľská požiadavka

> Pri aktívnych blokoch na Dnes chcem vidieť, odkiaľ blok pochádza:
> či z denníka, z mentora, z presvedčenia, alebo som ho pridal ručne.

## 1. Pochopenie

Chceš na dashboarde Dnes pri každom otvorenom aktívnom bloku jasnú informáciu
o zdroji bloku. Nemeníš správanie zatvárania ani pridávania blokov, len
zobrazenie pôvodu.

## 2. Produktový kontext

- Aktívne bloky sú pretrvávajúce problémy, kým ich neuzavrieš (`docs/ai/product.md`).
- Dashboard Dnes má držať nízky friction; pridať krátky label je OK, pridávať
  veľký nový panel nie.

## 3. Kontrola dokumentácie

- `business-rules.md`: bloky ostávajú otvorené do explicitného close; severity 1-3.
- `data-model.md`: `active_block_source` = `journal | belief | manual | mentor`.
- `ui-ux.md`: slovenské texty, lucide, bez emoji.

## 4. Kontrola kódu

- `src/db/schema.ts`: stĺpec `source_type` už existuje, default `manual`.
- `src/components/ActiveBlocksPanel.tsx`: zobrazuje title, body, prioritu, tlačidlo
  Vyriešené. **Source type sa dnes nerenderuje.**
- `getActiveBlocks` v `queries.ts` vracia celé active block rows vrátane `sourceType`
  (typ `ActiveBlock`).
- Netreba migráciu novej entity.

## 5. Dotknuté časti

- Primárne: `src/components/ActiveBlocksPanel.tsx`
- Možno drobný helper label v tom istom súbore
- Docs po implementácii: `docs/ai/ui-ux.md` (jedna veta o zobrazení zdroja)

## 6. Business rules

- Nemení close/create flow
- Nemení severity význam
- Nemení auth

## 7. Riziká

- Nízke. Treba len slovenské labely pre 4 enum hodnoty.
- Nezobrazovať surové anglické enumy (`journal`) používateľovi.

## 8. Otázky

Žiadne blokujúce. Voliteľné: chceš zdroj ako samostatný riadok pod prioritou,
alebo v jednom riadku s prioritou? Default návrh: samostatný jemný riadok
„Zdroj: …" pod prioritou, konzistentne s existujúcim `Priorita: …`.

## 9. Návrh (ľudsky)

Momentálne appka zdroj bloku už ukladá, ale na Dnes ho neukazuje.
Navrhujem upraviť iba výpis aktívnych blokov: pri každom bloku pribudne krátky
text zdroja v slovenčine. Pridávanie, zatváranie ani databáza sa nemenia.

## 10. Overenie

- Čo sa zmení: label zdroja pri blokoch s neprázdnym zoznamom
- Čo sa nezmení: empty state quick-add, close action, severity, DB schéma
- Scenár: otvor Dnes s aspoň jedným blokom; vidíš „Zdroj: Denník" (alebo iný)
- Príkaz: `npm run lint`

## 11. Schválenie

Čaká sa na „áno" / úpravu od používateľa.

## 12. Implementačný prompt (po schválení)

```text
Úloha: Zobraziť zdroj aktívneho bloku na dashboarde Dnes.

Scope:
- Uprav iba `src/components/ActiveBlocksPanel.tsx` (prípadne mini helper v tom istom súbore).
- Po zmene doplň jednu vetu do `docs/ai/ui-ux.md` v sekcii Dashboard Dnes.

Správanie:
- Pri každom bloku v zozname zobraz slovenský label podľa `block.sourceType`:
  - journal → „Denník"
  - belief → „Presvedčenie"
  - manual → „Ručne"
  - mentor → „Mentor"
- UI text napr. `Zdroj: Denník` štýlom ako existujúce `Priorita: …` (text-xs text-muted).
- Nepridávaj nové závislosti, karty, emoji ani anglické enumy do UI.

Nesmie sa zmeniť:
- create/close actions, schema, queries, severity logika, empty state správanie
- iné obrazovky

Overenie:
- npm run lint
- Manuálne: na `/` pri otvorenom bloku je viditeľný slovenský zdroj

Ak zistíš, že `ActiveBlock` type `sourceType` neobsahuje, zastav a nahlás.
```
