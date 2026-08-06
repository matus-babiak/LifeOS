"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  deleteAttentionItem,
  moveAttentionItem,
  updateAttentionItem,
  type AttentionBucket,
} from "@/app/(app)/pozornost/actions";
import type { attentionItems } from "@/db/schema";

type Item = typeof attentionItems.$inferSelect;
type AreaOption = { id: number; name: string };

export default function AttentionItemCard({
  item,
  areaName,
  areas,
}: {
  item: Item;
  areaName: string | null;
  areas: AreaOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const bucket = item.bucket as AttentionBucket;
  const moveLabel =
    bucket === "now" ? "Presunúť do Odkladám" : "Presunúť do Aktuálne";
  const MoveIcon = bucket === "now" ? ArrowRight : ArrowLeft;

  if (editing) {
    return (
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <form
          action={async (formData) => {
            await updateAttentionItem(item.id, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label
              htmlFor={`edit-text-${item.id}`}
              className="mb-1.5 block text-sm text-muted"
            >
              Text
            </label>
            <input
              id={`edit-text-${item.id}`}
              name="text"
              type="text"
              required
              defaultValue={item.text}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor={`edit-note-${item.id}`}
              className="mb-1.5 block text-sm text-muted"
            >
              Poznámka
            </label>
            <textarea
              id={`edit-note-${item.id}`}
              name="note"
              rows={2}
              defaultValue={item.note ?? ""}
              className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor={`edit-area-${item.id}`}
              className="mb-1.5 block text-sm text-muted"
            >
              Oblasť
            </label>
            <select
              id={`edit-area-${item.id}`}
              name="areaId"
              defaultValue={item.areaId ?? ""}
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
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        {areaName ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
            {areaName}
          </span>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Upraviť"
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <form action={deleteAttentionItem.bind(null, item.id)}>
            <button
              type="submit"
              aria-label="Zmazať"
              className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
      <p className="text-sm font-medium">{item.text}</p>
      {item.note && (
        <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted">{item.note}</p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await moveAttentionItem(item.id);
          });
        }}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
      >
        <MoveIcon className="h-3.5 w-3.5" />
        {moveLabel}
      </button>
    </article>
  );
}
