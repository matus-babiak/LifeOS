"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createJournalEntry } from "@/app/(app)/dennik/actions";
import JournalBlockCandidates from "@/components/JournalBlockCandidates";
import type { BlockCandidate } from "@/lib/mentor";

const FIELDS = [
  {
    name: "situation",
    label: "Situácia",
    placeholder: "Čo sa stalo?",
    required: true,
  },
  { name: "reaction", label: "Moja reakcia", placeholder: "Ako som zareagoval?" },
  { name: "feeling", label: "Čo som cítil", placeholder: "Aké emócie prišli?" },
  {
    name: "meaning",
    label: "Čo to ukazuje",
    placeholder: "Čo mi to hovorí o mne?",
  },
  { name: "lesson", label: "Čo sa naučím", placeholder: "Aké je poučenie?" },
  {
    name: "principle",
    label: "Nový princíp",
    placeholder: "Pravidlo, podľa ktorého odteraz idem",
  },
];

export default function NewJournalForm({
  trainings,
}: {
  trainings: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [proposal, setProposal] = useState<{
    entryId: number;
    candidates: BlockCandidate[];
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <div className="flex flex-col gap-4">
        {proposal && proposal.candidates.length > 0 && (
          <JournalBlockCandidates
            entryId={proposal.entryId}
            candidates={proposal.candidates}
          />
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="h-4 w-4" />
          Nový zápis
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {proposal && proposal.candidates.length > 0 && (
        <JournalBlockCandidates
          entryId={proposal.entryId}
          candidates={proposal.candidates}
        />
      )}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-medium">Nový zápis</h2>
        <p className="mb-4 text-sm text-muted">
          Nie denník o dni, ale učenie sa zo situácie. Vyplň, čo ti dáva zmysel.
        </p>
        <form
          ref={formRef}
          action={(formData) => {
            startTransition(async () => {
              const result = await createJournalEntry(formData);
              formRef.current?.reset();
              setOpen(false);
              if (result && result.candidates.length > 0) {
                setProposal(result);
              } else {
                setProposal(null);
              }
            });
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
                required={f.required}
                rows={2}
                placeholder={f.placeholder}
                className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          ))}

          {trainings.length > 0 && (
            <div>
              <label
                htmlFor="trainingId"
                className="mb-2 block text-sm text-muted"
              >
                Súvisí s tréningom? (voliteľné)
              </label>
              <select
                id="trainingId"
                name="trainingId"
                defaultValue=""
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="">Bez tréningu</option>
                {trainings.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#10141a]"
            >
              {pending ? "Ukladám a analyzujem…" : "Uložiť zápis"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-ink"
            >
              Zrušiť
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
