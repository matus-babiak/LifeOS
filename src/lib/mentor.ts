import type { Habit } from "@/lib/habits";

export type MentorContext = {
  energy: number | null;
  identityFocus: string | null;
  dueHabits: { habit: Habit; doneToday: boolean; missedYesterday: boolean }[];
  trainingSteps: string[];
};

/** Zostaví prompt pre denného mentora z reálnych dát dňa. */
export function buildMentorPrompt(ctx: MentorContext): string {
  const lines: string[] = [
    "Si prísny, ale podporujúci osobný mentor v aplikácii LifeOS.",
    "Na základe nasledujúcich dát napíš 2-3 vety v slovenčine, ktoré človeka dnes nakopnú do akcie.",
    "Buď konkrétny a osobný, nie všeobecný. Bez pozdravu a oslovenia, choď rovno na vec. Bez úvodzoviek.",
    "",
  ];

  if (ctx.energy != null) lines.push(`Dnešná energia: ${ctx.energy}/10.`);
  if (ctx.identityFocus) lines.push(`Chce dnes byť: ${ctx.identityFocus}.`);

  if (ctx.dueHabits.length > 0) {
    const habitLines = ctx.dueHabits.map((h) => {
      const status = h.doneToday
        ? "splnené"
        : h.missedYesterday
          ? "nesplnené, včera tiež vynechané"
          : "nesplnené";
      return `${h.habit.name} (${status})`;
    });
    lines.push(`Návyky dnes: ${habitLines.join(", ")}.`);
  }

  if (ctx.trainingSteps.length > 0) {
    lines.push(`Aktívne denné kroky tréningov: ${ctx.trainingSteps.join(", ")}.`);
  }

  return lines.join("\n");
}
