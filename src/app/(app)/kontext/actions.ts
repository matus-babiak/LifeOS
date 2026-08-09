"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { contextDocuments } from "@/db/schema";
import { parseDoc, type IncomingDoc } from "@/lib/context";
import { requireUser } from "@/lib/session";

const MAX_DOCS = 5000;
const MAX_CONTENT = 500_000; // ~0,5 MB na súbor, ochrana pred extrémami

export async function importContextDocuments(
  docs: IncomingDoc[],
): Promise<{ imported: number; skipped: number }> {
  await requireUser();

  const parsed = docs
    .slice(0, MAX_DOCS)
    .map(parseDoc)
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .map((d) => ({ ...d, content: d.content.slice(0, MAX_CONTENT) }));

  const skipped = docs.length - parsed.length;
  if (parsed.length === 0) return { imported: 0, skipped };

  // Deduplikácia podľa cesty (posledný vyhráva), inak by upsert v jednom príkaze padol.
  const byPath = new Map(parsed.map((d) => [d.path, d]));
  const rows = [...byPath.values()];

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await db
      .insert(contextDocuments)
      .values(chunk)
      .onConflictDoUpdate({
        target: contextDocuments.path,
        set: {
          content: sql`excluded.content`,
          folder: sql`excluded.folder`,
          title: sql`excluded.title`,
          noteDate: sql`excluded.note_date`,
          fileModifiedAt: sql`excluded.file_modified_at`,
          syncedAt: sql`now()`,
        },
      });
  }

  revalidatePath("/kontext");
  return { imported: rows.length, skipped };
}

export async function clearContextDocuments() {
  await requireUser();
  await db.delete(contextDocuments);
  revalidatePath("/kontext");
}
