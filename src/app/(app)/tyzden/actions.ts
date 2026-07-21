"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { weeklyReviews } from "@/db/schema";
import { getWeekView } from "@/db/queries";
import { buildWeekSummary } from "@/lib/weekSummary";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveWeeklyReview(weekStartISO: string, formData: FormData) {
  await requireUser();

  const view = await getWeekView(weekStartISO);
  const summary = buildWeekSummary({
    avgEnergy: view.avgEnergy,
    habitStats: view.habitStats,
    journalCount: view.weekEntries.length,
    steps: view.steps,
  });

  const win = text(formData, "win");
  const pattern = text(formData, "pattern");
  const change = text(formData, "change");

  await db
    .insert(weeklyReviews)
    .values({ weekStart: weekStartISO, summary, win, pattern, change, doneAt: new Date() })
    .onConflictDoUpdate({
      target: weeklyReviews.weekStart,
      set: { summary, win, pattern, change, doneAt: new Date() },
    });

  revalidatePath("/tyzden");
}

export async function reopenWeeklyReview(weekStartISO: string) {
  await requireUser();
  await db
    .update(weeklyReviews)
    .set({ doneAt: null })
    .where(eq(weeklyReviews.weekStart, weekStartISO));
  revalidatePath("/tyzden");
}
