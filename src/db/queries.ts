import { and, asc, count, desc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "./index";
import {
  areas,
  dailyCheckins,
  focusItems,
  habitLogs,
  habits,
  journalEntries,
  milestones,
  notes,
  seasons,
  trainings,
  visions,
  weeklyReviews,
} from "./schema";
import { addDays, todayISO } from "@/lib/dates";
import { isDueOn, missedYesterday, weeklyTarget } from "@/lib/habits";
import { generateText } from "@/lib/gemini";
import {
  buildMentorPrompt,
  buildTrainingNotePrompt,
  buildWeekReflectionPrompt,
} from "@/lib/mentor";

export async function getAreas() {
  return db.select().from(areas).orderBy(asc(areas.position));
}

/** Oblasti s ich tréningami (aktívne a pozastavené), pre prehľad na stránke Oblasti. */
export async function getAreasOverview() {
  const [areaList, trainingList] = await Promise.all([
    db.select().from(areas).orderBy(asc(areas.position)),
    db
      .select({
        id: trainings.id,
        name: trainings.name,
        level: trainings.level,
        status: trainings.status,
        areaId: trainings.areaId,
      })
      .from(trainings)
      .where(inArray(trainings.status, ["active", "paused"]))
      .orderBy(asc(trainings.position)),
  ]);

  const byArea = new Map<number, typeof trainingList>();
  for (const t of trainingList) {
    const list = byArea.get(t.areaId) ?? [];
    list.push(t);
    byArea.set(t.areaId, list);
  }

  return areaList.map((area) => ({
    area,
    trainings: byArea.get(area.id) ?? [],
  }));
}

export async function getTodayView() {
  const today = todayISO();

  const [[checkin], focus, activeHabits] = await Promise.all([
    db.select().from(dailyCheckins).where(eq(dailyCheckins.date, today)),
    db
      .select()
      .from(focusItems)
      .where(eq(focusItems.date, today))
      .orderBy(asc(focusItems.position)),
    db
      .select()
      .from(habits)
      .where(inArray(habits.status, ["building", "established"]))
      .orderBy(asc(habits.createdAt)),
  ]);

  const ids = activeHabits.map((h) => h.id);

  // Posledných 8 dní pokrýva celý aktuálny týždeň aj včerajšok
  const [recentLogs, totals] = ids.length
    ? await Promise.all([
        db
          .select()
          .from(habitLogs)
          .where(
            and(
              inArray(habitLogs.habitId, ids),
              gte(habitLogs.date, addDays(today, -7)),
              lte(habitLogs.date, today),
            ),
          ),
        db
          .select({ habitId: habitLogs.habitId, total: count() })
          .from(habitLogs)
          .where(inArray(habitLogs.habitId, ids))
          .groupBy(habitLogs.habitId),
      ])
    : [[], []];

  return {
    today,
    checkin: checkin ?? null,
    focus,
    habits: activeHabits,
    recentLogs,
    totals: new Map(totals.map((t) => [t.habitId, Number(t.total)])),
  };
}

/**
 * Denná mentorská správa - vygeneruje sa raz denne cez Gemini a uloží sa do
 * denného check-inu, ďalšie zobrazenia už len čítajú z DB. Vráti null, ak
 * chýba API kľúč alebo volanie zlyhá (appka bez toho funguje ďalej).
 */
export async function getMentorMessage(
  view: Awaited<ReturnType<typeof getTodayView>>,
): Promise<string | null> {
  if (view.checkin?.mentorMessage) return view.checkin.mentorMessage;

  const yesterday = addDays(view.today, -1);
  const dueHabits = view.habits
    .filter((h) => isDueOn(h, view.today))
    .map((h) => {
      const doneToday = view.recentLogs.some(
        (l) => l.habitId === h.id && l.date === view.today,
      );
      return {
        habit: h,
        doneToday,
        missedYesterday: missedYesterday(h, doneToday, yesterday, view.recentLogs),
      };
    });

  const habitIds = view.habits.map((h) => h.id);
  const twoWeeksAgo = addDays(view.today, -13);

  const [trainingSteps, [activeSeason], [lastWeekReview], twoWeekLogs, journalRows] =
    await Promise.all([
      getActiveTrainingSteps().then((rows) => rows.map((s) => s.dailyStep as string)),
      db.select().from(seasons).where(eq(seasons.active, true)),
      db
        .select()
        .from(weeklyReviews)
        .where(isNotNull(weeklyReviews.doneAt))
        .orderBy(desc(weeklyReviews.weekStart))
        .limit(1),
      habitIds.length
        ? db
            .select()
            .from(habitLogs)
            .where(
              and(
                inArray(habitLogs.habitId, habitIds),
                gte(habitLogs.date, twoWeeksAgo),
                lte(habitLogs.date, view.today),
              ),
            )
        : Promise.resolve([]),
      db.select().from(journalEntries).orderBy(desc(journalEntries.createdAt)).limit(2),
    ]);

  const habitConsistency = view.habits.map((h) => ({
    name: h.name,
    done: twoWeekLogs.filter((l) => l.habitId === h.id).length,
    days: 14,
  }));

  const prompt = buildMentorPrompt({
    energy: view.checkin?.energy ?? null,
    identityFocus: view.checkin?.identityFocus ?? null,
    dueHabits,
    trainingSteps,
    season: activeSeason ? { title: activeSeason.title, intention: activeSeason.intention } : null,
    lastWeekReview: lastWeekReview
      ? { win: lastWeekReview.win, pattern: lastWeekReview.pattern, change: lastWeekReview.change }
      : null,
    habitConsistency,
    recentJournal: journalRows.map((j) => ({ situation: j.situation, principle: j.principle })),
  });

  const message = await generateText(prompt);
  if (!message) return null;

  await db
    .insert(dailyCheckins)
    .values({ date: view.today, mentorMessage: message })
    .onConflictDoUpdate({
      target: dailyCheckins.date,
      set: { mentorMessage: message },
    });

  return message;
}

/** AI reflexia týždňa - kratší interpretačný komentár popri pravidlovom auto-súhrne. Cache na deň. */
export async function getWeekAiReflection(
  view: Awaited<ReturnType<typeof getWeekView>>,
): Promise<string | null> {
  const today = todayISO();
  if (view.review?.aiReflection && view.review.aiReflectionDate === today) {
    return view.review.aiReflection;
  }

  const [previous] = await db
    .select()
    .from(weeklyReviews)
    .where(isNotNull(weeklyReviews.doneAt))
    .orderBy(desc(weeklyReviews.weekStart))
    .limit(1);

  const prompt = buildWeekReflectionPrompt({
    start: view.start,
    end: view.end,
    avgEnergy: view.avgEnergy,
    habitStats: view.habitStats.map((s) => ({
      name: s.habit.name,
      done: s.done,
      target: s.target,
    })),
    journalCount: view.weekEntries.length,
    previousWin: previous?.win ?? null,
    previousPattern: previous?.pattern ?? null,
    previousChange: previous?.change ?? null,
  });

  const reflection = await generateText(prompt);
  if (!reflection) return null;

  await db
    .insert(weeklyReviews)
    .values({ weekStart: view.start, aiReflection: reflection, aiReflectionDate: today })
    .onConflictDoUpdate({
      target: weeklyReviews.weekStart,
      set: { aiReflection: reflection, aiReflectionDate: today },
    });

  return reflection;
}

/** Krátky mentorský komentár k tréningu na jeho detaile. Cache na deň. */
export async function getTrainingMentorNote(
  detail: NonNullable<Awaited<ReturnType<typeof getTrainingDetail>>>,
): Promise<string | null> {
  const today = todayISO();
  if (detail.training.mentorNote && detail.training.mentorNoteDate === today) {
    return detail.training.mentorNote;
  }

  const currentMs = detail.milestones.filter((m) => m.level === detail.training.level);
  const relatedJournal = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.trainingId, detail.training.id))
    .orderBy(desc(journalEntries.createdAt))
    .limit(2);

  const prompt = buildTrainingNotePrompt({
    name: detail.training.name,
    level: detail.training.level,
    currentState: detail.training.currentState,
    why: detail.training.why,
    goal: detail.training.goal,
    milestonesDone: currentMs.filter((m) => m.done).length,
    milestonesTotal: currentMs.length,
    recentJournal: relatedJournal.map((j) => ({ situation: j.situation, principle: j.principle })),
  });

  const note = await generateText(prompt);
  if (!note) return null;

  await db
    .update(trainings)
    .set({ mentorNote: note, mentorNoteDate: today })
    .where(eq(trainings.id, detail.training.id));

  return note;
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
  const [allTrainings, areaList] = await Promise.all([
    db
      .select()
      .from(trainings)
      .orderBy(asc(trainings.status), asc(trainings.position), asc(trainings.createdAt)),
    db.select().from(areas).orderBy(asc(areas.position)),
  ]);

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

  const [[area], ms] = await Promise.all([
    db.select().from(areas).where(eq(areas.id, training.areaId)),
    db
      .select()
      .from(milestones)
      .where(eq(milestones.trainingId, id))
      .orderBy(asc(milestones.level), asc(milestones.position), asc(milestones.id)),
  ]);

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
  const [entries, activeTrainings] = await Promise.all([
    db.select().from(journalEntries).orderBy(desc(journalEntries.createdAt)),
    db
      .select({ id: trainings.id, name: trainings.name })
      .from(trainings)
      .where(inArray(trainings.status, ["active", "paused"]))
      .orderBy(asc(trainings.createdAt)),
  ]);

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

  return { entries, trainingName, trainings: activeTrainings };
}

export type Season = typeof seasons.$inferSelect;

/** Vízia (o 1 rok / o 5 rokov) a aktuálna sezóna + história pre stránku Vízia. */
export async function getVisionView() {
  const [rows, [activeSeason], pastSeasons] = await Promise.all([
    db.select().from(visions),
    db.select().from(seasons).where(eq(seasons.active, true)),
    db.select().from(seasons).where(eq(seasons.active, false)).orderBy(desc(seasons.endDate)),
  ]);
  const contentByHorizon = new Map(rows.map((v) => [v.horizon, v.content]));

  return { contentByHorizon, activeSeason: activeSeason ?? null, pastSeasons };
}

/** Dáta pre jeden týždeň (pondelok-nedeľa): auto-súhrn z denných dát + prípadná uložená reflexia. */
export async function getWeekView(startISO: string) {
  const endISO = addDays(startISO, 6);

  const [[review], checkins, activeHabits, allEntries, steps, history] = await Promise.all([
    db.select().from(weeklyReviews).where(eq(weeklyReviews.weekStart, startISO)),
    db
      .select()
      .from(dailyCheckins)
      .where(and(gte(dailyCheckins.date, startISO), lte(dailyCheckins.date, endISO))),
    db
      .select()
      .from(habits)
      .where(inArray(habits.status, ["building", "established"]))
      .orderBy(asc(habits.createdAt)),
    db.select().from(journalEntries).orderBy(desc(journalEntries.createdAt)),
    getActiveTrainingSteps(),
    db
      .select()
      .from(weeklyReviews)
      .where(isNotNull(weeklyReviews.doneAt))
      .orderBy(desc(weeklyReviews.weekStart))
      .limit(8),
  ]);

  const energies = checkins
    .map((c) => c.energy)
    .filter((e): e is number => e != null);
  const avgEnergy =
    energies.length > 0
      ? Math.round((energies.reduce((a, b) => a + b, 0) / energies.length) * 10) / 10
      : null;

  const habitIds = activeHabits.map((h) => h.id);
  const logs = habitIds.length
    ? await db
        .select()
        .from(habitLogs)
        .where(
          and(
            inArray(habitLogs.habitId, habitIds),
            gte(habitLogs.date, startISO),
            lte(habitLogs.date, endISO),
          ),
        )
    : [];
  const habitStats = activeHabits.map((h) => ({
    habit: h,
    done: logs.filter((l) => l.habitId === h.id).length,
    target: weeklyTarget(h),
  }));

  const weekEntries = allEntries.filter((e) => {
    const d = e.createdAt.toISOString().slice(0, 10);
    return d >= startISO && d <= endISO;
  });

  return {
    start: startISO,
    end: endISO,
    review: review ?? null,
    avgEnergy,
    habitStats,
    weekEntries,
    steps,
    history,
  };
}

export type ExportDay = {
  date: string;
  checkin: typeof dailyCheckins.$inferSelect | null;
  focus: { text: string; done: boolean }[];
  journalEntries: (typeof journalEntries.$inferSelect & {
    trainingName: string | null;
  })[];
  habitNames: string[];
};

export type ExportWeek = typeof weeklyReviews.$inferSelect;

/** Všetky dáta pre markdown export (ZIP) vo formáte vaultu. Slúži aj ako záloha. */
export async function getExportData(): Promise<{
  days: ExportDay[];
  weeks: ExportWeek[];
}> {
  const [checkins, focus, entries, logs, allHabits, trainingRows] = await Promise.all([
    db.select().from(dailyCheckins),
    db.select().from(focusItems).orderBy(asc(focusItems.position)),
    db.select().from(journalEntries).orderBy(asc(journalEntries.createdAt)),
    db.select().from(habitLogs),
    db.select().from(habits),
    db.select({ id: trainings.id, name: trainings.name }).from(trainings),
  ]);
  const habitNameById = new Map(allHabits.map((h) => [h.id, h.name]));
  const trainingNameById = new Map(trainingRows.map((t) => [t.id, t.name]));

  const dates = new Set<string>();
  checkins.forEach((c) => dates.add(c.date));
  focus.forEach((f) => dates.add(f.date));
  logs.forEach((l) => dates.add(l.date));
  entries.forEach((e) => dates.add(e.createdAt.toISOString().slice(0, 10)));

  const days: ExportDay[] = [...dates].sort().map((date) => ({
    date,
    checkin: checkins.find((c) => c.date === date) ?? null,
    focus: focus
      .filter((f) => f.date === date)
      .map((f) => ({ text: f.text, done: f.done })),
    journalEntries: entries
      .filter((e) => e.createdAt.toISOString().slice(0, 10) === date)
      .map((e) => ({
        ...e,
        trainingName: e.trainingId ? trainingNameById.get(e.trainingId) ?? null : null,
      })),
    habitNames: logs
      .filter((l) => l.date === date)
      .map((l) => habitNameById.get(l.habitId))
      .filter((n): n is string => !!n),
  }));

  const weeks = await db
    .select()
    .from(weeklyReviews)
    .orderBy(asc(weeklyReviews.weekStart));

  return { days, weeks };
}

export type Note = typeof notes.$inferSelect;

/** Poznámky od najnovšej + oblasti pre kategórie na stránke Poznámky. */
export async function getNotesView() {
  const [areaList, noteList] = await Promise.all([
    db.select().from(areas).orderBy(asc(areas.position)),
    db.select().from(notes).orderBy(desc(notes.createdAt)),
  ]);
  return { areas: areaList, notes: noteList };
}
