import {
  Brain,
  Briefcase,
  Heart,
  HeartPulse,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getAreas } from "@/db/queries";

export const metadata = { title: "Oblasti" };

const ICONS: Record<string, LucideIcon> = {
  Brain,
  HeartPulse,
  Briefcase,
  Wallet,
  Heart,
  Sparkles,
};

export default async function AreasPage() {
  const areas = await getAreas();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Oblasti života
        </h1>
        <p className="mt-1 text-sm text-muted">
          Mapa celku — tréningy si vyberáš vždy len z 1 až 3 oblastí naraz.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {areas.map((area) => {
          const Icon = ICONS[area.icon] ?? Sparkles;
          return (
            <article
              key={area.id}
              className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${area.color}22`, color: area.color }}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                </span>
                <h2 className="font-medium">{area.name}</h2>
              </div>
              {area.description && (
                <p className="mt-3 text-sm text-muted">{area.description}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
