"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { LIFEOS_CATEGORY } from "@/lib/notes";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createNote(formData: FormData) {
  await requireUser();
  const content = text(formData, "content");
  if (!content) return;

  const category = text(formData, "category") ?? LIFEOS_CATEGORY;

  await db.insert(notes).values({ content, category });
  revalidatePath("/poznamky");
}

export async function deleteNote(id: number) {
  await requireUser();
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath("/poznamky");
}
