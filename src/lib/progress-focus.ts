/**
 * Progress focus: AI návrhy vecí na vedomú prácu (max 5, bez opakovania).
 */

import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  activeBlocks,
  attentionItems,
  beliefs,
  focusItems,
  goals,
  journalEntries,
  notes,
  progressFocusItems,
  thoughts,
  tolerances,
  trainings,
  weeklyReviews,
} from "@/db/schema";
import { getContextForMentor } from "@/db/queries";
import { todayISO } from "@/lib/dates";
import { generateText } from "@/lib/gemini";
import { stripOuterCodeFence } from "@/lib/telegram-format";

export type ProgressFocusDraft = {
  title: string;
  summary: string;
  detail: string;
  nextStep: string | null;
  fingerprint: string;
};

export type GenerateProgressFocusResult = {
  added: number;
  reason?: "no_ai" | "none_new" | "ok";
};

const MAX_NEW = 5;

/** Stabilný fingerprint z názvu (anti-repeat). */
export function fingerprintFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || `item-${Date.now()}`;
}

function buildProgressFocusPrompt(
  contextBlock: string,
  existing: { fingerprint: string; title: string }[],
): string {
  const already =
    existing.length === 0
      ? "(žiadne)"
      : existing
          .map((e) => `- ${e.title} [${e.fingerprint}]`)
          .join("\n");

  return [
    "Si mentor v LifeOS. Z celého kontextu navrhni veci, na ktorých má človek VEDOME pracovať a meniť sa.",
    "Nie klasický todo-list. Identitný tón: konkrétna zmena správania, postoja alebo návyku.",
    `Navrhni NAJVIAC ${MAX_NEW} NOVÝCH položiek. Menej je OK. Ak už nie je čo nové a užitočné, vráť [].`,
    "NESMIEŠ opakovať ani parafrázovať položky zo zoznamu už navrhnutých.",
    "Vráť IBA platný JSON, nič iné (žiadny markdown, žiadny komentár).",
    'Formát: [{"title":"krátky názov","summary":"1-2 vety prečo/čo zmeniť","detail":"ako na tom pracovať","next_step":"jeden najbližší krok","fingerprint":"kratky-slug"}]',
    "",
    "Už navrhnuté (nesmieš opakovať):",
    already,
    "",
    "Kontext LifeOS:",
    contextBlock,
  ].join("\n");
}

async function loadContextBlock(): Promise<string> {
  const today = todayISO();
  const [
    recentJournal,
    openBlocks,
    openTolerances,
    recentWeeks,
    attention,
    todayFocus,
    recentNotes,
    recentThoughts,
    openBeliefs,
    openGoals,
    activeTrainings,
  ] = await Promise.all([
    db
      .select({
        situation: journalEntries.situation,
        feeling: journalEntries.feeling,
        lesson: journalEntries.lesson,
        principle: journalEntries.principle,
      })
      .from(journalEntries)
      .orderBy(desc(journalEntries.createdAt))
      .limit(5),
    db
      .select({ title: activeBlocks.title, body: activeBlocks.body })
      .from(activeBlocks)
      .where(isNull(activeBlocks.closedAt))
      .orderBy(desc(activeBlocks.createdAt))
      .limit(8),
    db
      .select({
        text: tolerances.text,
        energy: tolerances.energy,
        firstStep: tolerances.firstStep,
      })
      .from(tolerances)
      .where(isNull(tolerances.doneAt))
      .orderBy(desc(tolerances.createdAt))
      .limit(10),
    db
      .select({
        weekStart: weeklyReviews.weekStart,
        win: weeklyReviews.win,
        pattern: weeklyReviews.pattern,
        change: weeklyReviews.change,
      })
      .from(weeklyReviews)
      .orderBy(desc(weeklyReviews.weekStart))
      .limit(3),
    db
      .select({
        text: attentionItems.text,
        bucket: attentionItems.bucket,
      })
      .from(attentionItems)
      .orderBy(desc(attentionItems.updatedAt))
      .limit(12),
    db
      .select({ text: focusItems.text, done: focusItems.done })
      .from(focusItems)
      .where(eq(focusItems.date, today))
      .orderBy(focusItems.position),
    db
      .select({ category: notes.category, content: notes.content })
      .from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(8),
    db
      .select({ content: thoughts.content })
      .from(thoughts)
      .orderBy(desc(thoughts.createdAt))
      .limit(8),
    db
      .select({ text: beliefs.text, reframe: beliefs.reframe })
      .from(beliefs)
      .where(eq(beliefs.resolved, false))
      .orderBy(desc(beliefs.createdAt))
      .limit(8),
    db
      .select({ title: goals.title, dueDate: goals.dueDate })
      .from(goals)
      .where(isNull(goals.doneAt))
      .orderBy(goals.dueDate)
      .limit(8),
    db
      .select({
        name: trainings.name,
        dailyStep: trainings.dailyStep,
        why: trainings.why,
      })
      .from(trainings)
      .where(eq(trainings.status, "active"))
      .orderBy(desc(trainings.createdAt))
      .limit(5),
  ]);

  const contextNotes = await getContextForMentor(120_000);

  const lines: string[] = [];
  if (openGoals.length) {
    lines.push(
      "Ciele:",
      ...openGoals.map((g) => `- ${g.title} (do ${g.dueDate})`),
    );
  }
  if (activeTrainings.length) {
    lines.push(
      "Aktívne tréningy:",
      ...activeTrainings.map(
        (t) =>
          `- ${t.name}${t.dailyStep ? `: ${t.dailyStep}` : ""}${t.why ? ` (prečo: ${t.why})` : ""}`,
      ),
    );
  }
  if (todayFocus.length) {
    lines.push(
      "Dnešný fokus:",
      ...todayFocus.map((f) => `- ${f.done ? "[x]" : "[ ]"} ${f.text}`),
    );
  }
  if (attention.length) {
    lines.push(
      "Pozornosť:",
      ...attention.map((a) => `- (${a.bucket}) ${a.text}`),
    );
  }
  if (openBlocks.length) {
    lines.push(
      "Aktívne bloky:",
      ...openBlocks.map((b) => `- ${b.title}${b.body ? `: ${b.body}` : ""}`),
    );
  }
  if (openTolerances.length) {
    lines.push(
      "Tolerancie:",
      ...openTolerances.map(
        (t) =>
          `- ${t.text}${t.firstStep ? ` → ${t.firstStep}` : ""}${t.energy != null ? ` (energia ${t.energy})` : ""}`,
      ),
    );
  }
  if (openBeliefs.length) {
    lines.push(
      "Presvedčenia:",
      ...openBeliefs.map((b) =>
        b.reframe ? `- ${b.text} (reframe: ${b.reframe})` : `- ${b.text}`,
      ),
    );
  }
  if (recentThoughts.length) {
    lines.push(
      "Myšlienky:",
      ...recentThoughts.map((t) => `- ${t.content}`),
    );
  }
  if (recentNotes.length) {
    lines.push(
      "Poznámky:",
      ...recentNotes.map((n) => `- [${n.category}] ${n.content}`),
    );
  }
  if (recentJournal.length) {
    lines.push(
      "Denník:",
      ...recentJournal.map((j) => {
        const parts = [j.situation];
        if (j.feeling) parts.push(`pocit: ${j.feeling}`);
        if (j.lesson) parts.push(`lekcia: ${j.lesson}`);
        if (j.principle) parts.push(`princíp: ${j.principle}`);
        return `- ${parts.join(" | ")}`;
      }),
    );
  }
  if (recentWeeks.length) {
    lines.push(
      "Týždne:",
      ...recentWeeks.map((w) => {
        const parts = [`týždeň ${w.weekStart}`];
        if (w.win) parts.push(`víťazstvo: ${w.win}`);
        if (w.pattern) parts.push(`vzorec: ${w.pattern}`);
        if (w.change) parts.push(`zmena: ${w.change}`);
        return `- ${parts.join(" | ")}`;
      }),
    );
  }
  if (contextNotes.length) {
    lines.push(
      "Obsidian kontext:",
      ...contextNotes
        .slice(0, 12)
        .map((n) => `- ${n.title}: ${n.content.slice(0, 400)}`),
    );
  }

  return lines.join("\n") || "(kontext je zatiaľ prázdny)";
}

/** Parsuje JSON návrhov z Gemini. */
export function parseProgressFocusDrafts(raw: string | null): ProgressFocusDraft[] {
  if (!raw) return [];

  let text = stripOuterCodeFence(raw.trim());
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: ProgressFocusDraft[] = [];
    for (const item of parsed.slice(0, MAX_NEW)) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      if (!title) continue;
      const summary =
        typeof row.summary === "string" && row.summary.trim()
          ? row.summary.trim()
          : title;
      const detail =
        typeof row.detail === "string" && row.detail.trim()
          ? row.detail.trim()
          : summary;
      const nextStepRaw =
        typeof row.next_step === "string"
          ? row.next_step.trim()
          : typeof row.nextStep === "string"
            ? row.nextStep.trim()
            : "";
      const nextStep = nextStepRaw || detail.split("\n").map((l) => l.trim()).find(Boolean) || title;
      const fpSeed =
        typeof row.fingerprint === "string" && row.fingerprint.trim()
          ? row.fingerprint.trim()
          : title;
      out.push({
        title: title.slice(0, 200),
        summary: summary.slice(0, 500),
        detail,
        nextStep: nextStep.slice(0, 300),
        fingerprint: fingerprintFromTitle(fpSeed || title),
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** Vygeneruje a uloží až 5 nových active položiek. */
export async function generateAndStoreProgressFocus(): Promise<GenerateProgressFocusResult> {
  const existing = await db
    .select({
      fingerprint: progressFocusItems.fingerprint,
      title: progressFocusItems.title,
    })
    .from(progressFocusItems);

  const existingFp = new Set(existing.map((e) => e.fingerprint));
  const contextBlock = await loadContextBlock();
  const prompt = buildProgressFocusPrompt(contextBlock, existing);
  const raw = await generateText(prompt);
  if (!raw) return { added: 0, reason: "no_ai" };

  const drafts = parseProgressFocusDrafts(raw);
  const fresh: ProgressFocusDraft[] = [];
  const seen = new Set<string>(existingFp);

  for (const draft of drafts) {
    let fp = draft.fingerprint;
    if (seen.has(fp)) {
      fp = fingerprintFromTitle(`${draft.title}-${draft.summary.slice(0, 40)}`);
    }
    if (seen.has(fp)) continue;
    seen.add(fp);
    fresh.push({ ...draft, fingerprint: fp });
    if (fresh.length >= MAX_NEW) break;
  }

  if (fresh.length === 0) return { added: 0, reason: "none_new" };

  const now = new Date();
  await db.insert(progressFocusItems).values(
    fresh.map((d) => ({
      title: d.title,
      summary: d.summary,
      detail: d.detail,
      nextStep: d.nextStep,
      status: "active",
      fingerprint: d.fingerprint,
      acceptedAt: now,
      updatedAt: now,
    })),
  );

  return { added: fresh.length, reason: "ok" };
}
