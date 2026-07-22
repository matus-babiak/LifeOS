"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { beliefs } from "@/db/schema";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createBelief(formData: FormData) {
  await requireUser();
  const beliefText = text(formData, "text");
  if (!beliefText) return;

  await db.insert(beliefs).values({ text: beliefText });
  revalidatePath("/presvedcenia");
}

export async function toggleBeliefResolved(id: number) {
  await requireUser();
  const [belief] = await db.select().from(beliefs).where(eq(beliefs.id, id));
  if (!belief) return;

  await db
    .update(beliefs)
    .set({ resolved: !belief.resolved })
    .where(eq(beliefs.id, id));
  revalidatePath("/presvedcenia");
}

export async function deleteBelief(id: number) {
  await requireUser();
  await db.delete(beliefs).where(eq(beliefs.id, id));
  revalidatePath("/presvedcenia");
}
