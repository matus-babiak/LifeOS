import { Trash2 } from "lucide-react";
import NewJournalForm from "@/components/NewJournalForm";
import { getJournalView } from "@/db/queries";
import { formatHuman } from "@/lib/dates";
import { deleteJournalEntry } from "./actions";

export const metadata = { title: "Denník" };

export default async function JournalPage() {
  const { entries, trainingName, trainings } = await getJournalView();

  const rows = (
    entry: (typeof entries)[number],
  ): { label: string; value: string | null }[] => [
    { label: "Situácia", value: entry.situation },
    { label: "Moja reakcia", value: entry.reaction },
    { label: "Čo som cítil", value: entry.feeling },
    { label: "Čo to ukazuje", value: entry.meaning },
    { label: "Čo sa naučím", value: entry.lesson },
    { label: "Nový princíp", value: entry.principle },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Denník</h1>
        <p className="mt-1 text-sm text-muted">
          Učenie sa zo života, nie záznam o dni.
        </p>
      </header>

      <NewJournalForm trainings={trainings} />

      {entries.length === 0 && (
        <p className="text-sm text-muted">
          Zatiaľ žiadne zápisy. Prvá situácia, z ktorej sa chceš poučiť, môže
          prísť dnes.
        </p>
      )}

      <section className="flex flex-col gap-3">
        {entries.map((entry) => {
          const createdISO = entry.createdAt.toISOString().slice(0, 10);
          const linked = entry.trainingId
            ? trainingName.get(entry.trainingId)
            : null;
          return (
            <article
              key={entry.id}
              className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span>{formatHuman(createdISO)}</span>
                  {linked && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-ink">
                      {linked}
                    </span>
                  )}
                </div>
                <form action={deleteJournalEntry.bind(null, entry.id)}>
                  <button
                    type="submit"
                    aria-label="Zmazať zápis"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                {rows(entry)
                  .filter((r) => r.value)
                  .map((r) => (
                    <div key={r.label}>
                      <dt className="text-xs uppercase tracking-wide text-muted">
                        {r.label}
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-wrap">{r.value}</dd>
                    </div>
                  ))}
              </dl>
            </article>
          );
        })}
      </section>
    </div>
  );
}
