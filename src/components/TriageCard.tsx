"use client";

import { useState } from "react";
import { triageTolerance } from "@/app/(app)/tolerancie/actions";

const ENERGY_SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

export default function TriageCard({
  items,
  areas,
}: {
  items: { id: number; text: string }[];
  areas: { id: number; name: string; color: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);

  if (items.length === 0) return null;
  const item = items[index % items.length];

  function next() {
    setIndex((i) => i + 1);
    setAreaId(null);
    setEnergy(null);
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium">Zaraď položku</h2>
        <span className="text-xs text-muted">{items.length} nezaradených</span>
      </div>

      <p className="mb-4 text-sm">{item.text}</p>

      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Oblasť</p>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAreaId(a.id)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                areaId === a.id
                  ? { backgroundColor: a.color, color: "#fff" }
                  : { backgroundColor: `${a.color}1a`, color: a.color }
              }
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          Koľko energie mi to berie?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ENERGY_SCALE.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnergy(n)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-colors ${
                energy === n
                  ? "bg-accent text-white dark:text-[#10141a]"
                  : "border border-line text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <form
          action={async (formData) => {
            await triageTolerance(item.id, formData);
            next();
          }}
        >
          <input type="hidden" name="areaId" value={areaId ?? ""} />
          <input type="hidden" name="energy" value={energy ?? ""} />
          <button
            type="submit"
            disabled={!areaId || !energy}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:text-[#10141a]"
          >
            Uložiť a ďalšia
          </button>
        </form>
        {items.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-ink"
          >
            Preskočiť
          </button>
        )}
      </div>
    </section>
  );
}
