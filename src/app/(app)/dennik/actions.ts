"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createJournalEntry(formData: FormData) {
  await requireUser();
  const situation = text(formData, "situation");
  if (!situation) return;

  const trainingIdRaw = Number(formData.get("trainingId"));
  const trainingId = Number.isInteger(trainingIdRaw) && trainingIdRaw > 0
    ? trainingIdRaw
    : null;

  await db.insert(journalEntries).values({
    situation,
    reaction: text(formData, "reaction"),
    feeling: text(formData, "feeling"),
    meaning: text(formData, "meaning"),
    lesson: text(formData, "lesson"),
    principle: text(formData, "principle"),
    trainingId,
  });
  revalidatePath("/dennik");
}

export async function deleteJournalEntry(id: number) {
  await requireUser();
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
  revalidatePath("/dennik");
}
