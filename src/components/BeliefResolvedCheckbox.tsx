"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleBeliefResolved } from "@/app/(app)/presvedcenia/actions";

export default function BeliefResolvedCheckbox({
  id,
  resolved,
}: {
  id: number;
  resolved: boolean;
}) {
  const [optimisticResolved, setOptimisticResolved] = useOptimistic(resolved);
  const [, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      setOptimisticResolved(!optimisticResolved);
      await toggleBeliefResolved(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors ${
          optimisticResolved
            ? "border-accent bg-accent text-white dark:text-[#10141a]"
            : "border-line"
        }`}
      >
        {optimisticResolved && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      prekonané
    </button>
  );
}
