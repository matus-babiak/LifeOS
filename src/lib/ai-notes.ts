/**
 * AI poznámky z Telegramu: uloženie + automatická kategória cez Gemini.
 */

import { db } from "@/db";
import { aiNotes } from "@/db/schema";
import { getAiNoteCategories } from "@/db/queries";
import { generateText } from "@/lib/gemini";
import { formatSystemNotice } from "@/lib/telegram-format";

export const AI_NOTE_FALLBACK_CATEGORY = "Bez kategórie";

const MAX_CATEGORY_LEN = 60;

/** Zjednotí medzery a orezanie. */
export function normalizeCategoryLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_CATEGORY_LEN);
}

/** Nájde existujúcu kategóriu bez ohľadu na veľkosť písmen. */
export function matchExistingCategory(
  candidate: string,
  existing: string[],
): string | null {
  const norm = normalizeCategoryLabel(candidate).toLowerCase();
  if (!norm) return null;
  const found = existing.find((c) => c.toLowerCase() === norm);
  return found ?? null;
}

function parseCategoryFromModel(raw: string): string | null {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const cat = (parsed as { category?: unknown }).category;
      if (typeof cat === "string" && cat.trim()) {
        return normalizeCategoryLabel(cat);
      }
    }
    if (typeof parsed === "string" && parsed.trim()) {
      return normalizeCategoryLabel(parsed);
    }
  } catch {
    // plain text fallback below
  }

  const line = text
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  if (!line) return null;
  return normalizeCategoryLabel(line.replace(/^["']|["']$/g, ""));
}

function buildCategoryPrompt(
  content: string,
  existingCategories: string[],
): string {
  const existing =
    existingCategories.length > 0
      ? existingCategories.map((c) => `- ${c}`).join("\n")
      : "(zatiaľ žiadne)";

  return [
    "Si asistent v appke LifeOS. Priraď krátku kategóriu poznámke uloženej z odpovede AI mentora.",
    "Pravidlá:",
    "- Odpoveď výhradne ako JSON: {\"category\":\"...\"}",
    "- Kategória po slovensky, 1-4 slová, bez emoji, bez úvodzoviek navyše.",
    "- Ak niektorá z existujúcich kategórií sedí (aj pri inom skloňovaní), použij JU PRESNE v tom istom znení.",
    "- Novú kategóriu vytvor len ak žiadna existujúca nepasuje.",
    "- Nepíš vysvetlenie, len JSON.",
    "",
    "Existujúce kategórie:",
    existing,
    "",
    "Text poznámky:",
    content.slice(0, 4000),
  ].join("\n");
}

/** Navrhne kategóriu; pri zlyhaní Gemini vráti fallback. */
export async function suggestAiNoteCategory(
  content: string,
  existingCategories: string[],
): Promise<string> {
  const raw = await generateText(
    buildCategoryPrompt(content, existingCategories),
  );
  if (!raw) return AI_NOTE_FALLBACK_CATEGORY;

  const parsed = parseCategoryFromModel(raw);
  if (!parsed) return AI_NOTE_FALLBACK_CATEGORY;

  const matched = matchExistingCategory(parsed, existingCategories);
  if (matched) return matched;

  if (parsed.toLowerCase() === AI_NOTE_FALLBACK_CATEGORY.toLowerCase()) {
    return AI_NOTE_FALLBACK_CATEGORY;
  }

  return parsed;
}

export type SaveAiNoteResult =
  | { ok: true; category: string; notice: string }
  | { ok: false };

/** Uloží AI poznámku z Telegramu (bez session; auth je allowlist chatu). */
export async function saveAiNoteFromTelegram(
  rawContent: string,
): Promise<SaveAiNoteResult> {
  const content = rawContent.trim();
  if (!content) return { ok: false };

  const existing = await getAiNoteCategories();
  const category = await suggestAiNoteCategory(content, existing);

  await db.insert(aiNotes).values({ content, category });

  return {
    ok: true,
    category,
    notice: formatSystemNotice(
      "Uložené",
      `AI poznámka je v LifeOS.\nKategória: ${category}`,
      "✅",
    ),
  };
}
