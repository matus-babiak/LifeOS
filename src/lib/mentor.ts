import type { Habit } from "@/lib/habits";

export type MentorContext = {
  energy: number | null;
  identityFocus: string | null;
  dueHabits: { habit: Habit; doneToday: boolean; missedYesterday: boolean }[];
  trainingSteps: string[];
  goals: { title: string; areaName: string; dueDate: string }[];
  lastWeekReview: { win: string | null; pattern: string | null; change: string | null } | null;
  habitConsistency: { name: string; done: number; days: number }[];
  recentJournal: { situation: string; principle: string | null }[];
  openBlocks: { title: string; body: string | null }[];
  contextNotes: { title: string; noteDate: string | null; content: string }[];
};

/** Zostaví prompt pre denného mentora z dát dňa aj širšieho kontextu (ciele, história). */
export function buildMentorPrompt(ctx: MentorContext): string {
  const lines: string[] = [
    "Si prísny, ale podporujúci osobný mentor v aplikácii LifeOS.",
    "Poznáš aj širší kontext človeka (otvorené ciele, minulý týždeň, dlhodobejšie vzorce), nielen dnešok - použi to.",
    "Napíš 2-4 vety v slovenčine, ktoré ho dnes nakopnú do akcie.",
    "Buď konkrétny a osobný, prepájaj dnešok s dlhodobejším vzorcom, ak to dáva zmysel. Bez pozdravu a oslovenia, choď rovno na vec. Bez úvodzoviek.",
    "",
  ];

  if (ctx.goals.length > 0) {
    const text = ctx.goals
      .map((g) => `"${g.title}" (${g.areaName}, do ${g.dueDate})`)
      .join("; ");
    lines.push(`Otvorené ciele: ${text}.`);
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

  if (ctx.contextNotes.length > 0) {
    lines.push(
      `Celý dostupný kontext z Obsidianu (${ctx.contextNotes.length} poznámok, zoradené od najnovšej - novšie ber ako aktuálnejšie a uprednostni ich):`,
    );
    for (const n of ctx.contextNotes) {
      lines.push(`- ${n.noteDate ?? n.title}: ${n.content}`);
    }
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

  if (ctx.openBlocks.length > 0) {
    const text = ctx.openBlocks
      .map((b) => (b.body ? `${b.title} (${b.body})` : b.title))
      .join("; ");
    lines.push(
      `Otvorené aktívne bloky (stále nevyriešené, majú visieť v hlave): ${text}.`,
    );
    lines.push(
      "Ak dáva zmysel, jemne jedno z nich pripomeň a prepoj s dnešnou akciou - bez moralizovania.",
    );
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

export type JournalBlockEntry = {
  situation: string;
  reaction: string | null;
  feeling: string | null;
  meaning: string | null;
  lesson: string | null;
  principle: string | null;
};

export type BlockCandidate = {
  title: string;
  why: string;
  severity: 1 | 2 | 3 | null;
};

/** Prompt: Gemini vráti len JSON pole 0-2 kandidátov na aktívne bloky. */
export function buildJournalBlockExtractionPrompt(
  entry: JournalBlockEntry,
): string {
  return [
    "Si mentor v LifeOS. Z reflexného zápisu vytiahni pretrvávajúce otvorené problémy (bloky), ktoré by mali visieť, kým ich človek nevyrieši.",
    "Vráť IBA platný JSON, nič iné (žiadny markdown, žiadny komentár).",
    'Formát: [{"title":"krátky názov bloku","why":"prečo to ešte nie je vyriešené","severity":1|2|3}]',
    "severity: 1 = vysoká, 2 = stredná, 3 = nízka.",
    "Maximálne 2 položky. Ak v zápise nie je jasný pretrvávajúci blok, vráť [].",
    "Nepoužívaj všeobecné rady ako bloky. Len konkrétne nevyriešené napätie alebo vzorec.",
    "",
    `Situácia: ${entry.situation}`,
    entry.reaction ? `Reakcia: ${entry.reaction}` : "",
    entry.feeling ? `Pocit: ${entry.feeling}` : "",
    entry.meaning ? `Čo to ukazuje: ${entry.meaning}` : "",
    entry.lesson ? `Lekcia: ${entry.lesson}` : "",
    entry.principle ? `Princíp: ${entry.principle}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Parsuje JSON kandidátov z Gemini výstupu (aj s markdown fence). */
export function parseBlockCandidates(raw: string | null): BlockCandidate[] {
  if (!raw) return [];

  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: BlockCandidate[] = [];
    for (const item of parsed.slice(0, 2)) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      if (!title) continue;
      const why =
        typeof row.why === "string" && row.why.trim().length > 0
          ? row.why.trim()
          : "";
      const sevRaw = Number(row.severity);
      const severity =
        sevRaw === 1 || sevRaw === 2 || sevRaw === 3 ? sevRaw : null;
      out.push({ title, why, severity });
    }
    return out;
  } catch {
    return [];
  }
}

export type TelegramChatContext = {
  userMessage: string;
  recentJournal: {
    situation: string;
    principle: string | null;
    lesson: string | null;
  }[];
  openBlocks: { title: string; body: string | null }[];
  openTolerances: {
    text: string;
    energy: number | null;
    firstStep: string | null;
    dueDate: string | null;
  }[];
  recentWeeks: {
    weekStart: string;
    win: string | null;
    pattern: string | null;
    change: string | null;
    summary: string | null;
  }[];
  attention: {
    text: string;
    bucket: "now" | "later";
    note: string | null;
  }[];
  todayFocus: { text: string; done: boolean }[];
  recentNotes: { category: string; content: string }[];
  recentThoughts: { content: string }[];
  openBeliefs: { text: string; reframe: string | null }[];
  contextNotes: { title: string; noteDate: string | null; content: string }[];
};

/** Inštrukcie formátu pre Telegram Rich Markdown (sendRichMessage). */
const TELEGRAM_RICH_FORMAT_RULES = [
  "Formátuj výstup pre Telegram Rich Markdown (nie klasický MarkdownV2, nie HTML):",
  "- Nadpisy: # pre hlavný titulok (max 1), ## pre sekcie. Krátke, s 1 emoji.",
  "- Tučné: **text** (nie *text* na tučné). Kurzívu použi zriedka: _text_.",
  "- Zoznamy: - položka. Kód len v `backticks` ak treba.",
  "- Pridaj 2-4 zmysluplné emoji (nadpisy / kľúčové body), nie spam na každý riadok.",
  "- Žiadne HTML tagy, žiadny ``` code fence okolo celej odpovede, žiadne úvodzovky okolo celej odpovede.",
].join("\n");

/** Prompt pre voľný chat s mentorom cez Telegram (široký LifeOS kontext). */
export function buildTelegramChatPrompt(ctx: TelegramChatContext): string {
  const lines: string[] = [
    "Si prísny, vecný a priamy osobný mentor v aplikácii LifeOS.",
    "Odpovedaj v slovenčine. Žiadny pozdrav, žiadne prázdne motivačné frázy.",
    "Dĺžka: typicky 4-12 riadkov. Pri komplexnejšej téme môžeš použiť krátke sekcie s ##.",
    "Kontext nižšie je odrazový mostík, nie skript. Primárne odpovedz na aktuálnu otázku / správu užívateľa.",
    "Neopakuj stále tú istú šablónu (vzorec → lekcia → otázka). Prispôsob formu otázke: ak chce krok, daj konkrétny krok; ak chce zrkadlo, pomenuj vzorec; ak sa pýta priamo, odpovedz priamo.",
    "Buď konkrétny a praktický. Ak kontext nestačí, povedz to a spýtaj sa na chýbajúce.",
    TELEGRAM_RICH_FORMAT_RULES,
    "",
  ];

  if (ctx.openBlocks.length > 0) {
    const text = ctx.openBlocks
      .map((b) => (b.body ? `${b.title}: ${b.body}` : b.title))
      .join("; ");
    lines.push(`Otvorené aktívne bloky: ${text}.`);
  } else {
    lines.push("Otvorené aktívne bloky: žiadne.");
  }

  if (ctx.recentJournal.length > 0) {
    const text = ctx.recentJournal
      .map((j) => {
        const parts = [j.situation];
        if (j.lesson) parts.push(`lekcia: ${j.lesson}`);
        if (j.principle) parts.push(`princíp: ${j.principle}`);
        return parts.join(" / ");
      })
      .join(" || ");
    lines.push(`Posledné zápisy z denníka: ${text}.`);
  } else {
    lines.push("Posledné zápisy z denníka: žiadne.");
  }

  if (ctx.openBeliefs.length > 0) {
    const text = ctx.openBeliefs
      .map((b) =>
        b.reframe ? `${b.text} (reframe: ${b.reframe})` : b.text,
      )
      .join("; ");
    lines.push(`Otvorené presvedčenia: ${text}.`);
  } else {
    lines.push("Otvorené presvedčenia: žiadne.");
  }

  if (ctx.recentThoughts.length > 0) {
    lines.push(
      `Nedávne myšlienky: ${ctx.recentThoughts.map((t) => t.content).join(" || ")}.`,
    );
  } else {
    lines.push("Nedávne myšlienky: žiadne.");
  }

  if (ctx.openTolerances.length > 0) {
    const text = ctx.openTolerances
      .map((t) => {
        const parts = [t.text];
        if (t.energy != null) parts.push(`energia ${t.energy}/10`);
        if (t.firstStep) parts.push(`prvý krok: ${t.firstStep}`);
        if (t.dueDate) parts.push(`termín: ${t.dueDate}`);
        return parts.join(", ");
      })
      .join("; ");
    lines.push(`Aktívne tolerancie (čo odčerpáva energiu): ${text}.`);
  } else {
    lines.push("Aktívne tolerancie: žiadne.");
  }

  if (ctx.todayFocus.length > 0) {
    const text = ctx.todayFocus
      .map((f) => `${f.done ? "[x]" : "[ ]"} ${f.text}`)
      .join("; ");
    lines.push(`Dnešný fokus: ${text}.`);
  } else {
    lines.push("Dnešný fokus: prázdny.");
  }

  const attentionNow = ctx.attention.filter((a) => a.bucket === "now");
  const attentionLater = ctx.attention.filter((a) => a.bucket === "later");
  if (attentionNow.length === 0 && attentionLater.length === 0) {
    lines.push("Pozornosť (teraz / odkladám): prázdna.");
  } else {
    if (attentionNow.length > 0) {
      const text = attentionNow
        .map((a) => (a.note ? `${a.text} (${a.note})` : a.text))
        .join("; ");
      lines.push(`Pozornosť - aktuálne dávam energiu: ${text}.`);
    }
    if (attentionLater.length > 0) {
      const text = attentionLater
        .map((a) => (a.note ? `${a.text} (${a.note})` : a.text))
        .join("; ");
      lines.push(`Pozornosť - odkladám / budúcnosť: ${text}.`);
    }
  }

  if (ctx.recentWeeks.length > 0) {
    const text = ctx.recentWeeks
      .map((w) => {
        const parts = [`týždeň ${w.weekStart}`];
        if (w.win) parts.push(`víťazstvo: ${w.win}`);
        if (w.pattern) parts.push(`vzorec: ${w.pattern}`);
        if (w.change) parts.push(`zmena: ${w.change}`);
        if (w.summary) parts.push(`súhrn: ${w.summary}`);
        return parts.join(", ");
      })
      .join(" || ");
    lines.push(`Týždenné reflexie: ${text}.`);
  } else {
    lines.push("Týždenné reflexie: žiadne.");
  }

  if (ctx.recentNotes.length > 0) {
    const text = ctx.recentNotes
      .map((n) => `[${n.category}] ${n.content}`)
      .join(" || ");
    lines.push(`Najnovšie poznámky: ${text}.`);
  } else {
    lines.push("Najnovšie poznámky: žiadne.");
  }

  if (ctx.contextNotes.length > 0) {
    lines.push(
      `Poznámky z Obsidianu (celý dostupný kontext, ${ctx.contextNotes.length} poznámok od najnovšej - novšie ber ako aktuálnejšie):`,
    );
    for (const n of ctx.contextNotes) {
      lines.push(`- ${n.noteDate ?? n.title}: ${n.content}`);
    }
  }

  lines.push("", `Správa od človeka: ${ctx.userMessage}`);
  return lines.join("\n");
}

export type MorningInsightContext = {
  recentJournal: {
    situation: string;
    reaction: string | null;
    feeling: string | null;
    meaning: string | null;
    lesson: string | null;
    principle: string | null;
  }[];
  beliefs: { text: string; reframe: string | null; resolved: boolean }[];
  thoughts: { content: string }[];
};

/** Prompt pre ranný cron: 1 kľúčový mentálny blok z existujúceho obsahu. */
export function buildMorningInsightPrompt(ctx: MorningInsightContext): string {
  const lines: string[] = [
    "Si prísny, vecný a priamy osobný mentor v aplikácii LifeOS.",
    "Analyzuj posledné zápisy a presvedčenia užívateľa.",
    "Identifikuj 1 kľúčový mentálny blok / problém, ktorý v živote práve rieši a na ktorý by sa mal dnes pozrieť.",
    "Formuluj to ostro, vecne a priamo v slovenčine.",
    "Štruktúra správy:",
    "1) # ☀️ Ranný fokus (alebo podobný krátky H1 s emoji)",
    "2) ## s názvom bloku / vzorca (1 riadok)",
    "3) 2-4 vety vysvetlenia, kľúčové slová **tučne**",
    "4) voliteľne ## 🎯 Dnes s jednou ostrou otázkou alebo konkrétnym krokom",
    "Bez pozdravu, bez oslovenia, bez prázdnych motivačných fráz.",
    "Ak dáta nestačia na jasný blok, pomenuj najväčší vzorec, ktorý z toho ide vyčítať, a daj jednu ostrú otázku na dnes.",
    TELEGRAM_RICH_FORMAT_RULES,
    "",
  ];

  if (ctx.recentJournal.length === 0) {
    lines.push("Denník: žiadne nedávne zápisy.");
  } else {
    lines.push("Denník (od najnovšieho):");
    ctx.recentJournal.forEach((j, i) => {
      const parts = [
        `${i + 1}. Situácia: ${j.situation}`,
        j.reaction && `reakcia: ${j.reaction}`,
        j.feeling && `pocit: ${j.feeling}`,
        j.meaning && `ukazuje: ${j.meaning}`,
        j.lesson && `lekcia: ${j.lesson}`,
        j.principle && `princíp: ${j.principle}`,
      ].filter(Boolean);
      lines.push(parts.join(" | "));
    });
  }

  const openBeliefs = ctx.beliefs.filter((b) => !b.resolved);
  if (openBeliefs.length === 0) {
    lines.push("", "Otvorené presvedčenia: žiadne.");
  } else {
    lines.push("", "Otvorené presvedčenia:");
    for (const b of openBeliefs) {
      lines.push(
        b.reframe
          ? `- ${b.text} (reframe: ${b.reframe})`
          : `- ${b.text}`,
      );
    }
  }

  if (ctx.thoughts.length > 0) {
    lines.push("", "Nedávne myšlienky:");
    for (const t of ctx.thoughts) {
      lines.push(`- ${t.content}`);
    }
  }

  return lines.join("\n");
}
