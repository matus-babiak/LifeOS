"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createBelief } from "@/app/(app)/presvedcenia/actions";

export default function NewBeliefForm() {
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
        Nové presvedčenie
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-medium">Nové presvedčenie</h2>
      <form
        ref={formRef}
        action={async (formData) => {
          await createBelief(formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="text" className="mb-2 block text-sm text-muted">
            Aká limitujúca myšlienka ťa drží späť?
          </label>
          <textarea
            id="text"
            name="text"
            required
            rows={3}
            placeholder="Napr. Na toto nemám talent, iní na to majú lepšie predpoklady."
            className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
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
