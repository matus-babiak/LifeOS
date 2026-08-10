# LifeOS AI Knowledge Base

Toto je **zdroj pravdy** pre AI development tohto projektu.

Ak existuje rozpor medzi týmto adresárom a staršími súbormi (`PRODUCT.md`, `README.md`),
platí aktuálny kód. Táto Knowledge Base popisuje overený stav kódu a zaznamenáva konflikty.

## Ako používať

1. Ľudská požiadavka → Cursor command `/lifeos-plan`
2. Planning Agent prečíta túto KB, skontroluje kód, navrhne zmenu, čaká na schválenie
3. Po schválení → Cursor command `/lifeos-implement` so schváleným implementačným promptom
4. Implementation Agent mení iba schválený scope a overí výsledok

## Dokumenty

| Súbor | Účel |
|---|---|
| [product.md](product.md) | Čo appka robí, pre koho, hlavné flows |
| [architecture.md](architecture.md) | Stack, vrstvy, entry pointy, deploy |
| [data-model.md](data-model.md) | Entity a vzťahy podľa `src/db/schema.ts` |
| [business-rules.md](business-rules.md) | Pravidlá, ktoré AI nesmie porušiť |
| [ui-ux.md](ui-ux.md) | Obrazovky, navigácia, UX rozhodnutia |
| [workflow.md](workflow.md) | Planning vs Implementation workflow |
| [agent.md](agent.md) | Role agentov a ľudská komunikácia |
| [harness.md](harness.md) | Ochrana pred nebezpečnými zmenami |
| [doc-audit.md](doc-audit.md) | Audit pôvodnej dokumentácie |
| [examples/golden-plan.md](examples/golden-plan.md) | Overený príklad Planning Agenta |

## Čo tu nie je

- Návody na zmenu produkčných secretov
- Plán veľkých refaktorov
- Hypotetické features, ktoré v kóde neexistujú
