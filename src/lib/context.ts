// Pomocníci pre kontextové dokumenty (nahraté Obsidian poznámky).

export type IncomingDoc = {
  path: string;
  content: string;
  lastModified?: number | null;
};

export type ParsedDoc = {
  path: string;
  folder: string | null;
  title: string;
  content: string;
  noteDate: string | null; // RRRR-MM-DD
  fileModifiedAt: Date | null;
};

/** Z názvu súboru DD.MM.RRRR(.md) vytiahne dátum ako RRRR-MM-DD. Inak null. */
export function dateFromFilename(name: string): string | null {
  const m = name.match(/(\d{1,2})[.\-_](\d{1,2})[.\-_](\d{4})/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${yyyy}-${p(month)}-${p(day)}`;
}

/** Normalizuje cestu (odstráni vedúce ./ a /), vráti null pri prázdnej. */
function normalizePath(path: string): string | null {
  const clean = path.replace(/\\/g, "/").replace(/^\.?\/+/, "").trim();
  return clean.length > 0 ? clean : null;
}

/** Spracuje jeden nahraný .md dokument na tvar pre databázu. */
export function parseDoc(doc: IncomingDoc): ParsedDoc | null {
  const path = normalizePath(doc.path);
  if (!path || !path.toLowerCase().endsWith(".md")) return null;

  const parts = path.split("/");
  const filename = parts[parts.length - 1];
  const title = filename.replace(/\.md$/i, "");
  const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : null;

  return {
    path,
    folder,
    title,
    content: doc.content,
    noteDate: dateFromFilename(filename),
    fileModifiedAt:
      typeof doc.lastModified === "number" && doc.lastModified > 0
        ? new Date(doc.lastModified)
        : null,
  };
}
