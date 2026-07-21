"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTraining } from "@/app/(app)/treningy/actions";

export default function NewTrainingForm({
  areas,
}: {
  areas: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        Nový tréning
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-medium">Nový tréning</h2>
      <form action={createTraining} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-muted">
              Čo trénujem?
            </label>
            <input
              id="name"
              name="name"
              required
              type="text"
              placeholder="Napr. Predaj"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="areaId" className="mb-2 block text-sm text-muted">
              Oblasť života
            </label>
            <select
              id="areaId"
              name="areaId"
              required
              defaultValue=""
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="" disabled>
                Vyber oblasť
              </option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="why" className="mb-2 block text-sm text-muted">
            Prečo? (kým sa tým stávam)
          </label>
          <textarea
            id="why"
            name="why"
            rows={2}
            placeholder="Napr. Chcem byť človek, ktorý vie počúvať a prináša hodnotu."
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
            type="text"
            placeholder="Napr. Stať sa sebavedomým predajcom"
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
            type="text"
            placeholder="Napr. 15 min učenia + reflexia po rozhovore"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
          >
            Vytvoriť tréning
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
  );
}
