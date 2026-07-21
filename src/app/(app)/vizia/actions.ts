"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { seasons, visions } from "@/db/schema";
import { addDays, todayISO } from "@/lib/dates";
import { requireUser } from "@/lib/session";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

export async function createSeason(formData: FormData) {
  await requireUser();
  const title = text(formData, "title");
  if (!title) return;

  const existing = await db
    .select({ id: seasons.id })
    .from(seasons)
    .where(eq(seasons.active, true));
  if (existing.length > 0) return; // najprv treba ukončiť bežiacu sezónu

  const startDate = todayISO();
  const endDate = addDays(startDate, 83); // 12 týždňov

  await db.insert(seasons).values({
    title,
    intention: text(formData, "intention"),
    startDate,
    endDate,
    active: true,
  });

  revalidatePath("/vizia");
}

export async function endSeason(id: number, formData: FormData) {
  await requireUser();
  await db
    .update(seasons)
    .set({ retrospective: text(formData, "retrospective"), active: false })
    .where(eq(seasons.id, id));
  revalidatePath("/vizia");
}
