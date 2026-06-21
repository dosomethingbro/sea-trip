// src/storage/croatiaStore.ts
//
// Server-only data layer for the Croatia trip. Neon is the source of truth.
// Days are static (code); only activities are persisted. Mutations are
// row-level. Scoped by workspace_id (single shared workspace, like SE Asia).

import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { croatiaActivities as tbl } from "@/db/schema";
import { buildSeedActivities, CROATIA_DAYS } from "@/lib/croatia/seed";
import type { CroatiaActivity, CroatiaState } from "@/lib/croatia/types";

const SCHEMA_VERSION = 1;
export const CROATIA_WORKSPACE_ID = "croatia-default";

const VALID_DAY_IDS = new Set(CROATIA_DAYS.map((d) => d.id));

// ---------------------------------------------------------------------------
// Bootstrapping: seed the activities on first load. Idempotent.
// ---------------------------------------------------------------------------
async function ensureSeed(): Promise<void> {
  const present = await db
    .select({ id: tbl.id })
    .from(tbl)
    .where(eq(tbl.workspaceId, CROATIA_WORKSPACE_ID))
    .limit(1);
  if (present.length > 0) return;

  const seed = buildSeedActivities();
  if (seed.length === 0) return;
  await db.insert(tbl).values(
    seed.map((a) => ({
      id: a.id,
      workspaceId: CROATIA_WORKSPACE_ID,
      dayId: a.dayId,
      position: a.position,
      activity: a,
    }))
  );
}

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------
export async function loadCroatiaState(): Promise<CroatiaState> {
  await ensureSeed();

  const rows = await db
    .select()
    .from(tbl)
    .where(eq(tbl.workspaceId, CROATIA_WORKSPACE_ID))
    .orderBy(asc(tbl.dayId), asc(tbl.position));

  const activities: CroatiaActivity[] = rows.map((r) => ({
    ...r.activity,
    id: r.id,
    dayId: r.dayId,
    position: r.position,
  }));

  return { schemaVersion: SCHEMA_VERSION, activities };
}

// ---------------------------------------------------------------------------
// MUTATIONS (row-level)
// ---------------------------------------------------------------------------

// Add a new activity to the end of a day's list.
export async function addCroatiaActivity(
  activity: CroatiaActivity
): Promise<void> {
  if (!VALID_DAY_IDS.has(activity.dayId)) {
    throw new Error(`Unknown dayId: ${activity.dayId}`);
  }
  await db.insert(tbl).values({
    id: activity.id,
    workspaceId: CROATIA_WORKSPACE_ID,
    dayId: activity.dayId,
    position: activity.position,
    activity,
    updatedAt: new Date(),
  });
}

// Replace an existing activity in place (swap). Keeps the same row id/position
// so the new activity lands in the same slot in the day.
export async function swapCroatiaActivity(
  oldId: string,
  next: CroatiaActivity
): Promise<void> {
  const existing = await db
    .select()
    .from(tbl)
    .where(and(eq(tbl.workspaceId, CROATIA_WORKSPACE_ID), eq(tbl.id, oldId)))
    .limit(1);
  if (existing.length === 0) throw new Error(`Activity not found: ${oldId}`);
  const row = existing[0];
  if (row.activity.locked) throw new Error("Cannot swap a locked activity");

  const merged: CroatiaActivity = {
    ...next,
    id: next.id,
    dayId: row.dayId,
    position: row.position,
  };

  // Insert the replacement, then delete the old row (new id -> can't update pk).
  await db.insert(tbl).values({
    id: merged.id,
    workspaceId: CROATIA_WORKSPACE_ID,
    dayId: merged.dayId,
    position: merged.position,
    activity: merged,
    updatedAt: new Date(),
  });
  await db
    .delete(tbl)
    .where(and(eq(tbl.workspaceId, CROATIA_WORKSPACE_ID), eq(tbl.id, oldId)));
}

export async function removeCroatiaActivity(id: string): Promise<void> {
  const existing = await db
    .select({ locked: tbl.activity })
    .from(tbl)
    .where(and(eq(tbl.workspaceId, CROATIA_WORKSPACE_ID), eq(tbl.id, id)))
    .limit(1);
  if (existing.length > 0 && existing[0].locked?.locked) {
    throw new Error("Cannot remove a locked activity");
  }
  await db
    .delete(tbl)
    .where(and(eq(tbl.workspaceId, CROATIA_WORKSPACE_ID), eq(tbl.id, id)));
}

// Persist a reordered day: write each activity's new position.
export async function reorderCroatiaDay(
  dayId: string,
  orderedIds: string[]
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, position) =>
      db
        .update(tbl)
        .set({ position, updatedAt: new Date() })
        .where(
          and(
            eq(tbl.workspaceId, CROATIA_WORKSPACE_ID),
            eq(tbl.dayId, dayId),
            eq(tbl.id, id)
          )
        )
    )
  );
}

// ---------------------------------------------------------------------------
// Reset: wipe and reseed (user-initiated).
// ---------------------------------------------------------------------------
export async function resetCroatiaData(): Promise<CroatiaState> {
  await db.delete(tbl).where(eq(tbl.workspaceId, CROATIA_WORKSPACE_ID));
  await ensureSeed();
  return loadCroatiaState();
}
