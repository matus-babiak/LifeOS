import type { ExportDay, ExportWeek } from "@/db/queries";
import { formatFileDate } from "@/lib/dates";

const MONTH_NAMES = [
  "Január",
  "Február",
  "Marec",
  "Apríl",
  "Máj",
  "Jún",
  "Júl",
  "August",
  "September",
  "Október",
  "November",
  "December",
];

/** `1 Sebareflexia/1 Denné poznámky/RRRR/M Mesiac/DD.MM.RRRR.md` */
export function vaultDailyPath(iso: string): string {
  const [year, month] = iso.split("-");
  const monthFolder = `${month} ${MONTH_NAMES[Number(month) - 1]}`;
  return `1 Sebareflexia/1 Denné poznámky/${year}/${monthFolder}/${formatFileDate(iso)}.md`;
}

/** `2 Weekly review/DD.MM.RRRR.md`, pomenované podľa pondelka daného týždňa. */
export function vaultWeeklyPath(weekStartISO: string): string {
  return `2 Weekly review/${formatFileDate(weekStartISO)}.md`;
}

export function buildDailyNote(day: ExportDay): string {
  const lines: string[] = [`# ${formatFileDate(day.date)}`, ""];

  if (day.checkin?.energy != null || day.checkin?.identityFocus) {
    lines.push("## Ráno");
    if (day.checkin.energy != null) lines.push(`- Energia: ${day.checkin.energy}/10`);
    if (day.checkin.identityFocus) {
      lines.push(`- Dnes chcem byť: ${day.checkin.identityFocus}`);
    }
    lines.push("");
  }

  if (day.focus.length > 0) {
    lines.push("## Fokus");
    day.focus.forEach((f) => lines.push(`- [${f.done ? "x" : " "}] ${f.text}`));
    lines.push("");
  }

  if (day.habitNames.length > 0) {
    lines.push("## Návyky");
    day.habitNames.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }

  const { checkin } = day;
  if (checkin?.wins || checkin?.learned || checkin?.improve) {
    lines.push("## Večer");
    if (checkin.wins) lines.push(`**Čo sa mi podarilo:** ${checkin.wins}`);
    if (checkin.learned) lines.push(`**Čo som sa naučil:** ${checkin.learned}`);
    if (checkin.improve) lines.push(`**Čo zajtra zlepším:** ${checkin.improve}`);
    lines.push("");
  }

  if (day.journalEntries.length > 0) {
    lines.push("## Denník");
    day.journalEntries.forEach((e) => {
      lines.push(`### ${e.situation}${e.trainingName ? ` (${e.trainingName})` : ""}`);
      if (e.reaction) lines.push(`- Reakcia: ${e.reaction}`);
      if (e.feeling) lines.push(`- Pocit: ${e.feeling}`);
      if (e.meaning) lines.push(`- Čo to ukazuje: ${e.meaning}`);
      if (e.lesson) lines.push(`- Lekcia: ${e.lesson}`);
      if (e.principle) lines.push(`- Princíp: ${e.principle}`);
      lines.push("");
    });
  }

  return lines.join("\n").trim() + "\n";
}

export function buildWeeklyNote(week: ExportWeek): string {
  const lines: string[] = [`# Týždeň od ${formatFileDate(week.weekStart)}`, ""];
  if (week.summary) lines.push("## Súhrn", week.summary, "");
  if (week.win) lines.push("## Najväčšie víťazstvo", week.win, "");
  if (week.pattern) lines.push("## Čo sa opakovalo", week.pattern, "");
  if (week.change) lines.push("## Čo zmením", week.change, "");
  return lines.join("\n").trim() + "\n";
}
