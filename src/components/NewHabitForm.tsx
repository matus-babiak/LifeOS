"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createHabit } from "@/app/(app)/actions";

export default function NewHabitForm() {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [target, setTarget] = useState("21");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        Nový návyk
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-medium">Nový návyk</h2>
      <form
        action={async (formData) => {
          await createHabit(formData);
          setOpen(false);
          setFrequency("daily");
          setTarget("21");
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-muted">
            Čo budem robiť?
          </label>
          <input
            id="name"
            name="name"
            required
            type="text"
            placeholder="Napr. 10 000 krokov"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="identity" className="mb-2 block text-sm text-muted">
            Akú identitu tým budujem?
          </label>
          <input
            id="identity"
            name="identity"
            type="text"
            placeholder="Napr. som človek, ktorý sa stará o svoje telo"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="frequency" className="mb-2 block text-sm text-muted">
              Ako často?
            </label>
            <select
              id="frequency"
              name="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="daily">Denne</option>
              <option value="weekdays">Pracovné dni</option>
              <option value="per_week">X-krát týždenne</option>
            </select>
          </div>
          {frequency === "per_week" && (
            <div>
              <label
                htmlFor="perWeekTarget"
                className="mb-2 block text-sm text-muted"
              >
                Koľkokrát týždenne?
              </label>
              <input
                id="perWeekTarget"
                name="perWeekTarget"
                type="number"
                min={1}
                max={7}
                defaultValue={3}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm text-muted">
            Fáza budovania — koľko dní na vybudovanie?
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "21", label: "21 dní · ľahší" },
              { value: "66", label: "66 dní · náročný" },
              { value: "custom", label: "Vlastné" },
            ].map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                  target === option.value
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line text-muted hover:border-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="targetDays"
                  value={option.value}
                  checked={target === option.value}
                  onChange={() => setTarget(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
            {target === "custom" && (
              <input
                name="targetDaysCustom"
                type="number"
                min={7}
                max={365}
                defaultValue={30}
                aria-label="Vlastný počet dní"
                className="w-24 rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
          >
            Vytvoriť návyk
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
