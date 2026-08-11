import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import FocusProgressTodayButton from "@/components/FocusProgressTodayButton";
import { getProgressFocusItem } from "@/db/queries";
import {
  dismissProgressFocus,
  markProgressFocusDone,
} from "../actions";

export const metadata = { title: "Progress focus" };

export default async function ProgressFocusDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const item = await getProgressFocusItem(id);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/progress-focus"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Späť na Progress focus
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wide text-muted">
          Progress focus
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {item.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{item.summary}</p>
      </header>

      {item.nextStep ? (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-medium">Najbližší krok</h2>
          <p className="mt-2 text-sm">{item.nextStep}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-medium">Ako na tom pracovať</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
          {item.detail}
        </p>
      </section>

      {item.status === "active" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
          <FocusProgressTodayButton itemId={item.id} />
          <form action={markProgressFocusDone.bind(null, item.id)}>
            <button
              type="submit"
              className="rounded-xl border border-line px-5 py-2.5 text-sm transition-colors hover:border-accent"
            >
              Hotovo
            </button>
          </form>
          <form action={dismissProgressFocus.bind(null, item.id)}>
            <button
              type="submit"
              className="rounded-xl border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-ink"
            >
              Odložiť
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Stav: {item.status === "done" ? "hotovo" : "odložené"}
        </p>
      )}
    </div>
  );
}
