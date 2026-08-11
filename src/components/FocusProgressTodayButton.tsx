"use client";

import { useState, useTransition } from "react";
import { focusProgressItemToday } from "@/app/(app)/progress-focus/actions";

export default function FocusProgressTodayButton({
  itemId,
}: {
  itemId: number;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await focusProgressItemToday(itemId);
            if (!result.ok) {
              setMessage(
                result.reason === "full"
                  ? "Dnešný fokus už má 3 položky."
                  : "Položka sa nenašla.",
              );
              return;
            }
            setMessage("Pridané do dnešného fokusu.");
          });
        }}
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#10141a]"
      >
        {pending ? "Pridávam…" : "Sústrediť sa dnes"}
      </button>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
