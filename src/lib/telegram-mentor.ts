import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  activeBlocks,
  attentionItems,
  beliefs,
  focusItems,
  journalEntries,
  notes,
  thoughts,
  tolerances,
  weeklyReviews,
} from "@/db/schema";
import { todayISO } from "@/lib/dates";
import { generateText } from "@/lib/gemini";
import { buildTelegramChatPrompt } from "@/lib/mentor";

const JOURNAL_LIMIT = 5;
const TOLERANCE_LIMIT = 10;
const WEEKLY_LIMIT = 3;
const ATTENTION_LIMIT = 12;
const NOTES_LIMIT = 5;
const THOUGHTS_LIMIT = 5;
const BELIEFS_LIMIT = 8;
const TELEGRAM_MAX_LEN = 4000;

/** Načíta široký LifeOS kontext a nechá Gemini odpovedať ako mentor. */
export async function replyAsTelegramMentor(
  userMessage: string,
): Promise<string> {
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
  ] = await Promise.all([
    db
      .select({
        situation: journalEntries.situation,
        principle: journalEntries.principle,
        lesson: journalEntries.lesson,
      })
      .from(journalEntries)
      .orderBy(desc(journalEntries.createdAt))
      .limit(JOURNAL_LIMIT),
    db
      .select({
        title: activeBlocks.title,
        body: activeBlocks.body,
      })
      .from(activeBlocks)
      .where(isNull(activeBlocks.closedAt))
      .orderBy(desc(activeBlocks.createdAt)),
    db
      .select({
        text: tolerances.text,
        energy: tolerances.energy,
        firstStep: tolerances.firstStep,
        dueDate: tolerances.dueDate,
      })
      .from(tolerances)
      .where(isNull(tolerances.doneAt))
      .orderBy(desc(tolerances.createdAt))
      .limit(TOLERANCE_LIMIT),
    db
      .select({
        weekStart: weeklyReviews.weekStart,
        win: weeklyReviews.win,
        pattern: weeklyReviews.pattern,
        change: weeklyReviews.change,
        summary: weeklyReviews.summary,
      })
      .from(weeklyReviews)
      .orderBy(desc(weeklyReviews.weekStart))
      .limit(WEEKLY_LIMIT),
    db
      .select({
        text: attentionItems.text,
        bucket: attentionItems.bucket,
        note: attentionItems.note,
      })
      .from(attentionItems)
      .orderBy(desc(attentionItems.updatedAt))
      .limit(ATTENTION_LIMIT),
    db
      .select({
        text: focusItems.text,
        done: focusItems.done,
      })
      .from(focusItems)
      .where(eq(focusItems.date, today))
      .orderBy(focusItems.position),
    db
      .select({
        category: notes.category,
        content: notes.content,
      })
      .from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(NOTES_LIMIT),
    db
      .select({ content: thoughts.content })
      .from(thoughts)
      .orderBy(desc(thoughts.createdAt))
      .limit(THOUGHTS_LIMIT),
    db
      .select({
        text: beliefs.text,
        reframe: beliefs.reframe,
      })
      .from(beliefs)
      .where(eq(beliefs.resolved, false))
      .orderBy(desc(beliefs.createdAt))
      .limit(BELIEFS_LIMIT),
  ]);

  const prompt = buildTelegramChatPrompt({
    userMessage,
    recentJournal,
    openBlocks,
    openTolerances,
    recentWeeks,
    attention,
    todayFocus,
    recentNotes,
    recentThoughts,
    openBeliefs,
  });

  const answer = await generateText(prompt);
  if (!answer) {
    return "Momentálne neviem odpovedať (AI nie je dostupná). Skús to o chvíľu znova.";
  }

  if (answer.length <= TELEGRAM_MAX_LEN) return answer;
  return `${answer.slice(0, TELEGRAM_MAX_LEN - 1)}…`;
}
