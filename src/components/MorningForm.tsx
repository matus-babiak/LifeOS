"use client";

import { useState } from "react";
import { Sunrise } from "lucide-react";
import { saveMorning } from "@/app/(app)/actions";

export default function MorningForm({
  defaultEnergy,
  defaultIdentity,
  defaultFocus = [],
}: {
  defaultEnergy?: number | null;
  defaultIdentity?: string | null;
  defaultFocus?: string[];
}) {
  const [energy, setEnergy] = useState(defaultEnergy ?? 6);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <Sunrise className="h-5 w-5 text-accent" strokeWidth={1.8} />
        <h2 className="font-medium">Ranný check-in</h2>
        <span className="ml-auto text-xs text-muted">~2 minúty</span>
      </div>

      <form action={saveMorning} className="flex flex-col gap-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="energy" className="text-sm text-muted">
              Ako sa cítim? Energia
            </label>
            <span className="text-sm font-medium tabular-nums">
              {energy}/10
            </span>
          </div>
          <input
            id="energy"
            name="energy"
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="identityFocus" className="mb-2 block text-sm text-muted">
            Akým človekom dnes chcem byť?
          </label>
          <input
            id="identityFocus"
            name="identityFocus"
            type="text"
            defaultValue={defaultIdentity ?? ""}
            placeholder="Napr. pokojný a pozorný poslucháč"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm text-muted">
            Na čom dnes záleží? (max 3 veci)
          </span>
          {defaultFocus.length > 0 && (
            <p className="mb-2 text-xs text-muted">
              Predvyplnené z denných krokov tvojich tréningov, uprav podľa seba.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <input
                key={i}
                name={`focus${i}`}
                type="text"
                defaultValue={defaultFocus[i - 1] ?? ""}
                placeholder={i === 1 ? "Najdôležitejší krok dňa" : "Voliteľné"}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="self-start rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
        >
          Začať deň
        </button>
      </form>
    </section>
  );
}
