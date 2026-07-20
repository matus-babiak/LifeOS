import { Archive } from "lucide-react";
import NewHabitForm from "@/components/NewHabitForm";
import { getHabitsView } from "@/db/queries";
import { frequencyLabel } from "@/lib/habits";
import { archiveHabit } from "../actions";

export const metadata = { title: "Návyky" };

export default async function HabitsPage() {
  const { habits, totals } = await getHabitsView();
  const active = habits.filter((h) => h.status !== "archived");
  const archived = habits.filter((h) => h.status === "archived");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Návyky</h1>
        <p className="mt-1 text-sm text-muted">
          Každý návyk je hlas pre človeka, ktorým sa stávaš.
        </p>
      </header>

      <NewHabitForm />

      <section className="flex flex-col gap-3">
        {active.length === 0 && (
          <p className="text-sm text-muted">Zatiaľ žiadne návyky.</p>
        )}
        {active.map((habit) => {
          const collected = totals.get(habit.id) ?? 0;
          const established = habit.status === "established";
          return (
            <article
              key={habit.id}
              className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h2 className="font-medium">{habit.name}</h2>
                    <span className="text-xs text-muted">
                      {frequencyLabel(habit)}
                    </span>
                    {established && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
                        zabehnutý
                      </span>
                    )}
                  </div>
                  {habit.identity && (
                    <p className="mt-1 text-sm text-muted">{habit.identity}</p>
                  )}
                </div>
                <form action={archiveHabit.bind(null, habit.id)}>
                  <button
                    type="submit"
                    aria-label="Archivovať návyk"
                    title="Archivovať"
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-ink"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    {established
                      ? `${collected} dní spolu - návyk je súčasťou teba`
                      : `budovanie ${Math.min(collected, habit.targetDays)}/${habit.targetDays} dní`}
                  </span>
                  {!established && (
                    <span className="tabular-nums">
                      {Math.min(
                        100,
                        Math.round((collected / habit.targetDays) * 100),
                      )}
                      %
                    </span>
                  )}
                </div>
                {!established && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.min(100, Math.round((collected / habit.targetDays) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted">Archív</h2>
          <ul className="flex flex-col gap-1">
            {archived.map((habit) => (
              <li key={habit.id} className="text-sm text-muted">
                {habit.name} · {totals.get(habit.id) ?? 0} dní spolu
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
