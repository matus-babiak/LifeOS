"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { FolderUp, FileUp, Loader2, Check } from "lucide-react";
import { importContextDocuments } from "@/app/(app)/kontext/actions";
import type { IncomingDoc } from "@/lib/context";

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "importing"; total: number }
  | { kind: "done"; imported: number; skipped: number }
  | { kind: "error"; message: string };

async function fileListToDocs(files: File[]): Promise<IncomingDoc[]> {
  const docs: IncomingDoc[] = [];
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files);
      for (const entry of entries) {
        if (entry.dir || !entry.name.toLowerCase().endsWith(".md")) continue;
        const content = await entry.async("string");
        docs.push({
          path: entry.name,
          content,
          lastModified: entry.date ? entry.date.getTime() : null,
        });
      }
    } else if (lower.endsWith(".md")) {
      const rel =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;
      const content = await file.text();
      docs.push({ path: rel, content, lastModified: file.lastModified });
    }
  }
  return docs;
}

export default function ContextUploader() {
  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setStatus({ kind: "reading" });
    try {
      const docs = await fileListToDocs(Array.from(fileList));
      if (docs.length === 0) {
        setStatus({ kind: "error", message: "Nenašli sa žiadne .md súbory." });
        return;
      }
      setStatus({ kind: "importing", total: docs.length });

      let imported = 0;
      let skipped = 0;
      for (let i = 0; i < docs.length; i += 150) {
        const res = await importContextDocuments(docs.slice(i, i + 150));
        imported += res.imported;
        skipped += res.skipped;
      }
      setStatus({ kind: "done", imported, skipped });
    } catch {
      setStatus({
        kind: "error",
        message: "Nahrávanie zlyhalo, skús to znova.",
      });
    }
  }

  const busy = status.kind === "reading" || status.kind === "importing";

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-1 font-medium">Nahrať poznámky</h2>
      <p className="mb-4 text-sm text-muted">
        Na Macu vyber celý priečinok. Na telefóne priečinok v Súboroch
        skomprimuj na .zip a nahraj ten. Opakované nahranie len aktualizuje.
      </p>

      <input
        ref={folderRef}
        type="file"
        multiple
        accept=".md,text/markdown"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        {...{ webkitdirectory: "", directory: "" }}
      />
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".md,.zip,text/markdown,application/zip"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => folderRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#10141a]"
        >
          <FolderUp className="h-4 w-4" />
          Nahrať priečinok
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent disabled:opacity-50"
        >
          <FileUp className="h-4 w-4" />
          Nahrať súbory / ZIP
        </button>
      </div>

      {status.kind === "reading" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Čítam súbory...
        </p>
      )}
      {status.kind === "importing" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Nahrávam {status.total} poznámok...
        </p>
      )}
      {status.kind === "done" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-accent-ink">
          <Check className="h-4 w-4" />
          Hotovo, spracovaných {status.imported} poznámok
          {status.skipped > 0 ? ` (${status.skipped} preskočených)` : ""}.
        </p>
      )}
      {status.kind === "error" && (
        <p className="mt-3 text-sm text-danger">{status.message}</p>
      )}
    </section>
  );
}
