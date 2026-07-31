"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { thoughts } from "@/db/schema";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createThought(formData: FormData) {
  await requireUser();
  const content = text(formData, "content");
  if (!content) return;

  await db.insert(thoughts).values({ content });
  revalidatePath("/myslienky");
}

export async function deleteThought(id: number) {
  await requireUser();
  await db.delete(thoughts).where(eq(thoughts.id, id));
  revalidatePath("/myslienky");
}
