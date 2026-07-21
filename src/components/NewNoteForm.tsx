"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createNote } from "@/app/(app)/poznamky/actions";

export default function NewNoteForm({
  categories,
  defaultCategory,
}: {
  categories: { slug: string; name: string }[];
  defaultCategory?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        Nová poznámka
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-medium">Nová poznámka</h2>
      <form
        ref={formRef}
        action={async (formData) => {
          await createNote(formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="content" className="mb-2 block text-sm text-muted">
            Poznámka
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={3}
            placeholder="Čo si chceš zapamätať alebo zlepšiť?"
            className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-2 block text-sm text-muted">
            Kategória
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultCategory ?? categories[0]?.slug}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
          >
            Uložiť poznámku
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
