"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { attentionItems } from "@/db/schema";
import { requireUser } from "@/lib/session";

export type AttentionBucket = "now" | "later";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBucket(value: FormDataEntryValue | null): AttentionBucket | null {
  return value === "now" || value === "later" ? value : null;
}

function parseAreaId(formData: FormData): number | null {
  const raw = formData.get("areaId");
  if (typeof raw !== "string" || raw === "") return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function createAttentionItem(formData: FormData) {
  await requireUser();
  const itemText = text(formData, "text");
  const bucket = parseBucket(formData.get("bucket"));
  if (!itemText || !bucket) return;

  const note = text(formData, "note");
  const areaId = parseAreaId(formData);

  const [{ total }] = await db
    .select({ total: count() })
    .from(attentionItems)
    .where(eq(attentionItems.bucket, bucket));

  await db.insert(attentionItems).values({
    text: itemText,
    bucket,
    note,
    areaId,
    position: Number(total),
  });
  revalidatePath("/pozornost");
}

export async function updateAttentionItem(id: number, formData: FormData) {
  await requireUser();
  const itemText = text(formData, "text");
  if (!itemText) return;

  await db
    .update(attentionItems)
    .set({
      text: itemText,
      note: text(formData, "note"),
      areaId: parseAreaId(formData),
      updatedAt: new Date(),
    })
    .where(eq(attentionItems.id, id));
  revalidatePath("/pozornost");
}

/** Presunie položku do druhého stĺpca (now ↔ later). */
export async function moveAttentionItem(id: number) {
  await requireUser();
  const [item] = await db
    .select()
    .from(attentionItems)
    .where(eq(attentionItems.id, id));
  if (!item) return;

  const nextBucket: AttentionBucket =
    item.bucket === "now" ? "later" : "now";

  const [{ total }] = await db
    .select({ total: count() })
    .from(attentionItems)
    .where(eq(attentionItems.bucket, nextBucket));

  await db
    .update(attentionItems)
    .set({
      bucket: nextBucket,
      position: Number(total),
      updatedAt: new Date(),
    })
    .where(eq(attentionItems.id, id));
  revalidatePath("/pozornost");
}

export async function deleteAttentionItem(id: number) {
  await requireUser();
  await db.delete(attentionItems).where(eq(attentionItems.id, id));
  revalidatePath("/pozornost");
}
