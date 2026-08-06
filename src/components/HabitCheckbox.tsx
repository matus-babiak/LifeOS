"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleHabit } from "@/app/(app)/actions";
import { frequencyLabel, weeklyTarget } from "@/lib/habits";
import type { habits } from "@/db/schema";

type Habit = typeof habits.$inferSelect;

type LocalState = {
  doneToday: boolean;
  collected: number;
  weekCount: number;
  established: boolean;
  missedYesterday: boolean;
};

function fromProps(
  doneToday: boolean,
  collected: number,
  weekCount: number,
  established: boolean,
  missedYesterday: boolean,
): LocalState {
  return { doneToday, collected, weekCount, established, missedYesterday };
}

export default function HabitCheckbox({
  habit,
  doneToday: doneTodayProp,
  missedYesterday: missedYesterdayProp,
  established: establishedProp,
  collected: collectedProp,
  weekCount: weekCountProp,
}: {
  habit: Habit;
  doneToday: boolean;
  missedYesterday: boolean;
  established: boolean;
  collected: number;
  weekCount: number;
}) {
  const propsState = fromProps(
    doneTodayProp,
    collectedProp,
    weekCountProp,
    establishedProp,
    missedYesterdayProp,
  );
  const [state, setState] = useState(propsState);
  const [prevProps, setPrevProps] = useState(propsState);
  if (
    propsState.doneToday !== prevProps.doneToday ||
    propsState.collected !== prevProps.collected ||
    propsState.weekCount !== prevProps.weekCount ||
    propsState.established !== prevProps.established ||
    propsState.missedYesterday !== prevProps.missedYesterday
  ) {
    setPrevProps(propsState);
    setState(propsState);
  }

  const [optimistic, setOptimistic] = useOptimistic(state);
  const [, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const nextDone = !state.doneToday;
      const nextCollected = state.collected + (nextDone ? 1 : -1);
      setOptimistic({
        doneToday: nextDone,
        collected: Math.max(0, nextCollected),
        weekCount: Math.max(0, state.weekCount + (nextDone ? 1 : -1)),
        established: nextCollected >= habit.targetDays,
        missedYesterday: nextDone ? false : missedYesterdayProp,
      });

      const result = await toggleHabit(habit.id);
      if (!result) return;

      setState({
        doneToday: result.doneToday,
        collected: result.collected,
        weekCount: Math.max(
          0,
          weekCountProp + (result.doneToday ? 1 : 0) - (doneTodayProp ? 1 : 0),
        ),
        established: result.status === "established",
        missedYesterday: result.doneToday ? false : missedYesterdayProp,
      });
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
          optimistic.doneToday
            ? "border-accent bg-accent text-white dark:text-[#10141a]"
            : "border-line"
        }`}
      >
        {optimistic.doneToday && (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{habit.name}</span>
          <span className="text-xs text-muted">{frequencyLabel(habit)}</span>
          {optimistic.established && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
              zabehnutý
            </span>
          )}
        </span>
        {optimistic.doneToday && habit.identity && (
          <span className="mt-1 block text-xs text-accent-ink">
            +1 hlas: {habit.identity}
          </span>
        )}
        {optimistic.missedYesterday && (
          <span className="mt-1 block text-xs text-danger">
            Včera vynechané - dnes nezmeškaj druhýkrát.
          </span>
        )}
        <span className="mt-2 block">
          <span className="flex items-center justify-between text-xs text-muted">
            <span>
              {optimistic.established
                ? `${optimistic.collected} dní spolu`
                : `budovanie ${Math.min(optimistic.collected, habit.targetDays)}/${habit.targetDays} dní`}
            </span>
            <span>
              tento týždeň {optimistic.weekCount}/{weeklyTarget(habit)}
            </span>
          </span>
          {!optimistic.established && (
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-accent"
                style={{
                  width: `${Math.min(100, Math.round((optimistic.collected / habit.targetDays) * 100))}%`,
                }}
              />
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
