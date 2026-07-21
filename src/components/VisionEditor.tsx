"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { saveVision } from "@/app/(app)/vizia/actions";

export default function VisionEditor({
  horizon,
  title,
  content,
}: {
  horizon: "1y" | "5y";
  title: string;
  content: string | null;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">{title}</h2>
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
        {content ? (
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        ) : (
          <p className="text-sm text-muted">Zatiaľ nenapísané. Kým sa chceš stať?</p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-medium">{title}</h2>
      <form
        action={async (formData) => {
          await saveVision(horizon, formData);
          setEditing(false);
        }}
        className="flex flex-col gap-4"
      >
        <textarea
          name="content"
          rows={6}
          defaultValue={content ?? ""}
          placeholder="Kým sa chceš stať? Ako vyzerá tvoj deň, práca, vzťahy?"
          className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
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
