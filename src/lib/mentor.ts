import type { Habit } from "@/lib/habits";

export type MentorContext = {
  energy: number | null;
  identityFocus: string | null;
  dueHabits: { habit: Habit; doneToday: boolean; missedYesterday: boolean }[];
  trainingSteps: string[];
  season: { title: string; intention: string | null } | null;
  lastWeekReview: { win: string | null; pattern: string | null; change: string | null } | null;
  habitConsistency: { name: string; done: number; days: number }[];
  recentJournal: { situation: string; principle: string | null }[];
};

/** Zostaví prompt pre denného mentora z dát dňa aj širšieho kontextu (sezóna, história). */
export function buildMentorPrompt(ctx: MentorContext): string {
  const lines: string[] = [
    "Si prísny, ale podporujúci osobný mentor v aplikácii LifeOS.",
    "Poznáš aj širší kontext človeka (sezónu, minulý týždeň, dlhodobejšie vzorce), nielen dnešok - použi to.",
    "Napíš 2-4 vety v slovenčine, ktoré ho dnes nakopnú do akcie.",
    "Buď konkrétny a osobný, prepájaj dnešok s dlhodobejším vzorcom, ak to dáva zmysel. Bez pozdravu a oslovenia, choď rovno na vec. Bez úvodzoviek.",
    "",
  ];

  if (ctx.season) {
    lines.push(
      `Aktuálna sezóna: "${ctx.season.title}"${ctx.season.intention ? ` - zámer: ${ctx.season.intention}` : ""}.`,
    );
  }

  if (ctx.lastWeekReview) {
    const { win, pattern, change } = ctx.lastWeekReview;
    const parts = [
      win && `víťazstvo: ${win}`,
      pattern && `opakovalo sa: ${pattern}`,
      change && `chcel zmeniť: ${change}`,
    ].filter(Boolean);
    if (parts.length > 0) lines.push(`Z minulej týždennej reflexie - ${parts.join("; ")}.`);
  }

  if (ctx.habitConsistency.length > 0) {
    const text = ctx.habitConsistency
      .map((h) => `${h.name} ${h.done}/${h.days} dní za posledné 2 týždne`)
      .join(", ");
    lines.push(`Dlhodobejšia konzistencia návykov: ${text}.`);
  }

  if (ctx.recentJournal.length > 0) {
    const text = ctx.recentJournal
      .map((j) => j.principle ? `${j.situation} → princíp: ${j.principle}` : j.situation)
      .join("; ");
    lines.push(`Nedávne zápisy z denníka: ${text}.`);
  }

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

export type WeekReflectionContext = {
  start: string;
  end: string;
  avgEnergy: number | null;
  habitStats: { name: string; done: number; target: number }[];
  journalCount: number;
  previousWin: string | null;
  previousPattern: string | null;
  previousChange: string | null;
};

/** Zostaví prompt pre AI reflexiu týždňa (popri pravidlovom auto-súhrne). */
export function buildWeekReflectionPrompt(ctx: WeekReflectionContext): string {
  const lines: string[] = [
    "Si osobný mentor v aplikácii LifeOS, pripravuješ podklad na nedeľnú týždennú reflexiu.",
    "Napíš 2-4 vety v slovenčine, ktoré interpretujú dáta tohto týždňa - nie len ich zopakujú, ale ukážu súvislosť alebo vzorec.",
    "Ak sa dá, prepoj to s tým, čo si človek predsavzal minulý týždeň. Bez pozdravu, bez úvodzoviek, choď rovno na vec.",
    "",
  ];

  lines.push(
    ctx.avgEnergy != null ? `Priemerná energia tento týždeň: ${ctx.avgEnergy}/10.` : "Energia nezaznamenaná.",
  );

  if (ctx.habitStats.length > 0) {
    const text = ctx.habitStats.map((h) => `${h.name} ${h.done}/${h.target}`).join(", ");
    lines.push(`Návyky: ${text}.`);
  }

  lines.push(`Zápisy do denníka tento týždeň: ${ctx.journalCount}.`);

  if (ctx.previousWin || ctx.previousPattern || ctx.previousChange) {
    const parts = [
      ctx.previousWin && `víťazstvo: ${ctx.previousWin}`,
      ctx.previousPattern && `opakovalo sa: ${ctx.previousPattern}`,
      ctx.previousChange && `chcel zmeniť: ${ctx.previousChange}`,
    ].filter(Boolean);
    lines.push(`Minulý týždeň - ${parts.join("; ")}.`);
  }

  return lines.join("\n");
}

export type TrainingNoteContext = {
  name: string;
  level: number;
  currentState: string | null;
  why: string | null;
  goal: string | null;
  milestonesDone: number;
  milestonesTotal: number;
  recentJournal: { situation: string; principle: string | null }[];
};

/** Zostaví prompt pre krátky mentorský komentár k tréningu na jeho detaile. */
export function buildTrainingNotePrompt(ctx: TrainingNoteContext): string {
  const lines: string[] = [
    "Si osobný mentor v aplikácii LifeOS a komentuješ konkrétny tréning človeka.",
    "Napíš 1-3 vety v slovenčine - povzbudenie alebo konkrétny postreh k tomuto tréningu na základe dát nižšie.",
    "Bez pozdravu, bez úvodzoviek, choď rovno na vec.",
    "",
    `Tréning: ${ctx.name}, úroveň ${ctx.level}/5, míľniky tejto úrovne ${ctx.milestonesDone}/${ctx.milestonesTotal}.`,
  ];

  if (ctx.currentState) lines.push(`Aktuálny stav (PRED): ${ctx.currentState}.`);
  if (ctx.why) lines.push(`Prečo: ${ctx.why}.`);
  if (ctx.goal) lines.push(`Cieľ (PO): ${ctx.goal}.`);

  if (ctx.recentJournal.length > 0) {
    const text = ctx.recentJournal
      .map((j) => (j.principle ? `${j.situation} → princíp: ${j.principle}` : j.situation))
      .join("; ");
    lines.push(`Súvisiace zápisy z denníka: ${text}.`);
  }

  return lines.join("\n");
}

/** Zostaví prompt pre reframe obmedzujúceho presvedčenia smerom k rastovému mindsetu. */
export function buildBeliefReframePrompt(beliefText: string): string {
  return [
    "Si prísny, ale podporujúci osobný mentor v aplikácii LifeOS, špecializovaný na prácu s obmedzujúcimi presvedčeniami a fixným mindsetom.",
    "Človek napísal limitujúcu myšlienku, v ktorej je zaseknutý. Odpovedz v slovenčine v 3 krokoch, spolu 4-6 viet, bez pozdravu, bez úvodzoviek, choď rovno na vec:",
    "1) krátko pomenuj, aký vzorec alebo skreslenie myslenia sa v tom skrýva,",
    "2) daj konkrétny reframe smerom k rastovému mindsetu,",
    "3) navrhni jeden malý konkrétny krok alebo otázku, ktorou si to môže hneď overiť alebo vyvrátiť.",
    "",
    `Limitujúce presvedčenie: "${beliefText}"`,
  ].join("\n");
}
