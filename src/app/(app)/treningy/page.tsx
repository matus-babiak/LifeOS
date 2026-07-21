import Link from "next/link";
import { ChevronRight } from "lucide-react";
import NewTrainingForm from "@/components/NewTrainingForm";
import { getTrainingsView } from "@/db/queries";

export const metadata = { title: "Tréningy" };

const STATUS_LABEL: Record<string, string> = {
  active: "aktívny",
  paused: "pozastavený",
  completed: "dokončený",
};

function LevelDots({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" title={`Úroveň ${level}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${n <= level ? "bg-accent" : "bg-line"}`}
        />
      ))}
    </span>
  );
}

export default async function TrainingsPage() {
  const { trainings, areaById, levelStats } = await getTrainingsView();

  const areas = [...areaById.values()].map((a) => ({ id: a.id, name: a.name }));
  const active = trainings.filter((t) => t.status === "active");
  const others = trainings.filter((t) => t.status !== "active");

  const renderCard = (t: (typeof trainings)[number]) => {
    const area = areaById.get(t.areaId);
    const stats = levelStats.get(t.id) ?? { done: 0, total: 0 };
    return (
      <Link
        key={t.id}
        href={`/treningy/${t.id}`}
        className="block rounded-2xl border border-line bg-surface p-5 shadow-sm transition-colors hover:border-accent/60"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-medium">{t.name}</h2>
              {area && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ backgroundColor: `${area.color}22`, color: area.color }}
                >
                  {area.name}
                </span>
              )}
              {t.status !== "active" && (
                <span className="text-xs text-muted">
                  {STATUS_LABEL[t.status]}
                </span>
              )}
            </div>
            {t.goal && <p className="mt-1 text-sm text-muted">{t.goal}</p>}
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <LevelDots level={t.level} />
            <span>úroveň {t.level}/5</span>
          </div>
          {stats.total > 0 && (
            <span className="text-xs text-muted">
              míľniky {stats.done}/{stats.total}
            </span>
          )}
        </div>

        {t.dailyStep && (
          <p className="mt-3 border-t border-line pt-3 text-sm">
            <span className="text-muted">Denný krok: </span>
            {t.dailyStep}
          </p>
        )}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tréningy</h1>
        <p className="mt-1 text-sm text-muted">
          Vyber si 1 až 3 veci, ktoré práve vedome buduješ.
        </p>
      </header>

      <NewTrainingForm areas={areas} />

      {trainings.length === 0 && (
        <p className="text-sm text-muted">
          Zatiaľ žiadne tréningy. Začni tým, na čom teraz najviac záleží.
        </p>
      )}

      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          {active.length >= 4 && (
            <p className="text-xs text-danger">
              Máš {active.length} aktívnych tréningov. Menej naraz znamená
              hlbšiu prácu, zváž pozastavenie niektorých.
            </p>
          )}
          {active.map(renderCard)}
        </section>
      )}

      {others.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Pozastavené a dokončené</h2>
          {others.map(renderCard)}
        </section>
      )}
    </div>
  );
}
