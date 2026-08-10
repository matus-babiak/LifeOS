"use client";

import { useState } from "react";
import { scheduleTolerance } from "@/app/(app)/tolerancie/actions";

export default function ScheduleToleranceForm({ id }: { id: number }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
      >
        Naplánovať
      </button>
    );
  }

  return (
    <form
      action={scheduleTolerance.bind(null, id)}
      className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input
        name="dueDate"
        type="date"
        required
        className="min-w-0 w-full max-w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-accent sm:w-auto"
      />
      <input
        name="firstStep"
        type="text"
        placeholder="Prvý krok (voliteľné)"
        className="w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-accent sm:w-auto sm:flex-1"
      />
      <button
        type="submit"
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
      >
        Uložiť
      </button>
    </form>
  );
}
