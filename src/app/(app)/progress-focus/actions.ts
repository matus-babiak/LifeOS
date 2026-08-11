"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { progressFocusItems } from "@/db/schema";
import { generateAndStoreProgressFocus } from "@/lib/progress-focus";
import { requireUser } from "@/lib/session";

export async function generateProgressFocusAction(): Promise<{
  added: number;
  reason: "no_ai" | "none_new" | "ok";
}> {
  await requireUser();
  const result = await generateAndStoreProgressFocus();
  revalidatePath("/progress-focus");
  return {
    added: result.added,
    reason: result.reason ?? (result.added > 0 ? "ok" : "none_new"),
  };
}

export async function markProgressFocusDone(id: number) {
  await requireUser();
  const now = new Date();
  await db
    .update(progressFocusItems)
    .set({ status: "done", doneAt: now, updatedAt: now })
    .where(eq(progressFocusItems.id, id));
  revalidatePath("/progress-focus");
  revalidatePath(`/progress-focus/${id}`);
}

export async function dismissProgressFocus(id: number) {
  await requireUser();
  const now = new Date();
  await db
    .update(progressFocusItems)
    .set({ status: "dismissed", updatedAt: now })
    .where(eq(progressFocusItems.id, id));
  revalidatePath("/progress-focus");
  revalidatePath(`/progress-focus/${id}`);
}

/** Vráti položku späť medzi aktívne (po Hotovo / Odložiť). */
export async function restoreProgressFocus(id: number) {
  await requireUser();
  const now = new Date();
  await db
    .update(progressFocusItems)
    .set({
      status: "active",
      doneAt: null,
      updatedAt: now,
    })
    .where(eq(progressFocusItems.id, id));
  revalidatePath("/progress-focus");
  revalidatePath(`/progress-focus/${id}`);
}
