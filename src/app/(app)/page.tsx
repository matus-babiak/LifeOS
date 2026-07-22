import { Suspense } from "react";
import {
  MoonStar,
  Plus,
  Sunrise,
} from "lucide-react";
import DailyMentor from "@/components/DailyMentor";
import FocusCheckbox from "@/components/FocusCheckbox";
import HabitCheckbox from "@/components/HabitCheckbox";
import MorningForm from "@/components/MorningForm";
import { MentorSkeleton } from "@/components/Skeleton";
import { getActiveTrainingSteps, getTodayView } from "@/db/queries";
import { formatHuman, isEvening, weekStart } from "@/lib/dates";
import { addDays } from "@/lib/dates";
import { isDueOn, missedYesterday } from "@/lib/habits";
import { addFocus, saveEvening } from "./actions";

export default async function TodayPage() {
  const view = await getTodayView();
  const { today, checkin, focus, habits, recentLogs, totals } = view;
  const allTrainingSteps = (await getActiveTrainingSteps()).map(
    (s) => s.dailyStep as string,
  );
  const trainingSteps = allTrainingSteps.slice(0, 3);
  const evening = isEvening();
  const morningDone = !!checkin?.morningDoneAt;
  const eveningDone = !!checkin?.eveningDoneAt;
  const yesterday = addDays(today, -1);
  const ws = weekStart(today);

  const dueToday = habits.filter((h) => isDueOn(h, today));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted">{formatHuman(today)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {evening ? "Dobrý večer" : "Dobré ráno"}
        </h1>
      </header>

      {/* Denný mentor */}
      <Suspense fallback={<MentorSkeleton />}>
        <DailyMentor view={view} trainingSteps={allTrainingSteps} />
      </Suspense>

      {/* Ranný check-in / zhrnutie rána */}
      {!morningDone && !evening && (
        <MorningForm defaultFocus={trainingSteps} />
      )}

      {morningDone && (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Sunrise className="h-4 w-4 text-accent" strokeWidth={1.8} />
            <p className="text-sm">
              Energia{" "}
              <span className="font-medium tabular-nums">
                {checkin?.energy ?? "-"}/10
              </span>
              {checkin?.identityFocus && (
                <>
                  {" · dnes som "}
                  <span className="font-medium text-accent-ink">
                    {checkin.identityFocus}
                  </span>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {/* Fokus dňa */}
      {(morningDone || focus.length > 0) && (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 font-medium">Dnešný fokus</h2>
          {focus.length === 0 && (
            <p className="mb-3 text-sm text-muted">
              Žiadne položky - pridaj si 1 až 3 veci, na ktorých dnes záleží.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {focus.map((item) => (
              <li key={item.id}>
                <FocusCheckbox id={item.id} text={item.text} done={item.done} />
              </li>
            ))}
          </ul>
          {focus.length < 3 && (
            <form action={addFocus} className="mt-3 flex gap-2">
              <input
                name="text"
                type="text"
                placeholder="Pridať položku fokusu"
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                aria-label="Pridať"
                className="rounded-lg border border-line px-3 text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          )}
        </section>
      )}

      {/* Návyky */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-medium">Návyky</h2>
        {dueToday.length === 0 && (
          <p className="text-sm text-muted">
            Zatiaľ žiadne návyky - vytvor si prvý v sekcii Návyky.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {dueToday.map((habit) => {
            const doneToday = recentLogs.some(
              (l) => l.habitId === habit.id && l.date === today,
            );
            const missedYest = missedYesterday(habit, doneToday, yesterday, recentLogs);
            const collected = totals.get(habit.id) ?? 0;
            const weekCount = recentLogs.filter(
              (l) => l.habitId === habit.id && l.date >= ws && l.date <= today,
            ).length;
            const established = habit.status === "established";

            return (
              <li key={habit.id}>
                <HabitCheckbox
                  habit={habit}
                  doneToday={doneToday}
                  missedYesterday={missedYest}
                  established={established}
                  collected={collected}
                  weekCount={weekCount}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Večerná reflexia */}
      {evening && (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5">
            <MoonStar className="h-5 w-5 text-accent" strokeWidth={1.8} />
            <h2 className="font-medium">Večerná reflexia</h2>
            {!eveningDone && (
              <span className="ml-auto text-xs text-muted">~3 minúty</span>
            )}
          </div>

          {eveningDone ? (
            <dl className="flex flex-col gap-3 text-sm">
              {checkin?.wins && (
                <div>
                  <dt className="text-muted">Čo sa mi podarilo</dt>
                  <dd className="mt-0.5">{checkin.wins}</dd>
                </div>
              )}
              {checkin?.learned && (
                <div>
                  <dt className="text-muted">Čo som sa naučil</dt>
                  <dd className="mt-0.5">{checkin.learned}</dd>
                </div>
              )}
              {checkin?.improve && (
                <div>
                  <dt className="text-muted">Čo zajtra zlepším</dt>
                  <dd className="mt-0.5">{checkin.improve}</dd>
                </div>
              )}
            </dl>
          ) : (
            <form action={saveEvening} className="flex flex-col gap-4">
              {[
                {
                  name: "wins",
                  label: "Čo sa mi dnes podarilo?",
                  value: checkin?.wins,
                },
                {
                  name: "learned",
                  label: "Čo som sa naučil?",
                  value: checkin?.learned,
                },
                {
                  name: "improve",
                  label: "Čo zajtra spravím lepšie?",
                  value: checkin?.improve,
                },
              ].map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm text-muted"
                  >
                    {field.label}
                  </label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    rows={2}
                    defaultValue={field.value ?? ""}
                    className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="self-start rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
              >
                Uzavrieť deň
              </button>
            </form>
          )}
        </section>
      )}

      {/* Ranný check-in dostupný aj večer, ak ráno vynechal */}
      {!morningDone && evening && <MorningForm defaultFocus={trainingSteps} />}
    </div>
  );
}
