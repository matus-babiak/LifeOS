"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createGoal } from "@/app/(app)/vizia/actions";

export default function NewGoalForm({
  areas,
  defaultAreaId,
}: {
  areas: { id: number; name: string }[];
  defaultAreaId?: number;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (areas.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        Nový cieľ
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-medium">Nový cieľ</h2>
      <form
        ref={formRef}
        action={async (formData) => {
          await createGoal(formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="title" className="mb-2 block text-sm text-muted">
            Čo chcem zmeniť
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Napr. pravidelne volať rodičom"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="areaId" className="mb-2 block text-sm text-muted">
            Oblasť
          </label>
          <select
            id="areaId"
            name="areaId"
            required
            defaultValue={defaultAreaId ?? areas[0]?.id}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dueDate" className="mb-2 block text-sm text-muted">
            Dokedy
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
          >
            Uložiť cieľ
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
