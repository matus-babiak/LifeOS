<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Štýl textov

Nikdy nepoužívaj pomlčky „—" ani „–" (v UI textoch, dokumentoch, komentároch, commitoch). Vety preformuluj s čiarkou, dvojbodkou alebo obyčajným spojovníkom "-".

# AI development systém

Zdroj pravdy pre AI prácu: `docs/ai/`.

- Plánovanie (bez zmeny appky): Cursor command `/lifeos-plan`
- Implementácia (po schválení): Cursor command `/lifeos-implement`
- Pravidlá: `.cursor/rules/lifeos-core.mdc`, `.cursor/rules/lifeos-harness.mdc`
- Workflow: `docs/ai/workflow.md`
- Golden example: `docs/ai/examples/golden-plan.md`

Pri významnejších zmenách aplikácie najprv plánuj, potom až po ľudskom schválení implementuj.
`PRODUCT.md` / `README.md` môžu byť čiastočne zastarané; konflikty sú v `docs/ai/doc-audit.md`.
Aktuálny kód je technická pravda.
