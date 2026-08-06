"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { generateText } from "@/lib/gemini";
import {
  buildJournalBlockExtractionPrompt,
  parseBlockCandidates,
  type BlockCandidate,
} from "@/lib/mentor";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type CreateJournalResult = {
  entryId: number;
  candidates: BlockCandidate[];
};

export async function createJournalEntry(
  formData: FormData,
): Promise<CreateJournalResult | null> {
  await requireUser();
  const situation = text(formData, "situation");
  if (!situation) return null;

  const trainingIdRaw = Number(formData.get("trainingId"));
  const trainingId =
    Number.isInteger(trainingIdRaw) && trainingIdRaw > 0
      ? trainingIdRaw
      : null;

  const reaction = text(formData, "reaction");
  const feeling = text(formData, "feeling");
  const meaning = text(formData, "meaning");
  const lesson = text(formData, "lesson");
  const principle = text(formData, "principle");

  const [row] = await db
    .insert(journalEntries)
    .values({
      situation,
      reaction,
      feeling,
      meaning,
      lesson,
      principle,
      trainingId,
    })
    .returning({ id: journalEntries.id });

  if (!row) return null;

  const raw = await generateText(
    buildJournalBlockExtractionPrompt({
      situation,
      reaction,
      feeling,
      meaning,
      lesson,
      principle,
    }),
  );
  const candidates = parseBlockCandidates(raw);

  revalidatePath("/dennik");
  revalidatePath("/");

  return { entryId: row.id, candidates };
}

export async function deleteJournalEntry(id: number) {
  await requireUser();
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
  revalidatePath("/dennik");
}
