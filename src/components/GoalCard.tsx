"use client";

import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import {
  deleteGoal,
  toggleGoalDone,
  updateGoal,
} from "@/app/(app)/vizia/actions";
import { formatHuman } from "@/lib/dates";

export type GoalCardData = {
  id: number;
  areaId: number;
  title: string;
  dueDate: string;
  doneAt: string | null;
  areaName: string;
  areaColor: string;
};

export default function GoalCard({
  goal,
  areas,
}: {
  goal: GoalCardData;
  areas: { id: number; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const done = !!goal.doneAt;

  if (editing) {
    return (
      <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <form
          action={async (formData) => {
            await updateGoal(goal.id, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor={`title-${goal.id}`} className="mb-2 block text-sm text-muted">
              Čo chcem zmeniť
            </label>
            <input
              id={`title-${goal.id}`}
              name="title"
              type="text"
              required
              defaultValue={goal.title}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor={`areaId-${goal.id}`} className="mb-2 block text-sm text-muted">
              Oblasť
            </label>
            <select
              id={`areaId-${goal.id}`}
              name="areaId"
              required
              defaultValue={goal.areaId}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`dueDate-${goal.id}`} className="mb-2 block text-sm text-muted">
              Dokedy
            </label>
            <input
              id={`dueDate-${goal.id}`}
              name="dueDate"
              type="date"
              required
              defaultValue={goal.dueDate}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
            >
              Uložiť
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-ink"
            >
              Zrušiť
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${
        done ? "opacity-70" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${done ? "line-through text-muted" : ""}`}>
            {goal.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: `${goal.areaColor}22`, color: goal.areaColor }}
            >
              {goal.areaName}
            </span>
            <span className="text-xs text-muted">do {formatHuman(goal.dueDate)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Upraviť"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <form action={deleteGoal.bind(null, goal.id)}>
            <button
              type="submit"
              aria-label="Zmazať"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-ink"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
      <form action={toggleGoalDone.bind(null, goal.id)}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <span
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors ${
              done
                ? "border-accent bg-accent text-white dark:text-[#10141a]"
                : "border-line"
            }`}
          >
            {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
          </span>
          {done ? "Dosiahnuté" : "Označiť ako dosiahnuté"}
        </button>
      </form>
    </article>
  );
}
