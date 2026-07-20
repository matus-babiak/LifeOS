import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const habitFrequency = pgEnum("habit_frequency", [
  "daily",
  "weekdays",
  "per_week",
]);

export const habitStatus = pgEnum("habit_status", [
  "building",
  "established",
  "archived",
]);

export const trainingStatus = pgEnum("training_status", [
  "active",
  "paused",
  "completed",
]);

// 6 oblastí života - seedujú sa pri prvom spustení
export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  position: integer("position").notNull().default(0),
});

// Fáza života - 12-týždňová sezóna s retrospektívou na konci
export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  intention: text("intention"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  retrospective: text("retrospective"),
  active: boolean("active").notNull().default(true),
});

// Tréning - 1 až 3 aktívne naraz, úroveň 1-5 s míľnikmi
export const trainings = pgTable("trainings", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id")
    .notNull()
    .references(() => areas.id),
  name: text("name").notNull(),
  why: text("why"),
  goal: text("goal"),
  level: integer("level").notNull().default(1),
  dailyStep: text("daily_step"),
  status: trainingStatus("status").notNull().default("active"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id")
    .notNull()
    .references(() => trainings.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  position: integer("position").notNull().default(0),
});

// Návyk - fáza budovania (21/66/vlastné dni), vynechanie NEresetuje progres
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").references(() => trainings.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  identity: text("identity"),
  frequency: habitFrequency("frequency").notNull().default("daily"),
  perWeekTarget: integer("per_week_target"),
  targetDays: integer("target_days").notNull().default(21),
  status: habitStatus("status").notNull().default("building"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
  },
  (t) => [uniqueIndex("habit_logs_habit_date").on(t.habitId, t.date)],
);

// Denný check-in - ranné a večerné polia v jednom zázname na deň
export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  energy: integer("energy"),
  identityFocus: text("identity_focus"),
  morningDoneAt: timestamp("morning_done_at", { withTimezone: true }),
  wins: text("wins"),
  learned: text("learned"),
  improve: text("improve"),
  eveningDoneAt: timestamp("evening_done_at", { withTimezone: true }),
});

// Denný fokus - max 3 položky na deň (vynucuje server action)
export const focusItems = pgTable("focus_items", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  position: integer("position").notNull().default(0),
});

// Reflexný denník - Situácia → Reakcia → Pocit → Čo to ukazuje → Lekcia → Princíp
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").references(() => trainings.id, {
    onDelete: "set null",
  }),
  situation: text("situation").notNull(),
  reaction: text("reaction"),
  feeling: text("feeling"),
  meaning: text("meaning"),
  lesson: text("lesson"),
  principle: text("principle"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Týždenná reflexia - auto-súhrn + 3 odpovede (víťazstvo / vzorec / zmena)
export const weeklyReviews = pgTable("weekly_reviews", {
  id: serial("id").primaryKey(),
  weekStart: date("week_start").notNull().unique(),
  summary: text("summary"),
  win: text("win"),
  pattern: text("pattern"),
  change: text("change"),
  doneAt: timestamp("done_at", { withTimezone: true }),
});

// Vízia - "o 1 rok" / "o 5 rokov"
export const visions = pgTable("visions", {
  id: serial("id").primaryKey(),
  horizon: text("horizon").notNull().unique(), // "1y" | "5y"
  content: text("content"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const areasRelations = relations(areas, ({ many }) => ({
  trainings: many(trainings),
}));

export const trainingsRelations = relations(trainings, ({ one, many }) => ({
  area: one(areas, { fields: [trainings.areaId], references: [areas.id] }),
  milestones: many(milestones),
  habits: many(habits),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  training: one(trainings, {
    fields: [milestones.trainingId],
    references: [trainings.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  training: one(trainings, {
    fields: [habits.trainingId],
    references: [trainings.id],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
}));
