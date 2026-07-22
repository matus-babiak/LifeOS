import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import BeliefReframe from "@/components/BeliefReframe";
import BeliefResolvedCheckbox from "@/components/BeliefResolvedCheckbox";
import NewBeliefForm from "@/components/NewBeliefForm";
import { ReframeSkeleton } from "@/components/Skeleton";
import { getBeliefsView } from "@/db/queries";
import { formatHuman } from "@/lib/dates";
import { deleteBelief } from "./actions";

export const metadata = { title: "Presvedčenia" };

export default async function BeliefsPage() {
  const beliefs = await getBeliefsView();
  const active = beliefs.filter((b) => !b.resolved);
  const resolved = beliefs.filter((b) => b.resolved);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Presvedčenia</h1>
        <p className="mt-1 text-sm text-muted">
          Zapíš obmedzujúcu myšlienku, ktorá ťa drží vo fixnom mindsete - mentor
          ti k nej ukáže reframe a konkrétny krok von.
        </p>
      </header>

      <NewBeliefForm />

      {active.length === 0 && resolved.length === 0 && (
        <p className="text-sm text-muted">
          Zatiaľ žiadne zapísané presvedčenia.
        </p>
      )}

      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          {active.map((belief) => (
            <article
              key={belief.id}
              className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="text-xs text-muted">
                  {formatHuman(belief.createdAt.toISOString().slice(0, 10))}
                </span>
                <div className="flex items-center gap-2">
                  <BeliefResolvedCheckbox id={belief.id} resolved={belief.resolved} />
                  <form action={deleteBelief.bind(null, belief.id)}>
                    <button
                      type="submit"
                      aria-label="Zmazať presvedčenie"
                      className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{belief.text}</p>
              <Suspense fallback={<ReframeSkeleton />}>
                <BeliefReframe belief={belief} />
              </Suspense>
            </article>
          ))}
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted">Prekonané</h2>
          <ul className="flex flex-col gap-2">
            {resolved.map((belief) => (
              <li
                key={belief.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
              >
                <span className="truncate text-sm text-muted line-through">
                  {belief.text}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <BeliefResolvedCheckbox id={belief.id} resolved={belief.resolved} />
                  <form action={deleteBelief.bind(null, belief.id)}>
                    <button
                      type="submit"
                      aria-label="Zmazať presvedčenie"
                      className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
