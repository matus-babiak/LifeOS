"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleHabit } from "@/app/(app)/actions";
import { frequencyLabel, weeklyTarget } from "@/lib/habits";
import type { habits } from "@/db/schema";

type Habit = typeof habits.$inferSelect;

export default function HabitCheckbox({
  habit,
  doneToday,
  missedYesterday,
  established,
  collected,
  weekCount,
}: {
  habit: Habit;
  doneToday: boolean;
  missedYesterday: boolean;
  established: boolean;
  collected: number;
  weekCount: number;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(doneToday);
  const [, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      setOptimisticDone(!optimisticDone);
      await toggleHabit(habit.id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-3 rounded-xl border border-line px-3 py-3 text-left transition-colors hover:border-accent/60"
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
          optimisticDone
            ? "border-accent bg-accent text-white dark:text-[#10141a]"
            : "border-line"
        }`}
      >
        {optimisticDone && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{habit.name}</span>
          <span className="text-xs text-muted">{frequencyLabel(habit)}</span>
          {established && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
              zabehnutý
            </span>
          )}
        </span>
        {optimisticDone && habit.identity && (
          <span className="mt-1 block text-xs text-accent-ink">
            +1 hlas: {habit.identity}
          </span>
        )}
        {missedYesterday && (
          <span className="mt-1 block text-xs text-danger">
            Včera vynechané - dnes nezmeškaj druhýkrát.
          </span>
        )}
        <span className="mt-2 block">
          <span className="flex items-center justify-between text-xs text-muted">
            <span>
              {established
                ? `${collected} dní spolu`
                : `budovanie ${Math.min(collected, habit.targetDays)}/${habit.targetDays} dní`}
            </span>
            <span>
              tento týždeň {weekCount}/{weeklyTarget(habit)}
            </span>
          </span>
          {!established && (
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-accent"
                style={{
                  width: `${Math.min(100, Math.round((collected / habit.targetDays) * 100))}%`,
                }}
              />
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
