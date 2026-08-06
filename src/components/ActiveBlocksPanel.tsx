"use client";

import { useRef, useState } from "react";
import { Check, OctagonAlert, Plus } from "lucide-react";
import {
  closeActiveBlock,
  createActiveBlock,
} from "@/app/(app)/bloky/actions";
import type { ActiveBlock } from "@/db/queries";

function severityLabel(severity: number | null): string | null {
  if (severity === 1) return "vysoká";
  if (severity === 2) return "stredná";
  if (severity === 3) return "nízka";
  return null;
}

function QuickAdd({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 text-sm transition-colors ${
          compact
            ? "rounded-xl border border-dashed border-line px-4 py-3 text-muted hover:border-accent hover:text-accent"
            : "w-full justify-center rounded-lg border border-dashed border-accent/40 px-3 py-2 text-accent-ink hover:bg-accent-soft/60"
        }`}
      >
        <Plus className="h-4 w-4" />
        Pridať aktívny blok
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createActiveBlock(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="flex flex-col gap-3 rounded-xl border border-line bg-bg p-3"
    >
      <input
        name="title"
        type="text"
        required
        placeholder="Čo ťa blokuje?"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <textarea
        name="body"
        rows={2}
        placeholder="Kontext (voliteľné)"
        className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted" htmlFor="severity">
          Priorita
        </label>
        <select
          id="severity"
          name="severity"
          defaultValue=""
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent"
        >
          <option value="">Bez priority</option>
          <option value="1">Vysoká</option>
          <option value="2">Stredná</option>
          <option value="3">Nízka</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white dark:text-[#10141a]"
          >
            Uložiť
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-ink"
          >
            Zrušiť
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ActiveBlocksPanel({
  blocks,
}: {
  blocks: ActiveBlock[];
}) {
  if (blocks.length === 0) {
    return (
      <section>
        <QuickAdd compact />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-accent/40 bg-accent-soft p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <OctagonAlert className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
        <h2 className="font-medium text-accent-ink">
          Aktívne bloky ({blocks.length})
        </h2>
      </div>
      <ul className="flex flex-col gap-3">
        {blocks.map((block) => {
          const sev = severityLabel(block.severity);
          return (
            <li
              key={block.id}
              className="rounded-xl border border-accent/25 bg-surface px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{block.title}</p>
                  {block.body && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted">
                      {block.body}
                    </p>
                  )}
                  {sev && (
                    <p className="mt-1.5 text-xs text-muted">Priorita: {sev}</p>
                  )}
                </div>
                <form action={closeActiveBlock.bind(null, block.id)}>
                  <button
                    type="submit"
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Vyriešené
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <QuickAdd />
      </div>
    </section>
  );
}
