// src/storage/tripStore.ts
//
// Persistence boundary for the planning workspace.
//
// Everything the app saves goes through TripStore. Today it is backed by
// localStorage; to move to Supabase/Postgres later, implement the same
// TripStore interface against your DB and swap the export at the bottom —
// no component or hook needs to change.

import { SEED_PLANS } from "@/lib/seedPlans";
import { DATE_OPTIONS, SEED_PREFERENCES } from "@/lib/seedConfig";
import type { PlanVersion, TripPlan, WorkspaceState } from "@/lib/types";

const STORAGE_KEY = "sea-trip-planner:v1";
const SCHEMA_VERSION = 1;

export interface TripStore {
  load(): WorkspaceState;
  save(state: WorkspaceState): void;
  reset(): WorkspaceState;
}

function originalVersionFromSeed(plan: TripPlan): PlanVersion {
  return {
    id: `${plan.id}::v0`,
    lineageId: plan.id,
    label: "Original",
    kind: "original",
    createdAt: new Date(0).toISOString(),
    plan,
  };
}

export function buildDefaultState(): WorkspaceState {
  const versions = SEED_PLANS.map(originalVersionFromSeed);
  const activeVersionByLineage: Record<string, string> = {};
  versions.forEach((v) => {
    activeVersionByLineage[v.lineageId] = v.id;
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    versions,
    activeVersionByLineage,
    favoriteIds: [],
    feedback: {},
    destinationDecisions: {},
    preferences: SEED_PREFERENCES,
    activeDateOptionId: DATE_OPTIONS[0].id,
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Ensure any seed lineages that didn't exist when the state was first saved
 * get added. Keeps the library complete if you add new seed plans in a release.
 */
function reconcileSeeds(state: WorkspaceState): WorkspaceState {
  const known = new Set(state.versions.map((v) => v.lineageId));
  const missing = SEED_PLANS.filter((p) => !known.has(p.id));
  if (missing.length === 0) return state;

  const added = missing.map(originalVersionFromSeed);
  const activeVersionByLineage = { ...state.activeVersionByLineage };
  added.forEach((v) => {
    activeVersionByLineage[v.lineageId] = v.id;
  });
  return {
    ...state,
    versions: [...state.versions, ...added],
    activeVersionByLineage,
  };
}

class LocalStorageTripStore implements TripStore {
  load(): WorkspaceState {
    if (!isBrowser()) return buildDefaultState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = buildDefaultState();
        this.save(fresh);
        return fresh;
      }
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (!parsed.schemaVersion || parsed.schemaVersion !== SCHEMA_VERSION) {
        // Future: run migrations here. For now, fall back to a clean seed.
        const fresh = buildDefaultState();
        this.save(fresh);
        return fresh;
      }
      return reconcileSeeds(parsed);
    } catch {
      return buildDefaultState();
    }
  }

  save(state: WorkspaceState): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota or serialization failure — fail quiet; the UI keeps its in-memory copy.
    }
  }

  reset(): WorkspaceState {
    const fresh = buildDefaultState();
    this.save(fresh);
    return fresh;
  }
}

// Legacy single-device store. Neon is now the source of truth (see
// remoteTripStore.ts); this remains only as an OFFLINE fallback used by
// buildDefaultState() and for the one-time local->server migration below.
export const tripStore: TripStore = new LocalStorageTripStore();

// ---------------------------------------------------------------------------
// Client-side cache + migration helpers (Phase 1).
//
// Roles after the Neon migration:
//   - ":v3"  = optimistic cache of the server-authoritative WorkspaceState.
//   - ":v2"/":v1" = legacy single-device data, read ONCE to hydrate an empty
//                   server workspace, then left untouched.
//   - ":hydrated" flag = set after a successful first sync so we never
//                        re-hydrate.
// ---------------------------------------------------------------------------

const CACHE_KEY = "sea-trip-planner:v3";
const LEGACY_KEYS = ["sea-trip-planner:v2", "sea-trip-planner:v1"];
const HYDRATED_FLAG = "sea-trip-planner:hydrated";

/** Read the optimistic cache of server state (used as SWR fallbackData). */
export function readCachedState(): WorkspaceState | undefined {
  if (!isBrowser()) return undefined;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as WorkspaceState) : undefined;
  } catch {
    return undefined;
  }
}

/** Persist the latest server-authoritative state as the optimistic cache. */
export function writeCachedState(state: WorkspaceState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // Quota/serialization failure — non-fatal; in-memory copy still serves the UI.
  }
}

/** Read legacy single-device data (v2 then v1) for one-time migration. */
export function readLegacyLocalState(): WorkspaceState | undefined {
  if (!isBrowser()) return undefined;
  for (const key of LEGACY_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as WorkspaceState;
      // Normalize older shapes missing newer fields.
      return {
        ...parsed,
        destinationDecisions: parsed.destinationDecisions ?? {},
        favoriteIds: parsed.favoriteIds ?? [],
        feedback: parsed.feedback ?? {},
        versions: parsed.versions ?? [],
        activeVersionByLineage: parsed.activeVersionByLineage ?? {},
      };
    } catch {
      // try next key
    }
  }
  return undefined;
}

/** True once a successful first local->server sync has been recorded. */
export function hasHydratedToServer(): boolean {
  if (!isBrowser()) return true; // never attempt on server
  try {
    return window.localStorage.getItem(HYDRATED_FLAG) === "1";
  } catch {
    return true;
  }
}

/** Mark the one-time local->server migration as complete. */
export function markHydratedToServer(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(HYDRATED_FLAG, "1");
  } catch {
    // non-fatal
  }
}

/** Does the legacy local state carry user-authored data worth migrating? */
export function legacyStateHasUserData(state: WorkspaceState | undefined): boolean {
  if (!state) return false;
  const hasFeedback = Object.keys(state.feedback ?? {}).length > 0;
  const hasFavorites = (state.favoriteIds ?? []).length > 0;
  const hasDecisions = Object.keys(state.destinationDecisions ?? {}).length > 0;
  const hasCustomVersions = (state.versions ?? []).some((v) => v.kind !== "original");
  return hasFeedback || hasFavorites || hasDecisions || hasCustomVersions;
}
