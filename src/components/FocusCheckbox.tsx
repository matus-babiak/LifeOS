"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleFocus } from "@/app/(app)/actions";

export default function FocusCheckbox({
  id,
  text,
  done,
}: {
  id: number;
  text: string;
  done: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      setOptimisticDone(!optimisticDone);
      await toggleFocus(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-bg"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          optimisticDone
            ? "border-accent bg-accent text-white dark:text-[#10141a]"
            : "border-line"
        }`}
      >
        {optimisticDone && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span
        className={`text-sm ${optimisticDone ? "text-muted line-through" : ""}`}
      >
        {text}
      </span>
    </button>
  );
}
