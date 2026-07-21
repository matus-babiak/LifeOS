import Link from "next/link";
import { Lightbulb, Trash2 } from "lucide-react";
import NewNoteForm from "@/components/NewNoteForm";
import { getNotesView } from "@/db/queries";
import { formatHuman } from "@/lib/dates";
import { getAreaIcon } from "@/lib/areaIcons";
import { LIFEOS_CATEGORY, LIFEOS_CATEGORY_COLOR, LIFEOS_CATEGORY_LABEL } from "@/lib/notes";
import { deleteNote } from "./actions";

export const metadata = { title: "Poznámky" };

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategoria?: string }>;
}) {
  const { kategoria } = await searchParams;
  const { areas, notes } = await getNotesView();

  const categories = [
    ...areas.map((a) => ({
      slug: a.slug,
      name: a.name,
      color: a.color,
      icon: getAreaIcon(a.icon),
    })),
    {
      slug: LIFEOS_CATEGORY,
      name: LIFEOS_CATEGORY_LABEL,
      color: LIFEOS_CATEGORY_COLOR,
      icon: Lightbulb,
    },
  ];
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const filtered = kategoria ? notes.filter((n) => n.category === kategoria) : notes;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Poznámky</h1>
        <p className="mt-1 text-sm text-muted">
          Rýchle zápisky priradené ku kategórii - vrátane nápadov na zlepšenie LifeOS.
        </p>
      </header>

      <NewNoteForm
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        defaultCategory={kategoria}
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/poznamky"
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
            key={c.slug}
            href={`/poznamky?kategoria=${c.slug}`}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
              kategoria === c.slug
                ? "text-accent-ink"
                : "border border-line text-muted hover:text-ink"
            }`}
            style={
              kategoria === c.slug ? { backgroundColor: `${c.color}22` } : undefined
            }
          >
            {c.name}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted">
          {kategoria ? "V tejto kategórii zatiaľ nič nie je." : "Zatiaľ žiadne poznámky."}
        </p>
      )}

      <section className="flex flex-col gap-3">
        {filtered.map((note) => {
          const category = categoryBySlug.get(note.category);
          const Icon = category?.icon ?? Lightbulb;
          const color = category?.color ?? LIFEOS_CATEGORY_COLOR;
          return (
            <article
              key={note.id}
              className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span
                  className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  <Icon className="h-3 w-3" strokeWidth={1.8} />
                  {category?.name ?? note.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">
                    {formatHuman(note.createdAt.toISOString().slice(0, 10))}
                  </span>
                  <form action={deleteNote.bind(null, note.id)}>
                    <button
                      type="submit"
                      aria-label="Zmazať poznámku"
                      className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
