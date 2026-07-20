import { and, asc, count, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "./index";
import {
  areas,
  dailyCheckins,
  focusItems,
  habitLogs,
  habits,
} from "./schema";
import { addDays, todayISO } from "@/lib/dates";

export async function getAreas() {
  return db.select().from(areas).orderBy(asc(areas.position));
}

export async function getTodayView() {
  const today = todayISO();

  const [checkin] = await db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.date, today));

  const focus = await db
    .select()
    .from(focusItems)
    .where(eq(focusItems.date, today))
    .orderBy(asc(focusItems.position));

  const activeHabits = await db
    .select()
    .from(habits)
    .where(inArray(habits.status, ["building", "established"]))
    .orderBy(asc(habits.createdAt));

  const ids = activeHabits.map((h) => h.id);

  // Posledných 8 dní pokrýva celý aktuálny týždeň aj včerajšok
  const recentLogs = ids.length
    ? await db
        .select()
        .from(habitLogs)
        .where(
          and(
            inArray(habitLogs.habitId, ids),
            gte(habitLogs.date, addDays(today, -7)),
            lte(habitLogs.date, today),
          ),
        )
    : [];

  const totals = ids.length
    ? await db
        .select({ habitId: habitLogs.habitId, total: count() })
        .from(habitLogs)
        .where(inArray(habitLogs.habitId, ids))
        .groupBy(habitLogs.habitId)
    : [];

  return {
    today,
    checkin: checkin ?? null,
    focus,
    habits: activeHabits,
    recentLogs,
    totals: new Map(totals.map((t) => [t.habitId, Number(t.total)])),
  };
}

export async function getHabitsView() {
  const allHabits = await db
    .select()
    .from(habits)
    .orderBy(asc(habits.status), asc(habits.createdAt));

  const ids = allHabits.map((h) => h.id);
  const totals = ids.length
    ? await db
        .select({ habitId: habitLogs.habitId, total: count() })
        .from(habitLogs)
        .where(inArray(habitLogs.habitId, ids))
        .groupBy(habitLogs.habitId)
    : [];

  return {
    habits: allHabits,
    totals: new Map(totals.map((t) => [t.habitId, Number(t.total)])),
  };
}
