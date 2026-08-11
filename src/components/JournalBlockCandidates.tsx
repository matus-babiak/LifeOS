"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { acceptJournalBlockCandidate } from "@/app/(app)/bloky/actions";
import type { BlockCandidate } from "@/lib/mentor";

function severityLabel(severity: 1 | 2 | 3 | null): string | null {
  if (severity === 1) return "vysoká";
  if (severity === 2) return "stredná";
  if (severity === 3) return "nízka";
  return null;
}

export default function JournalBlockCandidates({
  entryId,
  candidates: initial,
}: {
  entryId: number;
  candidates: BlockCandidate[];
}) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  function dismiss(candidate: BlockCandidate) {
    setItems((prev) => prev.filter((c) => c !== candidate));
  }

  function accept(candidate: BlockCandidate) {
    startTransition(async () => {
      await acceptJournalBlockCandidate({
        entryId,
        title: candidate.title,
        why: candidate.why,
        severity: candidate.severity,
      });
      dismiss(candidate);
    });
  }

  return (
    <section className="rounded-2xl border border-accent/40 bg-accent-soft p-5 shadow-sm">
      <h2 className="font-medium text-accent-ink">
        AI navrhuje mentálne vzorce
      </h2>
      <p className="mt-1 text-xs text-muted">
        Z tvojho zápisu. Potvrď, čo má ostať ako aktívny blok na spevnenie, alebo
        odmietni.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((candidate, index) => {
          const sev = severityLabel(candidate.severity);
          return (
            <li
              key={`${candidate.title}-${index}`}
              className="rounded-xl border border-accent/25 bg-surface px-4 py-3"
            >
              <p className="text-sm font-medium">{candidate.title}</p>
              {candidate.why && (
                <p className="mt-1 text-xs text-muted">{candidate.why}</p>
              )}
              {sev && (
                <p className="mt-1.5 text-xs text-muted">Priorita: {sev}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => accept(candidate)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#10141a]"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Pridať ako aktívny blok
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => dismiss(candidate)}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                  Odmietnuť
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
