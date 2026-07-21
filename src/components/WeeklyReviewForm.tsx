"use client";

import { useState } from "react";
import { saveWeeklyReview } from "@/app/(app)/tyzden/actions";

const FIELDS = [
  { name: "win", label: "Najväčšie víťazstvo tohto týždňa" },
  { name: "pattern", label: "Čo sa opakovalo" },
  { name: "change", label: "Čo zmením budúci týždeň" },
] as const;

export default function WeeklyReviewForm({
  weekStart,
  win,
  pattern,
  change,
}: {
  weekStart: string;
  win: string | null;
  pattern: string | null;
  change: string | null;
}) {
  const [pending, setPending] = useState(false);
  const values: Record<string, string | null> = { win, pattern, change };

  return (
    <form
      action={async (formData) => {
        setPending(true);
        await saveWeeklyReview(weekStart, formData);
        setPending(false);
      }}
      className="flex flex-col gap-4"
    >
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="mb-2 block text-sm text-muted">
            {f.label}
          </label>
          <textarea
            id={f.name}
            name={f.name}
            rows={3}
            defaultValue={values[f.name] ?? ""}
            className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#10141a]"
      >
        Uložiť reflexiu
      </button>
    </form>
  );
}
