import { and, asc, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "./index";
import {
  areas,
  dailyCheckins,
  focusItems,
  habitLogs,
  habits,
  journalEntries,
  milestones,
  trainings,
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

export type Area = typeof areas.$inferSelect;
export type Training = typeof trainings.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;

/** Zoznam tréningov s oblasťou a počtom míľnikov aktuálnej úrovne. */
export async function getTrainingsView() {
  const allTrainings = await db
    .select()
    .from(trainings)
    .orderBy(asc(trainings.status), asc(trainings.position), asc(trainings.createdAt));

  const areaList = await db.select().from(areas).orderBy(asc(areas.position));
  const areaById = new Map(areaList.map((a) => [a.id, a]));

  const ids = allTrainings.map((t) => t.id);
  const ms = ids.length
    ? await db.select().from(milestones).where(inArray(milestones.trainingId, ids))
    : [];

  // počet míľnikov aktuálnej úrovne (done / total) na tréning
  const levelStats = new Map<number, { done: number; total: number }>();
  for (const t of allTrainings) {
    const own = ms.filter((m) => m.trainingId === t.id && m.level === t.level);
    levelStats.set(t.id, {
      done: own.filter((m) => m.done).length,
      total: own.length,
    });
  }

  return { trainings: allTrainings, areaById, levelStats };
}

/** Jeden tréning s oblasťou a všetkými míľnikmi. */
export async function getTrainingDetail(id: number) {
  const [training] = await db
    .select()
    .from(trainings)
    .where(eq(trainings.id, id));
  if (!training) return null;

  const [area] = await db.select().from(areas).where(eq(areas.id, training.areaId));
  const ms = await db
    .select()
    .from(milestones)
    .where(eq(milestones.trainingId, id))
    .orderBy(asc(milestones.level), asc(milestones.position), asc(milestones.id));

  return { training, area: area ?? null, milestones: ms };
}

/** Denné kroky aktívnych tréningov, na predvyplnenie fokusu a pripomenutie na Dnes. */
export async function getActiveTrainingSteps() {
  const rows = await db
    .select({
      id: trainings.id,
      name: trainings.name,
      dailyStep: trainings.dailyStep,
    })
    .from(trainings)
    .where(eq(trainings.status, "active"))
    .orderBy(asc(trainings.position), asc(trainings.createdAt));
  return rows.filter((r) => r.dailyStep && r.dailyStep.trim().length > 0);
}

export async function getAreasForSelect() {
  return db
    .select({ id: areas.id, name: areas.name })
    .from(areas)
    .orderBy(asc(areas.position));
}

/** Reflexný denník: zápisy od najnovšieho, s názvom prepojeného tréningu. */
export async function getJournalView() {
  const entries = await db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.createdAt));

  const trainingIds = [
    ...new Set(entries.map((e) => e.trainingId).filter((x): x is number => x != null)),
  ];
  const linked = trainingIds.length
    ? await db
        .select({ id: trainings.id, name: trainings.name })
        .from(trainings)
        .where(inArray(trainings.id, trainingIds))
    : [];
  const trainingName = new Map(linked.map((t) => [t.id, t.name]));

  const activeTrainings = await db
    .select({ id: trainings.id, name: trainings.name })
    .from(trainings)
    .where(inArray(trainings.status, ["active", "paused"]))
    .orderBy(asc(trainings.createdAt));

  return { entries, trainingName, trainings: activeTrainings };
}
