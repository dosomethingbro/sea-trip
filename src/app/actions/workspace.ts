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
import type {
  DestinationDecisionStatus,
  FeedbackStatus,
  PlanVersion,
  Preference,
  ProfileId,
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
