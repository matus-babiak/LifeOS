import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { activeBlocks } from "@/db/schema";
import type { ActiveBlock } from "@/db/queries";

/** Najstarší otvorený blok (pre denné Telegram pripomenutie). */
export async function getOldestOpenBlock(): Promise<ActiveBlock | null> {
  const [oldest] = await db
    .select()
    .from(activeBlocks)
    .where(isNull(activeBlocks.closedAt))
    .orderBy(asc(activeBlocks.createdAt))
    .limit(1);
  return oldest ?? null;
}

/**
 * Uzavrie otvorený blok (closed_at = now).
 * Bez session: pre Telegram webhook. UI volá cez closeActiveBlock + requireUser.
 */
export async function closeBlockById(id: number): Promise<ActiveBlock | null> {
  const now = new Date();
  const [updated] = await db
    .update(activeBlocks)
    .set({ closedAt: now, updatedAt: now })
    .where(and(eq(activeBlocks.id, id), isNull(activeBlocks.closedAt)))
    .returning();
  return updated ?? null;
}

/** Pripojí poznámku k body otvoreného bloku. */
export async function appendBlockNote(
  id: number,
  note: string,
): Promise<ActiveBlock | null> {
  const [block] = await db
    .select()
    .from(activeBlocks)
    .where(and(eq(activeBlocks.id, id), isNull(activeBlocks.closedAt)));
  if (!block) return null;

  const trimmed = note.trim();
  if (!trimmed) return block;

  const body = block.body ? `${block.body}\n\n${trimmed}` : trimmed;
  const [updated] = await db
    .update(activeBlocks)
    .set({ body, updatedAt: new Date() })
    .where(eq(activeBlocks.id, id))
    .returning();
  return updated ?? null;
}

/** Po odoslaní pripomenutia zvýši counter a last_notified_at. */
export async function markBlockNotified(id: number): Promise<void> {
  const now = new Date();
  await db
    .update(activeBlocks)
    .set({
      reminderCount: sql`${activeBlocks.reminderCount} + 1`,
      lastNotifiedAt: now,
      updatedAt: now,
    })
    .where(and(eq(activeBlocks.id, id), isNull(activeBlocks.closedAt)));
}
