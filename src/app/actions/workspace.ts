"use server";

// src/app/actions/workspace.ts
//
// Server Actions are the ONLY write path from the client. Each one performs a
// single row-level mutation (never a whole-blob save) and returns void or the
// freshly assembled state. Reads go through `getWorkspaceStateAction` (used as
// the SWR fetcher) or RSC.
//
// Phase 1: the acting profile is the default constant. Phase 2 replaces
// `currentProfile()` with a session->membership lookup; no call sites change.

import {
  addPreferenceRow,
  hydrateFromLocalState,
  insertVersionRow,
  isUserDataEmpty,
  loadWorkspaceState,
  removePreferenceRow,
  resetWorkspaceData,
  setActiveVersionRow,
  setDateOptionRow,
  setDestinationDecisionRow,
  setFavoriteRow,
  setFeedbackRow,
  setNorthStarRow,
  updatePreferenceRow,
} from "@/storage/remoteTripStore";
import { requireProfileId } from "@/lib/membership";
import { PROFILE_IDS, PROFILE_LABELS } from "@/lib/workspaceConfig";
import type {
  DestinationDecisionStatus,
  FeedbackStatus,
  LLMPlanRequest,
  PlanVersion,
  Preference,
  ProfileFeedbackBundle,
  ProfileId,
  TripPlan,
  WorkspaceState,
} from "@/lib/types";

// Phase 2: the acting profile is derived from the session -> membership row.
// Throws "Unauthorized" if there is no valid session/membership, which gates
// every mutation and the workspace read below.
async function currentProfile(): Promise<ProfileId> {
  return requireProfileId();
}

export async function getWorkspaceStateAction(): Promise<WorkspaceState> {
  const profileId = await currentProfile();
  return loadWorkspaceState(profileId);
}

// Phase 3: assemble the couples-synthesis payload. Reads BOTH partners'
// favorites + feedback server-side (the client only ever loads its own
// profile's data) and resolves each favorited lineage to its active plan.
// Returns a ready-to-POST LLMPlanRequest; the AI call itself happens in the
// /api/plan-assistant route so secrets stay server-side either way.
export async function buildCouplesPayloadAction(): Promise<LLMPlanRequest> {
  // Gate: must be an authenticated member of the workspace.
  await currentProfile();

  const bundles: ProfileFeedbackBundle[] = [];
  let preferences: Preference[] = [];
  let dateOptionId = "";

  for (const profileId of PROFILE_IDS) {
    const state = await loadWorkspaceState(profileId);
    preferences = state.preferences; // workspace-scoped; same for both
    dateOptionId = state.activeDateOptionId;

    // Resolve this profile's favorited lineages to their active TripPlan.
    const favoritePlans: TripPlan[] = state.favoriteIds
      .map((lineageId) => {
        const activeId = state.activeVersionByLineage[lineageId];
        const lineageVersions = state.versions.filter((v) => v.lineageId === lineageId);
        const chosen =
          lineageVersions.find((v) => v.id === activeId) ??
          lineageVersions.find((v) => v.kind === "original") ??
          lineageVersions[0];
        return chosen?.plan ?? null;
      })
      .filter((p): p is TripPlan => Boolean(p));

    bundles.push({
      profileId,
      displayName: PROFILE_LABELS[profileId],
      favoritePlans,
      feedback: state.feedback,
    });
  }

  // Union of both partners' favorites — used by the mock fallback.
  const allFavorites = bundles.flatMap((b) => b.favoritePlans);

  return {
    type: "synthesize-itinerary",
    couplesFeedback: bundles,
    favoritePlans: allFavorites,
    preferences,
    dateOptionId,
  };
}

export async function setFeedbackAction(
  activityId: string,
  status: FeedbackStatus,
  note?: string
): Promise<void> {
  await setFeedbackRow(await currentProfile(), activityId, status, note);
}

export async function toggleFavoriteAction(
  lineageId: string,
  isFavorite: boolean
): Promise<void> {
  await setFavoriteRow(await currentProfile(), lineageId, isFavorite);
}

export async function setDestinationDecisionAction(
  destinationId: string,
  status: DestinationDecisionStatus | null,
  note?: string
): Promise<void> {
  await setDestinationDecisionRow(await currentProfile(), destinationId, status, note);
}

export async function saveVersionAction(version: PlanVersion): Promise<void> {
  await insertVersionRow(version);
}

export async function setActiveVersionAction(
  lineageId: string,
  versionId: string
): Promise<void> {
  await setActiveVersionRow(lineageId, versionId);
}

export async function setDateOptionAction(dateOptionId: string): Promise<void> {
  await setDateOptionRow(dateOptionId);
}

export async function setNorthStarAction(northStar: string | null): Promise<void> {
  await setNorthStarRow(northStar);
}

export async function addPreferenceAction(pref: Preference): Promise<void> {
  await addPreferenceRow(pref);
}

export async function updatePreferenceAction(
  id: string,
  patch: Partial<Pick<Preference, "person" | "category" | "text" | "weight">>
): Promise<void> {
  await updatePreferenceRow(id, patch);
}

export async function removePreferenceAction(id: string): Promise<void> {
  await removePreferenceRow(id);
}

export async function resetWorkspaceAction(): Promise<WorkspaceState> {
  return resetWorkspaceData();
}

// Data-safety: only writes if the server workspace has no user data yet.
export async function hydrateFromLocalAction(
  local: WorkspaceState
): Promise<{ hydrated: boolean; state: WorkspaceState }> {
  const profileId = await currentProfile();
  const hydrated = await hydrateFromLocalState(local, profileId);
  const state = await loadWorkspaceState(profileId);
  return { hydrated, state };
}

export async function isServerEmptyAction(): Promise<boolean> {
  return isUserDataEmpty(await currentProfile());
}
