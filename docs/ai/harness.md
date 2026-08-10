# Harness: ochrana pred nebezpečnými zmenami

Harness je primeraný single-user LifeOS appke. Neblokuje bežný vývoj,
ale bráni katastrofám a scope creepu.

## Zakázané bez explicitného schválenia v implementačnom prompte

1. **Destruktívne DB operácie**
   - Drop tabuľky / databázy
   - Hromadný delete produkčných dát
   - `clearContextDocuments` a podobné wipe akcie spúšťané „navyše"
   - Rizikové zmeny schémy (rename/drop column) cez `drizzle-kit push --force`

2. **Produkčná konfigurácia**
   - Commitovanie `.env*`, secretov, tokenov
   - Zmena Vercel cron, auth cookie security flags, webhook secret logiky
   - Zapnutie `AUTH_DISABLED` správania v produkcii

3. **Security**
   - Odstránenie `requireUser()` / proxy checkov
   - Oslabenie cron Bearer / Telegram secret overenia
   - Logovanie hesiel, tokenov, celého mentor kontextu do client bundle

4. **Scope a architektúra**
   - Veľké refaktory „pri tejto príležitosti"
   - Premenovanie celých vrstiev / navigácie bez požiadavky
   - Pridanie novej entity, keď stačí existujúca
   - Odstránenie existujúcej funkcionality bez zadania

5. **Produktové invariantty**
   - Porušenie kritických pravidiel v `business-rules.md`
   - Zavedenie XP/bodov/odznakov
   - Anglické UI alebo emoji v UI

## Povolené bez drama

- Lokálne UI copy úpravy v schválenom scope
- Nové polia v existujúcej tabuľke po schválení plánu
- Nové server action vedľa existujúceho patternu
- Aktualizácia `docs/ai/*`
- Lint opravy v dotknutých súboroch

## Checklist pred merge zmeny do aplikácie

- [ ] Zmena je v schválenom scope
- [ ] Auth/cron/telegram security ostali
- [ ] Žiadny secret v gite
- [ ] Business rules rešpektované
- [ ] KB aktualizovaná, ak treba
- [ ] Overenie (lint / scenár) prebehlo alebo je vysvetlené prečo nie

## Escalation

Ak Implementation Agent narazí na konflikt so schváleným promptom
(kód sa zmenil, rule by sa porušilo, treba drop column), **zastaví sa**
a vráti otázku používateľovi. Nevymýšľa si bypass.
