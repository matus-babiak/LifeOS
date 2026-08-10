/**
 * Telegram /new a /ulozit: pridanie zápisu alebo uloženie existujúcej správy.
 * Auth je chat allowlist + webhook secret (rovnako ako bloky), nie session cookie.
 */

import { db } from "@/db";
import { beliefs, goals, notes, thoughts } from "@/db/schema";
import { getAreas } from "@/db/queries";
import {
  LIFEOS_CATEGORY,
  LIFEOS_CATEGORY_LABEL,
} from "@/lib/notes";
import type { InlineButton } from "@/lib/telegram";
import { formatSystemNotice } from "@/lib/telegram-format";

export type CaptureType = "thought" | "belief" | "note" | "goal";

export type CapturePrompt =
  | { type: "thought" }
  | { type: "belief" }
  | { type: "note"; category: string }
  | { type: "goal"; areaId: number };

export type NewCallback =
  | { action: "type"; type: CaptureType }
  | { action: "note-category"; category: string }
  | { action: "goal-area"; areaId: number };

export type SaveCallback =
  | { action: "ask" }
  | { action: "type"; type: CaptureType }
  | { action: "note-category"; category: string }
  | { action: "goal-area"; areaId: number };

export type SaveCaptureResult =
  | { ok: true; type: CaptureType; notice: string }
  | { ok: false };

const TYPE_LABEL: Record<CaptureType, string> = {
  thought: "myšlienka",
  belief: "presvedčenie",
  note: "poznámka",
  goal: "cieľ",
};

/** Hlavné menu po /new (nový text). */
export function newCaptureKeyboard() {
  return typeChoiceKeyboard("new");
}

/** Menu po /ulozit alebo tlačidle Uložiť (text zo správy). */
export function saveCaptureKeyboard() {
  return typeChoiceKeyboard("save");
}

function typeChoiceKeyboard(prefix: "new" | "save") {
  return {
    inline_keyboard: [
      [
        { text: "Myšlienka", callback_data: `${prefix}:thought` },
        { text: "Poznámka", callback_data: `${prefix}:note` },
      ],
      [
        { text: "Presvedčenie", callback_data: `${prefix}:belief` },
        { text: "Cieľ", callback_data: `${prefix}:goal` },
      ],
    ] satisfies InlineButton[][],
  };
}

/** Tlačidlo pod odpoveďou mentora / ranným fokusom. */
export function saveMessageKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "Uložiť do LifeOS", callback_data: "saveask" }],
    ] satisfies InlineButton[][],
  };
}

export function formatNewMenuMessage(): string {
  return [
    "## Pridať zápis",
    "",
    "Vyber, čo chceš uložiť.",
  ].join("\n");
}

export function formatSaveMenuMessage(): string {
  return [
    "## Uložiť správu",
    "",
    "Kam to dať v LifeOS?",
  ].join("\n");
}

function chunkButtons(buttons: InlineButton[], size = 2): InlineButton[][] {
  const rows: InlineButton[][] = [];
  for (let i = 0; i < buttons.length; i += size) {
    rows.push(buttons.slice(i, i + size));
  }
  return rows;
}

/** Menu kategórií poznámky (oblasti + LifeOS). */
export async function noteCategoryKeyboard(prefix: "new" | "save" = "new") {
  const areaList = await getAreas();
  const areaButtons: InlineButton[] = areaList.map((area) => ({
    text: area.name,
    callback_data: `${prefix}:note:${area.slug}`,
  }));
  const buttons = chunkButtons(areaButtons);
  buttons.push([
    {
      text: LIFEOS_CATEGORY_LABEL,
      callback_data: `${prefix}:note:${LIFEOS_CATEGORY}`,
    },
  ]);
  return { inline_keyboard: buttons };
}

export function formatNoteCategoryMessage(): string {
  return [
    "## Kam zaradiť poznámku?",
    "",
    "Vyber kategóriu.",
  ].join("\n");
}

/** Menu oblastí pre cieľ. */
export async function goalAreaKeyboard(prefix: "new" | "save" = "new") {
  const areaList = await getAreas();
  const areaButtons: InlineButton[] = areaList.map((area) => ({
    text: area.name,
    callback_data: `${prefix}:goal:${area.id}`,
  }));
  return { inline_keyboard: chunkButtons(areaButtons) };
}

export function formatGoalAreaMessage(): string {
  return [
    "## Do ktorej oblasti?",
    "",
    "Vyber oblasť cieľa.",
  ].join("\n");
}

export function capturePromptMarker(prompt: CapturePrompt): string {
  if (prompt.type === "thought") return "CAP:thought";
  if (prompt.type === "belief") return "CAP:belief";
  if (prompt.type === "note") return `CAP:note:${prompt.category}`;
  return `CAP:goal:${prompt.areaId}`;
}

export function formatCapturePromptMessage(prompt: CapturePrompt): string {
  const label = TYPE_LABEL[prompt.type];
  return [
    `## Napíš ${label}`,
    "",
    "Odpovedz na túto správu textom a uloží sa.",
    "",
    capturePromptMarker(prompt),
  ].join("\n");
}

export function parseCaptureFromPrompt(text: string): CapturePrompt | null {
  const thought = text.match(/\bCAP:thought\b/);
  if (thought) return { type: "thought" };

  const belief = text.match(/\bCAP:belief\b/);
  if (belief) return { type: "belief" };

  const note = text.match(/\bCAP:note:([a-z0-9-]+)\b/);
  if (note) return { type: "note", category: note[1] };

  const goal = text.match(/\bCAP:goal:(\d+)\b/);
  if (goal) {
    const areaId = Number(goal[1]);
    if (!Number.isInteger(areaId) || areaId <= 0) return null;
    return { type: "goal", areaId };
  }

  return null;
}

export function parseNewCallbackData(data: string): NewCallback | null {
  const typeMatch = data.match(/^new:(thought|belief|note|goal)$/);
  if (typeMatch) {
    return { action: "type", type: typeMatch[1] as CaptureType };
  }

  const noteCat = data.match(/^new:note:([a-z0-9-]+)$/);
  if (noteCat) {
    return { action: "note-category", category: noteCat[1] };
  }

  const goalArea = data.match(/^new:goal:(\d+)$/);
  if (goalArea) {
    const areaId = Number(goalArea[1]);
    if (!Number.isInteger(areaId) || areaId <= 0) return null;
    return { action: "goal-area", areaId };
  }

  return null;
}

export function parseSaveCallbackData(data: string): SaveCallback | null {
  if (data === "saveask") return { action: "ask" };

  const typeMatch = data.match(/^save:(thought|belief|note|goal)$/);
  if (typeMatch) {
    return { action: "type", type: typeMatch[1] as CaptureType };
  }

  const noteCat = data.match(/^save:note:([a-z0-9-]+)$/);
  if (noteCat) {
    return { action: "note-category", category: noteCat[1] };
  }

  const goalArea = data.match(/^save:goal:(\d+)$/);
  if (goalArea) {
    const areaId = Number(goalArea[1]);
    if (!Number.isInteger(areaId) || areaId <= 0) return null;
    return { action: "goal-area", areaId };
  }

  return null;
}

function isoDatePlusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function validNoteCategory(category: string): Promise<boolean> {
  if (category === LIFEOS_CATEGORY) return true;
  const areaList = await getAreas();
  return areaList.some((a) => a.slug === category);
}

async function validAreaId(areaId: number): Promise<boolean> {
  const areaList = await getAreas();
  return areaList.some((a) => a.id === areaId);
}

/** Uloží zápis podľa CAP výzvy alebo textu zo správy. Bez session. */
export async function saveCaptureFromPrompt(
  prompt: CapturePrompt,
  rawText: string,
): Promise<SaveCaptureResult> {
  const text = rawText.trim();
  if (!text) return { ok: false };

  if (prompt.type === "thought") {
    await db.insert(thoughts).values({ content: text });
    return {
      ok: true,
      type: "thought",
      notice: formatSystemNotice("Uložené", "Myšlienka je v LifeOS.", "✅"),
    };
  }

  if (prompt.type === "belief") {
    await db.insert(beliefs).values({ text });
    return {
      ok: true,
      type: "belief",
      notice: formatSystemNotice("Uložené", "Presvedčenie je v LifeOS.", "✅"),
    };
  }

  if (prompt.type === "note") {
    if (!(await validNoteCategory(prompt.category))) return { ok: false };
    await db.insert(notes).values({ content: text, category: prompt.category });
    return {
      ok: true,
      type: "note",
      notice: formatSystemNotice("Uložené", "Poznámka je v LifeOS.", "✅"),
    };
  }

  if (!(await validAreaId(prompt.areaId))) return { ok: false };
  const dueDate = isoDatePlusDays(30);
  const title = text.split("\n").map((l) => l.trim()).find(Boolean) ?? text;
  await db.insert(goals).values({
    title: title.slice(0, 300),
    areaId: prompt.areaId,
    dueDate,
  });
  return {
    ok: true,
    type: "goal",
    notice: formatSystemNotice(
      "Uložené",
      `Cieľ je v LifeOS. Termín: ${dueDate} (o 30 dní, môžeš upraviť na webe).`,
      "✅",
    ),
  };
}

export function pathsForCapture(type: CaptureType): readonly string[] {
  if (type === "thought") return ["/myslienky"];
  if (type === "belief") return ["/presvedcenia"];
  if (type === "note") return ["/poznamky"];
  return ["/vizia", "/"];
}

export function isNewCommand(text: string): boolean {
  return /^\/new(?:@\w+)?$/i.test(text.trim());
}

export function isUlozitCommand(text: string): boolean {
  return /^\/ulozit(?:@\w+)?$/i.test(text.trim());
}
