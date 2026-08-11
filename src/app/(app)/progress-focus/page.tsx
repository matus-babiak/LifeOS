import Link from "next/link";
import { ChevronRight } from "lucide-react";
import GenerateProgressFocusButton from "@/components/GenerateProgressFocusButton";
import { getActiveProgressFocusItems } from "@/db/queries";

export const metadata = { title: "Progress focus" };

export default async function ProgressFocusPage() {
  const items = await getActiveProgressFocusItems();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Progress focus
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Veci, na ktorých potrebuješ vedome pracovať. AI ich navrhne z celého
            tvojho LifeOS kontextu. Vyber si, na čom sa sústredíš.
          </p>
        </div>
        <GenerateProgressFocusButton />
      </header>

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
                  <h2 className="font-medium">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted">{item.summary}</p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
