"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { focusItems, progressFocusItems } from "@/db/schema";
import { todayISO } from "@/lib/dates";
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

export async function focusProgressItemToday(
  id: number,
): Promise<{ ok: true } | { ok: false; reason: "full" | "missing" }> {
  await requireUser();
  const [item] = await db
    .select()
    .from(progressFocusItems)
    .where(eq(progressFocusItems.id, id))
    .limit(1);
  if (!item) return { ok: false, reason: "missing" };

  const today = todayISO();
  const existing = await db
    .select({ total: count() })
    .from(focusItems)
    .where(eq(focusItems.date, today));
  const total = Number(existing[0]?.total ?? 0);
  if (total >= 3) return { ok: false, reason: "full" };

  const text = (item.nextStep?.trim() || item.title).slice(0, 300);
  await db.insert(focusItems).values({
    date: today,
    text,
    position: total,
  });
  revalidatePath("/");
  revalidatePath(`/progress-focus/${id}`);
  return { ok: true };
}
