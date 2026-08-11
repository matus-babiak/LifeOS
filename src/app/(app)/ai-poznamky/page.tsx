import Link from "next/link";
import AiNoteCard from "@/components/AiNoteCard";
import { getAiNotesView } from "@/db/queries";

export const metadata = { title: "AI poznámky" };

export default async function AiNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategoria?: string }>;
}) {
  const { kategoria } = await searchParams;
  const { notes, categories } = await getAiNotesView();
  const filtered = kategoria
    ? notes.filter((n) => n.category === kategoria)
    : notes;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">AI poznámky</h1>
        <p className="mt-1 text-sm text-muted">
          Odpovede z Telegram mentora, ktoré si uložil jedným klikom. Kategórie
          priraďuje AI, môžeš ich tu upraviť.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/ai-poznamky"
          className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
            !kategoria
              ? "bg-accent-soft text-accent-ink"
              : "border border-line text-muted hover:text-ink"
          }`}
        >
          Všetky
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/ai-poznamky?kategoria=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
              kategoria === c
                ? "bg-accent-soft text-accent-ink"
                : "border border-line text-muted hover:text-ink"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted">
          {kategoria
            ? "V tejto kategórii zatiaľ nič nie je."
            : "Zatiaľ žiadne AI poznámky. V Telegrame pod odpoveďou mentora stlač Uložiť do LifeOS."}
        </p>
      )}

      <section className="flex flex-col gap-3">
        {filtered.map((note) => (
          <AiNoteCard key={note.id} note={note} categories={categories} />
        ))}
      </section>
    </div>
  );
}
