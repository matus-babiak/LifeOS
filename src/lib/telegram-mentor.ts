import { desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { activeBlocks, journalEntries } from "@/db/schema";
import { generateText } from "@/lib/gemini";
import { buildTelegramChatPrompt } from "@/lib/mentor";

const JOURNAL_LIMIT = 5;
const TELEGRAM_MAX_LEN = 4000;

/** Načíta denník + otvorené bloky a nechá Gemini odpovedať ako mentor. */
export async function replyAsTelegramMentor(
  userMessage: string,
): Promise<string> {
  const [recentJournal, openBlocks] = await Promise.all([
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
  ]);

  const prompt = buildTelegramChatPrompt({
    userMessage,
    recentJournal,
    openBlocks,
  });

  const answer = await generateText(prompt);
  if (!answer) {
    return "Momentálne neviem odpovedať (AI nie je dostupná). Skús to o chvíľu znova.";
  }

  if (answer.length <= TELEGRAM_MAX_LEN) return answer;
  return `${answer.slice(0, TELEGRAM_MAX_LEN - 1)}…`;
}
