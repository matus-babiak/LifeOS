import {
  Check,
  MoonStar,
  Plus,
  Sparkles,
  Sunrise,
} from "lucide-react";
import MorningForm from "@/components/MorningForm";
import { getActiveTrainingSteps, getMentorMessage, getTodayView } from "@/db/queries";
import { formatHuman, isEvening, weekStart } from "@/lib/dates";
import { addDays } from "@/lib/dates";
import { frequencyLabel, isDueOn, missedYesterday, weeklyTarget } from "@/lib/habits";
import {
  addFocus,
  saveEvening,
  toggleFocus,
  toggleHabit,
} from "./actions";

export default async function TodayPage() {
  const view = await getTodayView();
  const { today, checkin, focus, habits, recentLogs, totals } = view;
  const allTrainingSteps = (await getActiveTrainingSteps()).map(
    (s) => s.dailyStep as string,
  );
  const mentorMessage = await getMentorMessage(view, allTrainingSteps);
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
      {mentorMessage && (
        <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
          <div className="flex items-start gap-2.5">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-accent"
              strokeWidth={1.8}
            />
            <p className="text-sm text-accent-ink">{mentorMessage}</p>
          </div>
        </section>
      )}

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
                <form action={toggleFocus.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-bg"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        item.done
                          ? "border-accent bg-accent text-white dark:text-[#10141a]"
                          : "border-line"
                      }`}
                    >
                      {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span
                      className={`text-sm ${item.done ? "text-muted line-through" : ""}`}
                    >
                      {item.text}
                    </span>
                  </button>
                </form>
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
                <form action={toggleHabit.bind(null, habit.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-start gap-3 rounded-xl border border-line px-3 py-3 text-left transition-colors hover:border-accent/60"
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        doneToday
                          ? "border-accent bg-accent text-white dark:text-[#10141a]"
                          : "border-line"
                      }`}
                    >
                      {doneToday && (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium">{habit.name}</span>
                        <span className="text-xs text-muted">
                          {frequencyLabel(habit)}
                        </span>
                        {established && (
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
                            zabehnutý
                          </span>
                        )}
                      </span>
                      {doneToday && habit.identity && (
                        <span className="mt-1 block text-xs text-accent-ink">
                          +1 hlas: {habit.identity}
                        </span>
                      )}
                      {missedYest && (
                        <span className="mt-1 block text-xs text-danger">
                          Včera vynechané - dnes nezmeškaj druhýkrát.
                        </span>
                      )}
                      <span className="mt-2 block">
                        <span className="flex items-center justify-between text-xs text-muted">
                          <span>
                            {established
                              ? `${collected} dní spolu`
                              : `budovanie ${Math.min(collected, habit.targetDays)}/${habit.targetDays} dní`}
                          </span>
                          <span>
                            tento týždeň {weekCount}/{weeklyTarget(habit)}
                          </span>
                        </span>
                        {!established && (
                          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line">
                            <span
                              className="block h-full rounded-full bg-accent"
                              style={{
                                width: `${Math.min(100, Math.round((collected / habit.targetDays) * 100))}%`,
                              }}
                            />
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </form>
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
