"use client";

import { useState } from "react";
import { Flag, Plus } from "lucide-react";
import { createSeason, endSeason } from "@/app/(app)/vizia/actions";
import { formatHuman } from "@/lib/dates";
import type { Season } from "@/db/queries";

export default function SeasonPanel({
  activeSeason,
  pastSeasons,
}: {
  activeSeason: Season | null;
  pastSeasons: Season[];
}) {
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState(false);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2.5">
        <Flag className="h-4 w-4 text-accent" strokeWidth={1.8} />
        <h2 className="font-medium">Sezóna</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        12-týždňová fáza života s jasným zámerom, ktorá končí retrospektívou.
      </p>

      {activeSeason && !ending && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-medium">{activeSeason.title}</p>
            {activeSeason.intention && (
              <p className="mt-1 text-sm text-muted">{activeSeason.intention}</p>
            )}
            <p className="mt-2 text-xs text-muted">
              {formatHuman(activeSeason.startDate)} - {formatHuman(activeSeason.endDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnding(true)}
            className="self-start rounded-xl border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            Ukončiť sezónu retrospektívou
          </button>
        </div>
      )}

      {activeSeason && ending && (
        <form
          action={async (formData) => {
            await endSeason(activeSeason.id, formData);
            setEnding(false);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="retrospective" className="mb-2 block text-sm text-muted">
              Retrospektíva: čo sa v tejto sezóne stalo, kým si sa stal?
            </label>
            <textarea
              id="retrospective"
              name="retrospective"
              rows={4}
              className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
            >
              Ukončiť sezónu
            </button>
            <button
              type="button"
              onClick={() => setEnding(false)}
              className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-ink"
            >
              Zrušiť
            </button>
          </div>
        </form>
      )}

      {!activeSeason && !creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="h-4 w-4" />
          Začať novú sezónu
        </button>
      )}

      {!activeSeason && creating && (
        <form
          action={async (formData) => {
            await createSeason(formData);
            setCreating(false);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="title" className="mb-2 block text-sm text-muted">
              Názov sezóny
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Napr. Základy"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="intention" className="mb-2 block text-sm text-muted">
              Zámer (voliteľné)
            </label>
            <textarea
              id="intention"
              name="intention"
              rows={2}
              placeholder="Čo chceš, aby táto sezóna priniesla?"
              className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <p className="text-xs text-muted">Trvá 12 týždňov od dnes.</p>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
            >
              Spustiť sezónu
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-ink"
            >
              Zrušiť
            </button>
          </div>
        </form>
      )}

      {pastSeasons.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="mb-2 text-xs uppercase tracking-wide text-muted">
            Predošlé sezóny
          </h3>
          <ul className="flex flex-col gap-3">
            {pastSeasons.map((s) => (
              <li key={s.id} className="text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted">
                  {formatHuman(s.startDate)} - {formatHuman(s.endDate)}
                </p>
                {s.retrospective && (
                  <p className="mt-1 whitespace-pre-wrap text-muted">{s.retrospective}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
