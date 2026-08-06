"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  createAttentionItem,
  type AttentionBucket,
} from "@/app/(app)/pozornost/actions";

type AreaOption = { id: number; name: string };

export default function NewAttentionForm({
  bucket,
  areas,
  label,
}: {
  bucket: AttentionBucket;
  areas: AreaOption[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <form
        ref={formRef}
        action={async (formData) => {
          await createAttentionItem(formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="bucket" value={bucket} />
        <div>
          <label htmlFor={`text-${bucket}`} className="mb-1.5 block text-sm text-muted">
            Čo je to?
          </label>
          <input
            id={`text-${bucket}`}
            name="text"
            type="text"
            required
            placeholder="Napr. budovanie produktu, rodina, zdravie…"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor={`note-${bucket}`} className="mb-1.5 block text-sm text-muted">
            Poznámka (voliteľné)
          </label>
          <textarea
            id={`note-${bucket}`}
            name="note"
            rows={2}
            placeholder="Prečo to teraz berie energiu, alebo čo to blokuje?"
            className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor={`area-${bucket}`} className="mb-1.5 block text-sm text-muted">
            Oblasť (voliteľné)
          </label>
          <select
            id={`area-${bucket}`}
            name="areaId"
            defaultValue=""
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Bez oblasti</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
          >
            Pridať
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 text-sm text-muted hover:text-ink"
          >
            Zrušiť
          </button>
        </div>
      </form>
    </section>
  );
}
