"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiNotes } from "@/db/schema";
import { normalizeCategoryLabel } from "@/lib/ai-notes";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateAiNoteCategory(id: number, formData: FormData) {
  await requireUser();
  const categoryRaw = text(formData, "category");
  if (!categoryRaw) return;

  const category = normalizeCategoryLabel(categoryRaw);
  if (!category) return;

  await db.update(aiNotes).set({ category }).where(eq(aiNotes.id, id));
  revalidatePath("/ai-poznamky");
}

export async function deleteAiNote(id: number) {
  await requireUser();
  await db.delete(aiNotes).where(eq(aiNotes.id, id));
  revalidatePath("/ai-poznamky");
}
