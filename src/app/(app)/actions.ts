"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyCheckins,
  focusItems,
  habitLogs,
  habits,
} from "@/db/schema";
import { todayISO } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export type ToggleFocusResult = { id: number; done: boolean };
export type ToggleHabitResult = {
  doneToday: boolean;
  collected: number;
  status: "building" | "established";
};

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveMorning(formData: FormData) {
  await requireUser();
  const today = todayISO();

  const energyRaw = Number(formData.get("energy"));
  const energy =
    Number.isInteger(energyRaw) && energyRaw >= 1 && energyRaw <= 10
      ? energyRaw
      : null;
  const identityFocus = text(formData, "identityFocus");

  await db
    .insert(dailyCheckins)
    .values({
      date: today,
      energy,
      identityFocus,
      morningDoneAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dailyCheckins.date,
      set: { energy, identityFocus, morningDoneAt: new Date() },
    });

  const items = [
    text(formData, "focus1"),
    text(formData, "focus2"),
    text(formData, "focus3"),
  ].filter((t): t is string => t !== null);

  await db.delete(focusItems).where(eq(focusItems.date, today));
  if (items.length > 0) {
    await db.insert(focusItems).values(
      items.slice(0, 3).map((t, i) => ({ date: today, text: t, position: i })),
    );
  }

  revalidatePath("/");
}

export async function saveEvening(formData: FormData) {
  await requireUser();
  const today = todayISO();

  const wins = text(formData, "wins");
  const learned = text(formData, "learned");
  const improve = text(formData, "improve");

  await db
    .insert(dailyCheckins)
    .values({ date: today, wins, learned, improve, eveningDoneAt: new Date() })
    .onConflictDoUpdate({
      target: dailyCheckins.date,
      set: { wins, learned, improve, eveningDoneAt: new Date() },
    });

  revalidatePath("/");
}

/** Prepne fokus bez revalidatePath: klient potvrdí stav z návratovej hodnoty. */
export async function toggleFocus(
  id: number,
): Promise<ToggleFocusResult | null> {
  await requireUser();
  const [updated] = await db
    .update(focusItems)
    .set({ done: sql`NOT ${focusItems.done}` })
    .where(eq(focusItems.id, id))
    .returning({ id: focusItems.id, done: focusItems.done });
  return updated ?? null;
}

export async function addFocus(formData: FormData) {
  await requireUser();
  const today = todayISO();
  const value = text(formData, "text");
  if (!value) return;

  const existing = await db
    .select({ total: count() })
    .from(focusItems)
    .where(eq(focusItems.date, today));
  const total = Number(existing[0]?.total ?? 0);
  if (total >= 3) return; // max 3 položky fokusu

  await db
    .insert(focusItems)
    .values({ date: today, text: value, position: total });
  revalidatePath("/");
}

/**
 * Prepne dnešný log návyku bez plného RSC refetchu.
 * Habit + existujúci log idú paralelne; status sa nastaví jedným UPDATE s COUNT v SQL.
 */
export async function toggleHabit(
  habitId: number,
): Promise<ToggleHabitResult | null> {
  await requireUser();
  const today = todayISO();

  const [habitRows, logRows] = await Promise.all([
    db.select().from(habits).where(eq(habits.id, habitId)),
    db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, today))),
  ]);

  const habit = habitRows[0];
  if (!habit || habit.status === "archived") return null;

  const existing = logRows[0];
  let doneToday: boolean;
  if (existing) {
    await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
    doneToday = false;
  } else {
    await db.insert(habitLogs).values({ habitId, date: today });
    doneToday = true;
  }

  // Jeden round-trip: spočíta logy a nastaví building/established
  const [row] = await db
    .update(habits)
    .set({
      status: sql`CASE
        WHEN (SELECT COUNT(*)::int FROM habit_logs WHERE habit_id = ${habitId}) >= ${habit.targetDays}
        THEN 'established'::habit_status
        ELSE 'building'::habit_status
      END`,
    })
    .where(eq(habits.id, habitId))
    .returning({
      status: habits.status,
      collected: sql<number>`(SELECT COUNT(*)::int FROM habit_logs WHERE habit_id = ${habitId})`,
    });

  if (!row) return null;

  return {
    doneToday,
    collected: Number(row.collected),
    status: row.status === "established" ? "established" : "building",
  };
}

export async function createHabit(formData: FormData) {
  await requireUser();

  const name = text(formData, "name");
  if (!name) return;
  const identity = text(formData, "identity");

  const frequencyRaw = formData.get("frequency");
  const frequency =
    frequencyRaw === "weekdays" || frequencyRaw === "per_week"
      ? frequencyRaw
      : "daily";
  const perWeekRaw = Number(formData.get("perWeekTarget"));
  const perWeekTarget =
    frequency === "per_week" &&
    Number.isInteger(perWeekRaw) &&
    perWeekRaw >= 1 &&
    perWeekRaw <= 7
      ? perWeekRaw
      : null;

  const targetRaw = formData.get("targetDays");
  let targetDays = 21;
  if (targetRaw === "66") targetDays = 66;
  else if (targetRaw === "custom") {
    const custom = Number(formData.get("targetDaysCustom"));
    if (Number.isInteger(custom) && custom >= 7 && custom <= 365) {
      targetDays = custom;
    }
  }

  await db
    .insert(habits)
    .values({ name, identity, frequency, perWeekTarget, targetDays });

  revalidatePath("/");
  revalidatePath("/navyky");
}

export async function archiveHabit(habitId: number) {
  await requireUser();
  await db
    .update(habits)
    .set({ status: "archived" })
    .where(eq(habits.id, habitId));
  revalidatePath("/");
  revalidatePath("/navyky");
}

/** Vráti archivovaný návyk späť medzi aktívne, so statusom podľa nazbieraných dní. */
export async function restoreHabit(habitId: number) {
  await requireUser();
  const [habit] = await db.select().from(habits).where(eq(habits.id, habitId));
  if (!habit) return;

  const [{ total }] = await db
    .select({ total: count() })
    .from(habitLogs)
    .where(eq(habitLogs.habitId, habitId));
  const status = Number(total) >= habit.targetDays ? "established" : "building";

  await db.update(habits).set({ status }).where(eq(habits.id, habitId));
  revalidatePath("/");
  revalidatePath("/navyky");
}

export async function deleteHabit(habitId: number) {
  await requireUser();
  await db.delete(habits).where(eq(habits.id, habitId));
  revalidatePath("/");
  revalidatePath("/navyky");
}
