// src/storage/remoteTripStore.ts
//
// Server-only data layer: Neon is the SOURCE OF TRUTH. This module assembles a
// WorkspaceState from row-level tables and exposes row-level mutations. It is
// the "RemoteTripStore" implementing the same conceptual seam as the old
// LocalStorageTripStore — except reads/writes are async and granular (never
// whole-blob).
//
// Phase 1 attributes everything to DEFAULT_PROFILE_ID. Phase 2 will pass the
// session-derived ProfileId into each function instead.

import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  destinationDecisions as destinationDecisionsTable,
  favorites as favoritesTable,
  feedback as feedbackTable,
  planVersions as planVersionsTable,
  preferences as preferencesTable,
  workspace as workspaceTable,
} from "@/db/schema";
import { SEED_PLANS } from "@/lib/seedPlans";
import { DATE_OPTIONS, SEED_PREFERENCES } from "@/lib/seedConfig";
import { DEFAULT_PROFILE_ID, WORKSPACE_ID } from "@/lib/workspaceConfig";
import type {
  ActivityFeedback,
  DestinationDecision,
  DestinationDecisionStatus,
  FeedbackStatus,
  PlanVersion,
  Preference,
  ProfileId,
  TripPlan,
  VersionKind,
  WorkspaceState,
} from "@/lib/types";

const SCHEMA_VERSION = 2; // server-backed schema generation

function originalVersionRow(plan: TripPlan) {
  return {
    id: `${plan.id}::v0`,
    workspaceId: WORKSPACE_ID,
    lineageId: plan.id,
    label: "Original",
    kind: "original" as VersionKind,
    plan,
    changeSummary: null,
    parentVersionId: null,
    createdAt: new Date(0),
  };
}

// ---------------------------------------------------------------------------
// Bootstrapping: ensure the workspace row + seed lineages/preferences exist.
// Idempotent and safe to call on every read.
// ---------------------------------------------------------------------------
async function ensureWorkspace(): Promise<void> {
  const existing = await db
    .select({ id: workspaceTable.id })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, WORKSPACE_ID))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(workspaceTable).values({
      id: WORKSPACE_ID,
      activeDateOptionId: DATE_OPTIONS[0].id,
      activeVersionByLineage: {},
    });
  }
}

async function ensureSeedVersions(): Promise<void> {
  const present = await db
    .select({ lineageId: planVersionsTable.lineageId })
    .from(planVersionsTable)
    .where(eq(planVersionsTable.workspaceId, WORKSPACE_ID));

  const known = new Set(present.map((r) => r.lineageId));
  const missing = SEED_PLANS.filter((p) => !known.has(p.id));
  if (missing.length === 0) return;

  const rows = missing.map((p) => originalVersionRow(p));
  await db.insert(planVersionsTable).values(rows);

  // Point the active pointer at each new seed's original version.
  const ws = await getWorkspaceRow();
  const activeMap = { ...(ws?.activeVersionByLineage ?? {}) };
  for (const r of rows) {
    if (!activeMap[r.lineageId]) activeMap[r.lineageId] = r.id;
  }
  await db
    .update(workspaceTable)
    .set({ activeVersionByLineage: activeMap, updatedAt: new Date() })
    .where(eq(workspaceTable.id, WORKSPACE_ID));
}

async function ensureSeedPreferences(): Promise<void> {
  const present = await db
    .select({ id: preferencesTable.id })
    .from(preferencesTable)
    .where(eq(preferencesTable.workspaceId, WORKSPACE_ID))
    .limit(1);
  if (present.length > 0) return;

  await db.insert(preferencesTable).values(
    SEED_PREFERENCES.map((p) => ({
      id: p.id,
      workspaceId: WORKSPACE_ID,
      person: p.person,
      category: p.category,
      text: p.text,
      weight: p.weight,
    }))
  );
}

async function getWorkspaceRow() {
  const rows = await db
    .select()
    .from(workspaceTable)
    .where(eq(workspaceTable.id, WORKSPACE_ID))
    .limit(1);
  return rows[0];
}

// ---------------------------------------------------------------------------
// READ: assemble the full WorkspaceState for a profile.
// ---------------------------------------------------------------------------
export async function loadWorkspaceState(
  profileId: ProfileId = DEFAULT_PROFILE_ID
): Promise<WorkspaceState> {
  await ensureWorkspace();
  await ensureSeedVersions();
  await ensureSeedPreferences();

  const [ws, versionRows, feedbackRows, favoriteRows, decisionRows, prefRows] =
    await Promise.all([
      getWorkspaceRow(),
      db
        .select()
        .from(planVersionsTable)
        .where(eq(planVersionsTable.workspaceId, WORKSPACE_ID)),
      db
        .select()
        .from(feedbackTable)
        .where(
          and(
            eq(feedbackTable.workspaceId, WORKSPACE_ID),
            eq(feedbackTable.profileId, profileId)
          )
        ),
      db
        .select()
        .from(favoritesTable)
        .where(
          and(
            eq(favoritesTable.workspaceId, WORKSPACE_ID),
            eq(favoritesTable.profileId, profileId)
          )
        ),
      db
        .select()
        .from(destinationDecisionsTable)
        .where(
          and(
            eq(destinationDecisionsTable.workspaceId, WORKSPACE_ID),
            eq(destinationDecisionsTable.profileId, profileId)
          )
        ),
      db
        .select()
        .from(preferencesTable)
        .where(eq(preferencesTable.workspaceId, WORKSPACE_ID)),
    ]);

  const versions: PlanVersion[] = versionRows.map((r) => ({
    id: r.id,
    lineageId: r.lineageId,
    label: r.label,
    kind: r.kind,
    createdAt: (r.createdAt as Date).toISOString(),
    plan: r.plan,
    changeSummary: r.changeSummary ?? undefined,
    parentVersionId: r.parentVersionId ?? undefined,
  }));

  const feedback: Record<string, ActivityFeedback> = {};
  for (const r of feedbackRows) {
    feedback[r.activityId] = {
      status: (r.status ?? null) as FeedbackStatus,
      note: r.note ?? undefined,
      updatedAt: (r.updatedAt as Date).toISOString(),
    };
  }

  const destinationDecisions: Record<string, DestinationDecision> = {};
  for (const r of decisionRows) {
    destinationDecisions[r.destinationId] = {
      status: r.status as DestinationDecisionStatus,
      note: r.note ?? undefined,
      updatedAt: (r.updatedAt as Date).toISOString(),
    };
  }

  const preferences: Preference[] = prefRows.map((r) => ({
    id: r.id,
    person: r.person,
    category: r.category,
    text: r.text,
    weight: r.weight,
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    versions,
    activeVersionByLineage: ws?.activeVersionByLineage ?? {},
    favoriteIds: favoriteRows.map((r) => r.lineageId),
    feedback,
    destinationDecisions,
    preferences,
    activeDateOptionId: ws?.activeDateOptionId ?? DATE_OPTIONS[0].id,
    northStar: ws?.northStar ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// MUTATIONS (row-level). Each touches exactly the rows it needs.
// ---------------------------------------------------------------------------

export async function setFeedbackRow(
  profileId: ProfileId,
  activityId: string,
  status: FeedbackStatus,
  note?: string
): Promise<void> {
  if (status === null) {
    await db
      .delete(feedbackTable)
      .where(
        and(
          eq(feedbackTable.workspaceId, WORKSPACE_ID),
          eq(feedbackTable.profileId, profileId),
          eq(feedbackTable.activityId, activityId)
        )
      );
    return;
  }
  await db
    .insert(feedbackTable)
    .values({
      workspaceId: WORKSPACE_ID,
      profileId,
      activityId,
      status,
      note: note ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        feedbackTable.workspaceId,
        feedbackTable.profileId,
        feedbackTable.activityId,
      ],
      set: { status, note: note ?? null, updatedAt: new Date() },
    });
}

export async function setFavoriteRow(
  profileId: ProfileId,
  lineageId: string,
  isFavorite: boolean
): Promise<void> {
  if (isFavorite) {
    await db
      .insert(favoritesTable)
      .values({ workspaceId: WORKSPACE_ID, profileId, lineageId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.workspaceId, WORKSPACE_ID),
          eq(favoritesTable.profileId, profileId),
          eq(favoritesTable.lineageId, lineageId)
        )
      );
  }
}

export async function setDestinationDecisionRow(
  profileId: ProfileId,
  destinationId: string,
  status: DestinationDecisionStatus | null,
  note?: string
): Promise<void> {
  if (status === null) {
    await db
      .delete(destinationDecisionsTable)
      .where(
        and(
          eq(destinationDecisionsTable.workspaceId, WORKSPACE_ID),
          eq(destinationDecisionsTable.profileId, profileId),
          eq(destinationDecisionsTable.destinationId, destinationId)
        )
      );
    return;
  }
  await db
    .insert(destinationDecisionsTable)
    .values({
      workspaceId: WORKSPACE_ID,
      profileId,
      destinationId,
      status,
      note: note ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        destinationDecisionsTable.workspaceId,
        destinationDecisionsTable.profileId,
        destinationDecisionsTable.destinationId,
      ],
      set: { status, note: note ?? null, updatedAt: new Date() },
    });
}

// Insert a new plan version (revision/hybrid/custom or new lineage) and move
// the active pointer to it.
export async function insertVersionRow(version: PlanVersion): Promise<void> {
  await db.insert(planVersionsTable).values({
    id: version.id,
    workspaceId: WORKSPACE_ID,
    lineageId: version.lineageId,
    label: version.label,
    kind: version.kind,
    plan: version.plan,
    changeSummary: version.changeSummary ?? null,
    parentVersionId: version.parentVersionId ?? null,
    createdAt: new Date(version.createdAt),
  });

  const ws = await getWorkspaceRow();
  const activeMap = { ...(ws?.activeVersionByLineage ?? {}) };
  activeMap[version.lineageId] = version.id;
  await db
    .update(workspaceTable)
    .set({ activeVersionByLineage: activeMap, updatedAt: new Date() })
    .where(eq(workspaceTable.id, WORKSPACE_ID));
}

export async function setActiveVersionRow(
  lineageId: string,
  versionId: string
): Promise<void> {
  const ws = await getWorkspaceRow();
  const activeMap = { ...(ws?.activeVersionByLineage ?? {}) };
  activeMap[lineageId] = versionId;
  await db
    .update(workspaceTable)
    .set({ activeVersionByLineage: activeMap, updatedAt: new Date() })
    .where(eq(workspaceTable.id, WORKSPACE_ID));
}

export async function setDateOptionRow(dateOptionId: string): Promise<void> {
  await db
    .update(workspaceTable)
    .set({ activeDateOptionId: dateOptionId, updatedAt: new Date() })
    .where(eq(workspaceTable.id, WORKSPACE_ID));
}

export async function setNorthStarRow(northStar: string | null): Promise<void> {
  await db
    .update(workspaceTable)
    .set({ northStar, updatedAt: new Date() })
    .where(eq(workspaceTable.id, WORKSPACE_ID));
}

export async function addPreferenceRow(pref: Preference): Promise<void> {
  await db.insert(preferencesTable).values({
    id: pref.id,
    workspaceId: WORKSPACE_ID,
    person: pref.person,
    category: pref.category,
    text: pref.text,
    weight: pref.weight,
  });
}

export async function updatePreferenceRow(
  id: string,
  patch: Partial<Pick<Preference, "person" | "category" | "text" | "weight">>
): Promise<void> {
  await db
    .update(preferencesTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(preferencesTable.id, id),
        eq(preferencesTable.workspaceId, WORKSPACE_ID)
      )
    );
}

export async function removePreferenceRow(id: string): Promise<void> {
  await db
    .delete(preferencesTable)
    .where(
      and(
        eq(preferencesTable.id, id),
        eq(preferencesTable.workspaceId, WORKSPACE_ID)
      )
    );
}

// ---------------------------------------------------------------------------
// Data-safety: hydrate local user-data into an EMPTY server workspace only.
// Returns true if hydration was performed.
// ---------------------------------------------------------------------------
export async function isUserDataEmpty(
  profileId: ProfileId = DEFAULT_PROFILE_ID
): Promise<boolean> {
  const [fb, fav, dec, customVersions] = await Promise.all([
    db
      .select({ activityId: feedbackTable.activityId })
      .from(feedbackTable)
      .where(
        and(
          eq(feedbackTable.workspaceId, WORKSPACE_ID),
          eq(feedbackTable.profileId, profileId)
        )
      )
      .limit(1),
    db
      .select({ lineageId: favoritesTable.lineageId })
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.workspaceId, WORKSPACE_ID),
          eq(favoritesTable.profileId, profileId)
        )
      )
      .limit(1),
    db
      .select({ destinationId: destinationDecisionsTable.destinationId })
      .from(destinationDecisionsTable)
      .where(
        and(
          eq(destinationDecisionsTable.workspaceId, WORKSPACE_ID),
          eq(destinationDecisionsTable.profileId, profileId)
        )
      )
      .limit(1),
    db
      .select({ id: planVersionsTable.id })
      .from(planVersionsTable)
      .where(
        and(
          eq(planVersionsTable.workspaceId, WORKSPACE_ID),
          eq(planVersionsTable.kind, "original" as VersionKind)
        )
      ),
  ]);

  // "Empty" = no user feedback, no favorites, no destination decisions. We don't
  // gate on plan_versions here because seeds are always present; custom versions
  // are migrated separately below.
  void customVersions;
  return fb.length === 0 && fav.length === 0 && dec.length === 0;
}

export async function hydrateFromLocalState(
  local: WorkspaceState,
  profileId: ProfileId = DEFAULT_PROFILE_ID
): Promise<boolean> {
  await ensureWorkspace();
  await ensureSeedVersions();
  await ensureSeedPreferences();

  // NEVER overwrite a non-empty server workspace.
  if (!(await isUserDataEmpty(profileId))) return false;

  // 1) Feedback
  const fbEntries = Object.entries(local.feedback ?? {});
  if (fbEntries.length > 0) {
    await db
      .insert(feedbackTable)
      .values(
        fbEntries
          .filter(([, f]) => f.status !== null)
          .map(([activityId, f]) => ({
            workspaceId: WORKSPACE_ID,
            profileId,
            activityId,
            status: f.status,
            note: f.note ?? null,
            updatedAt: new Date(f.updatedAt ?? Date.now()),
          }))
      )
      .onConflictDoNothing();
  }

  // 2) Favorites
  if ((local.favoriteIds ?? []).length > 0) {
    await db
      .insert(favoritesTable)
      .values(
        local.favoriteIds.map((lineageId) => ({
          workspaceId: WORKSPACE_ID,
          profileId,
          lineageId,
        }))
      )
      .onConflictDoNothing();
  }

  // 3) Destination decisions (may not exist in legacy local state)
  const decEntries = Object.entries(local.destinationDecisions ?? {});
  if (decEntries.length > 0) {
    await db
      .insert(destinationDecisionsTable)
      .values(
        decEntries.map(([destinationId, d]) => ({
          workspaceId: WORKSPACE_ID,
          profileId,
          destinationId,
          status: d.status,
          note: d.note ?? null,
          updatedAt: new Date(d.updatedAt ?? Date.now()),
        }))
      )
      .onConflictDoNothing();
  }

  // 4) Custom (non-original) versions the user built locally.
  const customVersions = (local.versions ?? []).filter(
    (v) => v.kind !== "original"
  );
  if (customVersions.length > 0) {
    await db
      .insert(planVersionsTable)
      .values(
        customVersions.map((v) => ({
          id: v.id,
          workspaceId: WORKSPACE_ID,
          lineageId: v.lineageId,
          label: v.label,
          kind: v.kind,
          plan: v.plan,
          changeSummary: v.changeSummary ?? null,
          parentVersionId: v.parentVersionId ?? null,
          createdAt: new Date(v.createdAt),
        }))
      )
      .onConflictDoNothing();
  }

  // 5) Merge active pointers + northStar + active date option from local.
  const ws = await getWorkspaceRow();
  const activeMap = { ...(local.activeVersionByLineage ?? {}), ...(ws?.activeVersionByLineage ?? {}) };
  await db
    .update(workspaceTable)
    .set({
      activeVersionByLineage: activeMap,
      activeDateOptionId: local.activeDateOptionId ?? ws?.activeDateOptionId,
      northStar: local.northStar ?? ws?.northStar ?? null,
      updatedAt: new Date(),
    })
    .where(eq(workspaceTable.id, WORKSPACE_ID));

  return true;
}

// ---------------------------------------------------------------------------
// Reset (user-initiated): clear this workspace and reseed.
// ---------------------------------------------------------------------------
export async function resetWorkspaceData(): Promise<WorkspaceState> {
  await db.delete(feedbackTable).where(eq(feedbackTable.workspaceId, WORKSPACE_ID));
  await db.delete(favoritesTable).where(eq(favoritesTable.workspaceId, WORKSPACE_ID));
  await db
    .delete(destinationDecisionsTable)
    .where(eq(destinationDecisionsTable.workspaceId, WORKSPACE_ID));
  await db.delete(planVersionsTable).where(eq(planVersionsTable.workspaceId, WORKSPACE_ID));
  await db.delete(preferencesTable).where(eq(preferencesTable.workspaceId, WORKSPACE_ID));
  await db
    .update(workspaceTable)
    .set({
      activeVersionByLineage: {},
      activeDateOptionId: DATE_OPTIONS[0].id,
      northStar: null,
      updatedAt: new Date(),
    })
    .where(eq(workspaceTable.id, WORKSPACE_ID));

  return loadWorkspaceState();
}
