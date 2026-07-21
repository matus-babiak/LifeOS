import type { Habit } from "@/lib/habits";

export type WeekSummaryInput = {
  avgEnergy: number | null;
  habitStats: { habit: Habit; done: number; target: number }[];
  journalCount: number;
  steps: { name: string }[];
};

/** Textový auto-súhrn týždňa z denných dát, pripravený appkou pred nedeľnou reflexiou. */
export function buildWeekSummary({
  avgEnergy,
  habitStats,
  journalCount,
  steps,
}: WeekSummaryInput): string {
  const parts: string[] = [
    avgEnergy != null
      ? `Priemerná energia ${avgEnergy}/10.`
      : "Energia tento týždeň nezaznamenaná.",
  ];

  if (habitStats.length > 0) {
    const habitsText = habitStats
      .map((s) => `${s.habit.name} ${s.done}/${s.target}`)
      .join(", ");
    parts.push(`Návyky: ${habitsText}.`);
  }

  parts.push(
    journalCount > 0
      ? `Denník: ${journalCount} ${journalCount === 1 ? "zápis" : journalCount < 5 ? "zápisy" : "zápisov"}.`
      : "Denník: žiadny zápis.",
  );

  if (steps.length > 0) {
    parts.push(`Aktívne kroky: ${steps.map((s) => s.name).join(", ")}.`);
  }

  return parts.join(" ");
}
