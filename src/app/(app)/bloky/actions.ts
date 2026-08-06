"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { activeBlocks } from "@/db/schema";
import { closeBlockById } from "@/lib/active-blocks";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseSeverity(formData: FormData): number | null {
  const raw = Number(formData.get("severity"));
  if (!Number.isInteger(raw) || raw < 1 || raw > 3) return null;
  return raw;
}

/** Manuálne pridanie aktívneho bloku (visí, kým sa neuzavrie). */
export async function createActiveBlock(formData: FormData) {
  await requireUser();
  const title = text(formData, "title");
  if (!title) return;

  await db.insert(activeBlocks).values({
    title,
    body: text(formData, "body"),
    sourceType: "manual",
    severity: parseSeverity(formData),
  });
  revalidatePath("/");
}

/** Potvrdený AI kandidát z denníka → aktívny blok. */
export async function acceptJournalBlockCandidate(input: {
  entryId: number;
  title: string;
  why: string;
  severity: number | null;
}) {
  await requireUser();
  const title = input.title.trim();
  if (!title) return;

  const severity =
    input.severity === 1 || input.severity === 2 || input.severity === 3
      ? input.severity
      : null;
  const why = input.why.trim();

  await db.insert(activeBlocks).values({
    title,
    body: why.length > 0 ? why : null,
    sourceType: "journal",
    sourceId: input.entryId,
    severity,
  });
  revalidatePath("/");
  revalidatePath("/dennik");
}

/** Odfajkne blok: nastaví closed_at, zmizne z aktívnych. */
export async function closeActiveBlock(id: number) {
  await requireUser();
  await closeBlockById(id);
  revalidatePath("/");
}
