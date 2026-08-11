import Link from "next/link";
import { ChevronRight } from "lucide-react";
import GenerateProgressFocusButton from "@/components/GenerateProgressFocusButton";
import {
  getActiveProgressFocusItems,
  getClosedProgressFocusItems,
} from "@/db/queries";

export const metadata = { title: "Progress focus" };

export default async function ProgressFocusPage() {
  const [items, closed] = await Promise.all([
    getActiveProgressFocusItems(),
    getClosedProgressFocusItems(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Progress focus
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Veci, na ktorých potrebuješ vedome pracovať. AI ich navrhne z celého
            tvojho LifeOS kontextu.
          </p>
        </div>
        <GenerateProgressFocusButton />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Aktívne</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">
            Zatiaľ žiadne aktívne položky. Klikni na „Navrhnúť z AI“.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/progress-focus/${item.id}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm transition-colors hover:border-accent"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted">{item.summary}</p>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 ? (
        <section className="flex flex-col gap-3">
          <header>
            <h2 className="font-medium">Hotové a odložené</h2>
            <p className="mt-0.5 text-xs text-muted">
              Tu ich nájdeš aj po označení Hotovo. Môžeš ich obnoviť.
            </p>
          </header>
          <ul className="flex flex-col gap-3">
            {closed.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/progress-focus/${item.id}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-dashed border-line bg-surface/60 p-5 transition-colors hover:border-accent"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted">
                      {item.status === "done" ? "Hotovo" : "Odložené"}
                    </p>
                    <h3 className="mt-0.5 font-medium text-muted">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{item.summary}</p>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
