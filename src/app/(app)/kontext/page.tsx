import { FileText } from "lucide-react";
import ContextUploader from "@/components/ContextUploader";
import { getContextView } from "@/db/queries";
import { formatHuman } from "@/lib/dates";

export const metadata = { title: "Kontext" };

export default async function ContextPage() {
  const { total, lastSynced, docs } = await getContextView();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Kontext</h1>
        <p className="mt-1 text-sm text-muted">
          Tvoje poznámky z Obsidianu ako palivo pre AI mentora. Novšie
          uprednostňuje pred staršími.
        </p>
      </header>

      <ContextUploader />

      {total > 0 && (
        <p className="text-sm text-muted">
          Nahratých {total} poznámok
          {lastSynced
            ? `, naposledy ${new Date(lastSynced).toLocaleDateString("sk-SK")}`
            : ""}
          .
        </p>
      )}

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-sm text-muted">
            Zatiaľ žiadne poznámky. Nahraj priečinok s dennými poznámkami
            a mentor s nimi začne pracovať.
          </p>
        </div>
      ) : (
        <section className="flex flex-col gap-1">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.8} />
              <span className="min-w-0 flex-1 truncate text-sm">{d.title}</span>
              {d.folder && (
                <span className="hidden shrink-0 text-xs text-muted sm:inline">
                  {d.folder}
                </span>
              )}
              <span className="shrink-0 text-xs text-muted">
                {d.noteDate ? formatHuman(d.noteDate) : "-"}
              </span>
            </div>
          ))}
          {total > docs.length && (
            <p className="mt-2 text-center text-xs text-muted">
              Zobrazených najnovších {docs.length} z {total}.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
