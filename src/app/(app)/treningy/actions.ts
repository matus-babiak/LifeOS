"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { milestones, trainings } from "@/db/schema";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createTraining(formData: FormData) {
  await requireUser();
  const name = text(formData, "name");
  const areaId = Number(formData.get("areaId"));
  if (!name || !Number.isInteger(areaId)) return;

  const [row] = await db
    .insert(trainings)
    .values({
      name,
      areaId,
      why: text(formData, "why"),
      goal: text(formData, "goal"),
      dailyStep: text(formData, "dailyStep"),
    })
    .returning({ id: trainings.id });

  revalidatePath("/treningy");
  revalidatePath("/");
  redirect(`/treningy/${row.id}`);
}

export async function updateTraining(id: number, formData: FormData) {
  await requireUser();
  const name = text(formData, "name");
  if (!name) return;
  await db
    .update(trainings)
    .set({
      name,
      why: text(formData, "why"),
      goal: text(formData, "goal"),
      dailyStep: text(formData, "dailyStep"),
    })
    .where(eq(trainings.id, id));
  revalidatePath(`/treningy/${id}`);
  revalidatePath("/treningy");
  revalidatePath("/");
}

export async function setTrainingStatus(
  id: number,
  status: "active" | "paused" | "completed",
) {
  await requireUser();
  await db.update(trainings).set({ status }).where(eq(trainings.id, id));
  revalidatePath(`/treningy/${id}`);
  revalidatePath("/treningy");
  revalidatePath("/");
}

export async function deleteTraining(id: number) {
  await requireUser();
  await db.delete(trainings).where(eq(trainings.id, id));
  revalidatePath("/treningy");
  revalidatePath("/");
  redirect("/treningy");
}

export async function addMilestone(trainingId: number, formData: FormData) {
  await requireUser();
  const value = text(formData, "text");
  if (!value) return;
  const [t] = await db
    .select({ level: trainings.level })
    .from(trainings)
    .where(eq(trainings.id, trainingId));
  if (!t) return;

  const [{ total }] = await db
    .select({ total: count() })
    .from(milestones)
    .where(
      and(
        eq(milestones.trainingId, trainingId),
        eq(milestones.level, t.level),
      ),
    );

  await db.insert(milestones).values({
    trainingId,
    level: t.level,
    text: value,
    position: Number(total),
  });
  revalidatePath(`/treningy/${trainingId}`);
}

export async function toggleMilestone(id: number, trainingId: number) {
  await requireUser();
  const [m] = await db.select().from(milestones).where(eq(milestones.id, id));
  if (!m) return;
  await db
    .update(milestones)
    .set({ done: !m.done })
    .where(eq(milestones.id, id));
  revalidatePath(`/treningy/${trainingId}`);
}

export async function deleteMilestone(id: number, trainingId: number) {
  await requireUser();
  await db.delete(milestones).where(eq(milestones.id, id));
  revalidatePath(`/treningy/${trainingId}`);
}

/** Posun na ďalšiu úroveň, ak sú všetky míľniky aktuálnej úrovne splnené. */
export async function levelUp(id: number) {
  await requireUser();
  const [t] = await db.select().from(trainings).where(eq(trainings.id, id));
  if (!t || t.level >= 5) return;

  const own = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.trainingId, id), eq(milestones.level, t.level)));
  if (own.length === 0 || own.some((m) => !m.done)) return;

  await db
    .update(trainings)
    .set({ level: t.level + 1 })
    .where(eq(trainings.id, id));
  revalidatePath(`/treningy/${id}`);
  revalidatePath("/treningy");
}
