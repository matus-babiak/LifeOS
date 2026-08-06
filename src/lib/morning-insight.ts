import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { beliefs, journalEntries, thoughts } from "@/db/schema";
import { generateText } from "@/lib/gemini";
import { buildMorningInsightPrompt } from "@/lib/mentor";

const JOURNAL_LIMIT = 5;
const BELIEF_LIMIT = 8;
const THOUGHT_LIMIT = 5;
const TELEGRAM_MAX_LEN = 4000;

/**
 * Autonómna ranná analýza: denník + presvedčenia (+ myšlienky) → 1 mentálny blok cez Gemini.
 * Nevyžaduje manuálne active_blocks.
 */
export async function generateMorningInsight(): Promise<{
  insight: string | null;
  reason?: "no_content" | "gemini_failed";
  journalCount: number;
  beliefCount: number;
}> {
  const [recentJournal, openBeliefs, recentThoughts] = await Promise.all([
    db
      .select({
        situation: journalEntries.situation,
        reaction: journalEntries.reaction,
        feeling: journalEntries.feeling,
        meaning: journalEntries.meaning,
        lesson: journalEntries.lesson,
        principle: journalEntries.principle,
      })
      .from(journalEntries)
      .orderBy(desc(journalEntries.createdAt))
      .limit(JOURNAL_LIMIT),
    db
      .select({
        text: beliefs.text,
        reframe: beliefs.reframe,
        resolved: beliefs.resolved,
      })
      .from(beliefs)
      .where(eq(beliefs.resolved, false))
      .orderBy(desc(beliefs.createdAt))
      .limit(BELIEF_LIMIT),
    db
      .select({ content: thoughts.content })
      .from(thoughts)
      .orderBy(desc(thoughts.createdAt))
      .limit(THOUGHT_LIMIT),
  ]);

  if (
    recentJournal.length === 0 &&
    openBeliefs.length === 0 &&
    recentThoughts.length === 0
  ) {
    return {
      insight: null,
      reason: "no_content",
      journalCount: 0,
      beliefCount: 0,
    };
  }

  const raw = await generateText(
    buildMorningInsightPrompt({
      recentJournal,
      beliefs: openBeliefs,
      thoughts: recentThoughts,
    }),
  );

  if (!raw) {
    return {
      insight: null,
      reason: "gemini_failed",
      journalCount: recentJournal.length,
      beliefCount: openBeliefs.length,
    };
  }

  const insight =
    raw.length <= TELEGRAM_MAX_LEN
      ? raw
      : `${raw.slice(0, TELEGRAM_MAX_LEN - 1)}…`;

  return {
    insight,
    journalCount: recentJournal.length,
    beliefCount: openBeliefs.length,
  };
}
