"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateTraining } from "@/app/(app)/treningy/actions";

type Training = {
  id: number;
  name: string;
  why: string | null;
  goal: string | null;
  dailyStep: string | null;
};

export default function TrainingEditor({ training }: { training: Training }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Zámer</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Upraviť"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-bg hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
            Upraviť
          </button>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-muted">Prečo</dt>
            <dd className="mt-0.5">{training.why || "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">Cieľ</dt>
            <dd className="mt-0.5">{training.goal || "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">Denný krok</dt>
            <dd className="mt-0.5">{training.dailyStep || "-"}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-medium">Upraviť tréning</h2>
      <form
        action={async (formData) => {
          await updateTraining(training.id, formData);
          setEditing(false);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-muted">
            Názov
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={training.name}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="why" className="mb-2 block text-sm text-muted">
            Prečo
          </label>
          <textarea
            id="why"
            name="why"
            rows={2}
            defaultValue={training.why ?? ""}
            className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="goal" className="mb-2 block text-sm text-muted">
            Cieľ
          </label>
          <input
            id="goal"
            name="goal"
            defaultValue={training.goal ?? ""}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="dailyStep" className="mb-2 block text-sm text-muted">
            Denný krok
          </label>
          <input
            id="dailyStep"
            name="dailyStep"
            defaultValue={training.dailyStep ?? ""}
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
    </section>
  );
}
