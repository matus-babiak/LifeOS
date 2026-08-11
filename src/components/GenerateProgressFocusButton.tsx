"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateProgressFocusAction } from "@/app/(app)/progress-focus/actions";

export default function GenerateProgressFocusButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await generateProgressFocusAction();
            if (result.reason === "no_ai") {
              setMessage(
                "AI momentálne nie je dostupná. Skús to o chvíľu znova.",
              );
              return;
            }
            if (result.added === 0) {
              setMessage("Žiadne ďalšie.");
              return;
            }
            setMessage(
              result.added === 1
                ? "Pridaná 1 nová položka."
                : `Pridaných ${result.added} nových položiek.`,
            );
          });
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#10141a]"
      >
        <Sparkles className="h-4 w-4" />
        {pending ? "Generujem…" : "Navrhnúť z AI"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
