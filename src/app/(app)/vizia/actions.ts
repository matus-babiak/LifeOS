"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { goals, visions } from "@/db/schema";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isoDate(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

export async function saveVision(horizon: "1y" | "5y", formData: FormData) {
  await requireUser();
  const content = text(formData, "content");

  await db
    .insert(visions)
    .values({ horizon, content, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: visions.horizon,
      set: { content, updatedAt: new Date() },
    });

  revalidatePath("/vizia");
}

export async function createGoal(formData: FormData) {
  await requireUser();
  const title = text(formData, "title");
  const areaId = Number(formData.get("areaId"));
  const dueDate = isoDate(formData, "dueDate");
  if (!title || !Number.isInteger(areaId) || !dueDate) return;

  await db.insert(goals).values({ title, areaId, dueDate });
  revalidatePath("/vizia");
  revalidatePath("/");
}

export async function updateGoal(id: number, formData: FormData) {
  await requireUser();
  const title = text(formData, "title");
  const areaId = Number(formData.get("areaId"));
  const dueDate = isoDate(formData, "dueDate");
  if (!title || !Number.isInteger(areaId) || !dueDate) return;

  await db
    .update(goals)
    .set({ title, areaId, dueDate, updatedAt: new Date() })
    .where(eq(goals.id, id));
  revalidatePath("/vizia");
  revalidatePath("/");
}

export async function deleteGoal(id: number) {
  await requireUser();
  await db.delete(goals).where(eq(goals.id, id));
  revalidatePath("/vizia");
  revalidatePath("/");
}

export async function toggleGoalDone(id: number) {
  await requireUser();
  const [row] = await db
    .select({ doneAt: goals.doneAt })
    .from(goals)
    .where(eq(goals.id, id));
  if (!row) return;

  await db
    .update(goals)
    .set({
      doneAt: row.doneAt ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(goals.id, id));
  revalidatePath("/vizia");
  revalidatePath("/");
}
