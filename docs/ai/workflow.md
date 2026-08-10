# AI Development Workflow

Oddelenie plánovania od implementácie je povinné pre významnejšie zmeny.

## Tok

```
Ľudská veta
   ↓
/lifeos-plan   (Planning Agent, read-only voči aplikácii)
   ↓
pochopenie + produkt + docs + kód
   ↓
otázky (ak treba) → odpovede používateľa
   ↓
návrh ľudskou rečou + riziká + overenie
   ↓
schválenie používateľom
   ↓
IMPLEMENTAČNÝ PROMPT (technicky presný)
   ↓
/lifeos-implement   (Implementation Agent)
   ↓
overenie stavu → implementácia → lint/test/scenár
   ↓
stručné zhrnutie výsledku
```

## Kedy stačí ísť priamo na implementáciu

Len pri triviálnych, jednoznačných a lokálnych zmenách, napr.:

- preklep v slovenskom texte,
- zjavný bug s jednoriadkovou opravou,
- úprava AI docs bez zmeny `src/`.

Aj vtedy agent nesmie rozšíriť scope. Pri pochybnosti vždy `/lifeos-plan`.

## Povinné kontroly Planning Agenta

1. Pochopiť zámer vlastnými slovami
2. Skontrolovať `docs/ai/product.md`
3. Skontrolovať relevantné KB dokumenty
4. Skontrolovať reálny kód (nie domnienky)
5. Identifikovať dotknuté súbory / vrstvy
6. Skontrolovať patterns a business rules
7. Riziká a nejasnosti
8. Najmenšia správna zmena
9. Spôsob overenia
10. Až po schválení: implementačný prompt

## Povinné kontroly Implementation Agenta

1. Prečítať schválený prompt
2. Overiť, že kód stále sedí s predpokladmi
3. Implementovať len scope
4. Spustiť relevantné overenie (`lint`, manuálny scenár, prípadne build)
5. Aktualizovať KB, ak sa zmenil systémový fakt
6. Pri konflikte: zastaviť a opýtať sa

## Výstup Planning Agenta (štruktúra pre človeka)

1. **Čo som pochopil**
2. **Čo som overil v produkte a kóde**
3. **Čo navrhujem zmeniť** (ľudsky)
4. **Čo zostane nezmenené**
5. **Riziká / otázky**
6. **Ako overíme, že je to správne**
7. **Čakám na schválenie**
8. Po schválení: **Implementačný prompt** (samostatný blok)

## Testovateľnosť

Pri každej významnejšej zmene definovať:

- čo sa má zmeniť,
- čo sa nesmie zmeniť,
- používateľský scenár,
- príkazy na overenie (aspoň `npm run lint` ak sa mení TS/TSX).
