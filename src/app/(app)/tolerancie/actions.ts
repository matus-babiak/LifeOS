"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tolerances } from "@/db/schema";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function revalidateAll() {
  revalidatePath("/tolerancie");
  revalidatePath("/");
}

/** Rýchly zápis - iba text, bez oblasti a energie. Triedenie príde neskôr. */
export async function addTolerance(formData: FormData) {
  await requireUser();
  const value = text(formData, "text");
  if (!value) return;

  await db.insert(tolerances).values({ text: value });
  revalidateAll();
}

/** Priradenie oblasti a energie k nezaradenej položke. */
export async function triageTolerance(id: number, formData: FormData) {
  await requireUser();

  const areaIdRaw = Number(formData.get("areaId"));
  const areaId = Number.isInteger(areaIdRaw) && areaIdRaw > 0 ? areaIdRaw : null;
  const energyRaw = Number(formData.get("energy"));
  const energy =
    Number.isInteger(energyRaw) && energyRaw >= 1 && energyRaw <= 10
      ? energyRaw
      : null;
  if (!areaId || !energy) return;

  await db.update(tolerances).set({ areaId, energy }).where(eq(tolerances.id, id));
  revalidateAll();
}

/** Naplánovanie väčšej položky - konkrétny dátum a prvý krok. */
export async function scheduleTolerance(id: number, formData: FormData) {
  await requireUser();
  const dueDate = text(formData, "dueDate");
  const firstStep = text(formData, "firstStep");
  if (!dueDate) return;

  await db
    .update(tolerances)
    .set({ dueDate, firstStep })
    .where(eq(tolerances.id, id));
  revalidateAll();
}

export async function resolveTolerance(id: number) {
  await requireUser();
  await db.update(tolerances).set({ doneAt: new Date() }).where(eq(tolerances.id, id));
  revalidateAll();
}

export async function deleteTolerance(id: number) {
  await requireUser();
  await db.delete(tolerances).where(eq(tolerances.id, id));
  revalidateAll();
}
