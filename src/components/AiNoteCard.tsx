"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteAiNote,
  updateAiNoteCategory,
} from "@/app/(app)/ai-poznamky/actions";
import type { aiNotes } from "@/db/schema";
import { formatHuman } from "@/lib/dates";

type Note = typeof aiNotes.$inferSelect;

export default function AiNoteCard({
  note,
  categories,
}: {
  note: Note;
  categories: string[];
}) {
  const [editing, setEditing] = useState(false);
  const listId = `ai-note-cats-${note.id}`;

  if (editing) {
    return (
      <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <form
          action={async (formData) => {
            await updateAiNoteCategory(note.id, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label
              htmlFor={`edit-category-${note.id}`}
              className="mb-1.5 block text-sm text-muted"
            >
              Kategória
            </label>
            <input
              id={`edit-category-${note.id}`}
              name="category"
              type="text"
              required
              list={listId}
              defaultValue={note.category}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <datalist id={listId}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted">{note.content}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
            >
              Uložiť
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-3 py-2 text-sm text-muted hover:text-ink"
            >
              Zrušiť
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
          {note.category}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted">
            {formatHuman(note.createdAt.toISOString().slice(0, 10))}
          </span>
          <button
            type="button"
            aria-label="Zmeniť kategóriu"
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-ink"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <form action={deleteAiNote.bind(null, note.id)}>
            <button
              type="submit"
              aria-label="Zmazať AI poznámku"
              className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm">{note.content}</p>
    </article>
  );
}
