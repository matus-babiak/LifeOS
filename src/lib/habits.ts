import type { habits } from "@/db/schema";
import { isWeekday } from "@/lib/dates";

export type Habit = typeof habits.$inferSelect;

/** Má sa návyk plniť v daný deň? (per_week návyky sa počítajú na týždennú kvótu) */
export function isDueOn(habit: Habit, iso: string): boolean {
  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return isWeekday(iso);
    case "per_week":
      return true;
  }
}

/** Koľko splnení sa v danom týždni očakáva. */
export function weeklyTarget(habit: Habit): number {
  switch (habit.frequency) {
    case "daily":
      return 7;
    case "weekdays":
      return 5;
    case "per_week":
      return habit.perWeekTarget ?? 3;
  }
}

export function frequencyLabel(habit: Habit): string {
  switch (habit.frequency) {
    case "daily":
      return "denne";
    case "weekdays":
      return "pracovné dni";
    case "per_week":
      return `${habit.perWeekTarget ?? 3}× týždenne`;
  }
}
