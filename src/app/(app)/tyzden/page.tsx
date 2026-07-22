import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import WeeklyReviewForm from "@/components/WeeklyReviewForm";
import { getWeekAiReflection, getWeekView } from "@/db/queries";
import { addDays, formatHuman, todayISO, weekStart as mondayOf } from "@/lib/dates";
import { reopenWeeklyReview } from "./actions";

export const metadata = { title: "Týždeň" };

function isValidISO(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const currentWeekStart = mondayOf(todayISO());
  const start = week && isValidISO(week) ? mondayOf(week) : currentWeekStart;

  const weekView = await getWeekView(start);
  const { end, review, avgEnergy, habitStats, weekEntries, steps, history } = weekView;

  const prevStart = addDays(start, -7);
  const nextStart = addDays(start, 7);
  const isCurrentWeek = start === currentWeekStart;
  const isFutureWeek = start > currentWeekStart;
  const aiReflection = isFutureWeek ? null : await getWeekAiReflection(weekView);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Týždeň</h1>
        <p className="mt-1 text-sm text-muted">
          Srdce appky - v nedeľu si tu len prečítaš, čo sa dialo, a odpovieš na 3 otázky.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <Link
          href={`/tyzden?week=${prevStart}`}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Predošlý
        </Link>
        <span className="text-sm font-medium">
          {formatHuman(start)} - {formatHuman(end)}
          {isCurrentWeek && (
            <span className="ml-2 text-xs font-normal text-accent-ink">
              tento týždeň
            </span>
          )}
        </span>
        {isFutureWeek ? (
          <span className="w-[76px]" />
        ) : (
          <Link
            href={`/tyzden?week=${nextStart}`}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Ďalší
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Auto-súhrn z denných dát */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.8} />
          <h2 className="font-medium">Súhrn týždňa</h2>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-muted">Priemerná energia</dt>
            <dd className="mt-0.5">{avgEnergy != null ? `${avgEnergy}/10` : "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">Návyky</dt>
            {habitStats.length === 0 ? (
              <dd className="mt-0.5">-</dd>
            ) : (
              <dd className="mt-1 flex flex-col gap-1">
                {habitStats.map((s) => (
                  <span key={s.habit.id} className="flex items-center justify-between">
                    <span>{s.habit.name}</span>
                    <span className="text-muted tabular-nums">
                      {s.done}/{s.target}
                    </span>
                  </span>
                ))}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-muted">Denník</dt>
            <dd className="mt-0.5">
              {weekEntries.length === 0
                ? "Žiadny zápis"
                : weekEntries.map((e) => e.situation).join(" · ")}
            </dd>
          </div>
          {steps.length > 0 && (
            <div>
              <dt className="text-muted">Aktívne kroky tréningov</dt>
              <dd className="mt-0.5">{steps.map((s) => s.name).join(", ")}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* AI reflexia - interpretácia dát, nielen ich zopakovanie */}
      {aiReflection && (
        <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
          <p className="text-sm text-accent-ink">{aiReflection}</p>
        </section>
      )}

      {/* 3 otázky */}
      {review?.doneAt ? (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Reflexia dokončená</h2>
            <form action={reopenWeeklyReview.bind(null, start)}>
              <button
                type="submit"
                className="text-xs text-muted transition-colors hover:text-ink"
              >
                Upraviť
              </button>
            </form>
          </div>
          <dl className="flex flex-col gap-3 text-sm">
            {review.win && (
              <div>
                <dt className="text-muted">Najväčšie víťazstvo</dt>
                <dd className="mt-0.5">{review.win}</dd>
              </div>
            )}
            {review.pattern && (
              <div>
                <dt className="text-muted">Čo sa opakovalo</dt>
                <dd className="mt-0.5">{review.pattern}</dd>
              </div>
            )}
            {review.change && (
              <div>
                <dt className="text-muted">Čo zmením</dt>
                <dd className="mt-0.5">{review.change}</dd>
              </div>
            )}
          </dl>
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 font-medium">3 otázky</h2>
          <WeeklyReviewForm
            weekStart={start}
            win={review?.win ?? null}
            pattern={review?.pattern ?? null}
            change={review?.change ?? null}
          />
        </section>
      )}

      {/* História predošlých reflexií */}
      {history.filter((h) => h.weekStart !== start).length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted">Predošlé reflexie</h2>
          <ul className="flex flex-col gap-2">
            {history
              .filter((h) => h.weekStart !== start)
              .map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/tyzden?week=${h.weekStart}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm transition-colors hover:border-accent/60"
                  >
                    <span className="shrink-0">{formatHuman(h.weekStart)}</span>
                    {h.win && <span className="truncate text-muted">{h.win}</span>}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
