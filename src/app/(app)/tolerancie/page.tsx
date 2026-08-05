import { Trash2 } from "lucide-react";
import QuickAddTolerance from "@/components/QuickAddTolerance";
import ScheduleToleranceForm from "@/components/ScheduleToleranceForm";
import TriageCard from "@/components/TriageCard";
import { getTolerancesView } from "@/db/queries";
import { formatHuman } from "@/lib/dates";
import { deleteTolerance, resolveTolerance } from "./actions";

export const metadata = { title: "Tolerancie" };

export default async function TolerancesPage() {
  const { areas, untriaged, open, scheduled, done } =
    await getTolerancesView();
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const empty =
    untriaged.length === 0 &&
    open.length === 0 &&
    scheduled.length === 0 &&
    done.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tolerancie</h1>
        <p className="mt-1 text-sm text-muted">
          Drobnosti, ktoré ťa denne odčerpávajú. Zapíš ich, potom postupne
          odbav.
        </p>
      </header>

      <QuickAddTolerance />

      {untriaged.length > 0 && (
        <TriageCard
          items={untriaged.map((t) => ({ id: t.id, text: t.text }))}
          areas={areas.map((a) => ({
            id: a.id,
            name: a.name,
            color: a.color,
          }))}
        />
      )}

      {open.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">
            Na odbavenie ({open.length})
          </h2>
          {open.map((t) => {
            const area = t.areaId ? areaById.get(t.areaId) : null;
            return (
              <article
                key={t.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm">{t.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {area && (
                        <span
                          className="rounded-full px-2 py-0.5 font-medium"
                          style={{
                            backgroundColor: `${area.color}22`,
                            color: area.color,
                          }}
                        >
                          {area.name}
                        </span>
                      )}
                      <span className="text-muted">energia {t.energy}/10</span>
                    </div>
                  </div>
                  <form action={deleteTolerance.bind(null, t.id)}>
                    <button
                      type="submit"
                      aria-label="Zmazať"
                      className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={resolveTolerance.bind(null, t.id)}>
                    <button
                      type="submit"
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
                    >
                      Vyriešiť
                    </button>
                  </form>
                  <ScheduleToleranceForm id={t.id} />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {scheduled.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Naplánované</h2>
          {scheduled.map((t) => {
            const area = t.areaId ? areaById.get(t.areaId) : null;
            return (
              <article
                key={t.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm">{t.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {area && (
                        <span
                          className="rounded-full px-2 py-0.5 font-medium"
                          style={{
                            backgroundColor: `${area.color}22`,
                            color: area.color,
                          }}
                        >
                          {area.name}
                        </span>
                      )}
                      <span className="font-medium text-accent-ink">
                        {formatHuman(t.dueDate!)}
                      </span>
                    </div>
                    {t.firstStep && (
                      <p className="mt-1 text-xs text-muted">
                        Prvý krok: {t.firstStep}
                      </p>
                    )}
                  </div>
                  <form action={deleteTolerance.bind(null, t.id)}>
                    <button
                      type="submit"
                      aria-label="Zmazať"
                      className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                <form action={resolveTolerance.bind(null, t.id)} className="mt-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
                  >
                    Hotovo
                  </button>
                </form>
              </article>
            );
          })}
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">
            Odbavené ({done.length})
          </h2>
          <ul className="flex flex-col gap-1.5">
            {done.slice(0, 15).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 text-sm text-muted"
              >
                <span className="truncate line-through">{t.text}</span>
                <form action={deleteTolerance.bind(null, t.id)}>
                  <button
                    type="submit"
                    aria-label="Zmazať"
                    className="shrink-0 rounded-lg p-1 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {empty && (
        <p className="text-sm text-muted">
          Zatiaľ nič. Napíš prvú vec, ktorá ťa dnes štve.
        </p>
      )}
    </div>
  );
}
