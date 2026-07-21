import Link from "next/link";
import {
  Brain,
  Briefcase,
  Download,
  Heart,
  HeartPulse,
  Pause,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getAreasOverview } from "@/db/queries";

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
  const overview = await getAreasOverview();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Oblasti života
        </h1>
        <p className="mt-1 text-sm text-muted">
          Mapa celku - tréningy si vyberáš vždy len z 1 až 3 oblastí naraz.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {overview.map(({ area, trainings }) => {
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

              {trainings.length > 0 && (
                <ul className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
                  {trainings.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/treningy/${t.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-bg"
                      >
                        <span className="flex items-center gap-2">
                          {t.status === "paused" && (
                            <Pause className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />
                          )}
                          {t.name}
                        </span>
                        <span className="text-xs text-muted">úr. {t.level}/5</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-medium">Záloha</h2>
        <p className="mt-1 text-sm text-muted">
          Stiahni si všetky dáta ako markdown v štruktúre vaultu - denné poznámky
          a týždenné reflexie.
        </p>
        <a
          href="/api/export"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Download className="h-4 w-4" />
          Stiahnuť zálohu (.zip)
        </a>
      </section>
    </div>
  );
}
