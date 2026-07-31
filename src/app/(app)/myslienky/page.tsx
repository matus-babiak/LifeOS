import { Trash2 } from "lucide-react";
import NewThoughtForm from "@/components/NewThoughtForm";
import { getThoughts } from "@/db/queries";
import { formatHuman } from "@/lib/dates";
import { deleteThought } from "./actions";

export const metadata = { title: "Myšlienky" };

export default async function ThoughtsPage() {
  const thoughts = await getThoughts();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Myšlienky</h1>
        <p className="mt-1 text-sm text-muted">
          Rýchly zápis bez kategórií - napíš a ulož.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <NewThoughtForm />
      </section>

      {thoughts.length === 0 && (
        <p className="text-sm text-muted">Zatiaľ žiadne myšlienky.</p>
      )}

      <section className="flex flex-col gap-3">
        {thoughts.map((thought) => (
          <article
            key={thought.id}
            className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">
                {formatHuman(thought.createdAt.toISOString().slice(0, 10))}
              </span>
              <form action={deleteThought.bind(null, thought.id)}>
                <button
                  type="submit"
                  aria-label="Zmazať myšlienku"
                  className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
            <p className="whitespace-pre-wrap text-sm">{thought.content}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
