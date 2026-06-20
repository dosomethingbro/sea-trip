// src/hooks/useWorkspace.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  readCachedState,
  writeCachedState,
  readLegacyLocalState,
  hasHydratedToServer,
  markHydratedToServer,
  legacyStateHasUserData,
} from "@/storage/tripStore";
import {
  getWorkspaceStateAction,
  setFeedbackAction,
  toggleFavoriteAction,
  setDestinationDecisionAction,
  saveVersionAction,
  setActiveVersionAction,
  setDateOptionAction,
  setNorthStarAction,
  addPreferenceAction,
  updatePreferenceAction,
  removePreferenceAction,
  resetWorkspaceAction,
  hydrateFromLocalAction,
} from "@/app/actions/workspace";
import { DATE_OPTIONS } from "@/lib/seedConfig";
import type {
  ActivityFeedback,
  DestinationDecision,
  DestinationDecisionStatus,
  FeedbackStatus,
  HybridPlanSelection,
  PlanVersion,
  Preference,
  TripPlan,
  VersionKind,
  WorkspaceState,
} from "@/lib/types";

export interface Lineage {
  lineageId: string;
  versions: PlanVersion[];
  activeVersion: PlanVersion;
  activePlan: TripPlan;
  isFavorite: boolean;
}

const SWR_KEY = "workspace";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useWorkspace() {
  // Optimistic cache of the server-authoritative state seeds the first paint.
  const [fallback] = useState<WorkspaceState | undefined>(() => readCachedState());

  const { data, mutate, isLoading } = useSWR<WorkspaceState>(
    SWR_KEY,
    getWorkspaceStateAction,
    {
      fallbackData: fallback,
      revalidateOnFocus: true, // partner updates: refetch on focus
      revalidateOnReconnect: true,
    }
  );

  const state = data ?? null;
  const ready = data != null;

  // Persist server-authoritative state to the optimistic cache (":v3").
  useEffect(() => {
    if (data) writeCachedState(data);
  }, [data]);

  // One-time data-safety migration: push legacy local data to the server ONLY
  // if the server workspace has no user data yet. Never overwrites the server.
  const migrationRef = useRef(false);
  useEffect(() => {
    if (migrationRef.current) return;
    if (!data) return; // wait for first server load
    migrationRef.current = true;

    if (hasHydratedToServer()) return;

    const serverHasUserData = legacyStateHasUserData(data);
    const legacy = readLegacyLocalState();

    if (!serverHasUserData && legacyStateHasUserData(legacy)) {
      hydrateFromLocalAction(legacy as WorkspaceState)
        .then(({ state: synced }) => {
          markHydratedToServer();
          return mutate(synced, { revalidate: false });
        })
        .catch(() => {
          // Allow a retry on a later mount if the sync failed.
          migrationRef.current = false;
        });
    } else {
      // Nothing to migrate (or server already has data) — record completion.
      markHydratedToServer();
    }
  }, [data, mutate]);

  // Optimistic mutation runner: apply locally, write the row server-side, then
  // adopt the freshly assembled server state. Rolls back on error.
  const runMutation = useCallback(
    (
      optimistic: (prev: WorkspaceState) => WorkspaceState,
      serverCall: () => Promise<unknown>
    ) => {
      void mutate(
        async () => {
          await serverCall();
          return getWorkspaceStateAction();
        },
        {
          optimisticData: (prev?: WorkspaceState) =>
            prev ? optimistic(prev) : (prev as unknown as WorkspaceState),
          rollbackOnError: true,
          revalidate: false,
        }
      ).catch(() => {
        // Swallow: SWR already rolled the cache back to the prior state.
      });
    },
    [mutate]
  );

  // ----- Derived: lineages (one per plan family) -----
  const lineages: Lineage[] = useMemo(() => {
    if (!state) return [];
    const byLineage = new Map<string, PlanVersion[]>();
    for (const v of state.versions) {
      const arr = byLineage.get(v.lineageId) ?? [];
      arr.push(v);
      byLineage.set(v.lineageId, arr);
    }
    const out: Lineage[] = [];
    for (const [lineageId, versions] of byLineage) {
      const sorted = [...versions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const activeId = state.activeVersionByLineage[lineageId] ?? sorted[0].id;
      const activeVersion = sorted.find((v) => v.id === activeId) ?? sorted[0];
      out.push({
        lineageId,
        versions: sorted,
        activeVersion,
        activePlan: activeVersion.plan,
        isFavorite: state.favoriteIds.includes(lineageId),
      });
    }
    // Seeds first (stable order), then user-created lineages by first version time.
    return out.sort((a, b) => {
      const aSeed = a.versions[0].kind === "original";
      const bSeed = b.versions[0].kind === "original";
      if (aSeed !== bSeed) return aSeed ? -1 : 1;
      return a.versions[0].createdAt.localeCompare(b.versions[0].createdAt);
    });
  }, [state]);

  const favoriteLineages = useMemo(() => lineages.filter((l) => l.isFavorite), [lineages]);

  const activeDateOption = useMemo(
    () => DATE_OPTIONS.find((d) => d.id === state?.activeDateOptionId) ?? DATE_OPTIONS[0],
    [state?.activeDateOptionId]
  );

  // ----- Actions (identical signatures to the pre-Neon hook) -----
  const toggleFavorite = useCallback(
    (lineageId: string) => {
      const has = state?.favoriteIds.includes(lineageId) ?? false;
      runMutation(
        (prev) => ({
          ...prev,
          favoriteIds: has
            ? prev.favoriteIds.filter((id) => id !== lineageId)
            : [...prev.favoriteIds, lineageId],
        }),
        () => toggleFavoriteAction(lineageId, !has)
      );
    },
    [state, runMutation]
  );

  const setFeedback = useCallback(
    (activityId: string, status: FeedbackStatus, note?: string) => {
      const existing = state?.feedback[activityId];
      // Clicking the same status again clears it (same UX as before).
      const clearing = existing?.status === status && note === undefined;
      const nextStatus: FeedbackStatus = clearing ? null : status;

      runMutation(
        (prev) => {
          const next: Record<string, ActivityFeedback> = { ...prev.feedback };
          if (clearing) {
            delete next[activityId];
          } else {
            next[activityId] = {
              status,
              note: note !== undefined ? note : existing?.note,
              updatedAt: new Date().toISOString(),
            };
          }
          return { ...prev, feedback: next };
        },
        () =>
          setFeedbackAction(
            activityId,
            nextStatus,
            note !== undefined ? note : existing?.note
          )
      );
    },
    [state, runMutation]
  );

  const setDestinationDecision = useCallback(
    (destinationId: string, status: DestinationDecisionStatus, note?: string) => {
      const existing = state?.destinationDecisions?.[destinationId];
      const clearing = existing?.status === status && note === undefined;
      const nextStatus: DestinationDecisionStatus | null = clearing ? null : status;

      runMutation(
        (prev) => {
          const next: Record<string, DestinationDecision> = {
            ...(prev.destinationDecisions ?? {}),
          };
          if (clearing) {
            delete next[destinationId];
          } else {
            next[destinationId] = {
              status,
              note: note !== undefined ? note : existing?.note,
              updatedAt: new Date().toISOString(),
            };
          }
          return { ...prev, destinationDecisions: next };
        },
        () =>
          setDestinationDecisionAction(
            destinationId,
            nextStatus,
            note !== undefined ? note : existing?.note
          )
      );
    },
    [state, runMutation]
  );

  const setActiveVersion = useCallback(
    (lineageId: string, versionId: string) => {
      runMutation(
        (prev) => ({
          ...prev,
          activeVersionByLineage: { ...prev.activeVersionByLineage, [lineageId]: versionId },
        }),
        () => setActiveVersionAction(lineageId, versionId)
      );
    },
    [runMutation]
  );

  const setDateOption = useCallback(
    (id: string) => {
      runMutation(
        (prev) => ({ ...prev, activeDateOptionId: id }),
        () => setDateOptionAction(id)
      );
    },
    [runMutation]
  );

  const setNorthStar = useCallback(
    (text: string) => {
      const value = text.trim() ? text : "";
      runMutation(
        (prev) => ({ ...prev, northStar: value || undefined }),
        () => setNorthStarAction(value || null)
      );
    },
    [runMutation]
  );

  // Save a plan as a new version of an existing lineage (AI revision, custom).
  const saveVersion = useCallback(
    (lineageId: string, plan: TripPlan, kind: VersionKind, changeSummary?: string) => {
      const existing = state?.versions.filter((v) => v.lineageId === lineageId) ?? [];
      const revisionCount = existing.filter((v) => v.kind === "ai-revision").length;
      const label =
        kind === "ai-revision"
          ? `AI Revision ${revisionCount + 1}`
          : kind === "hybrid"
          ? "Custom Hybrid"
          : "Custom Edit";
      const version: PlanVersion = {
        id: uid("ver"),
        lineageId,
        label,
        kind,
        createdAt: new Date().toISOString(),
        plan: { ...plan, id: uid("plan") },
        changeSummary,
      };
      runMutation(
        (prev) => ({
          ...prev,
          versions: [...prev.versions, version],
          activeVersionByLineage: { ...prev.activeVersionByLineage, [lineageId]: version.id },
        }),
        () => saveVersionAction(version)
      );
    },
    [state, runMutation]
  );

  // Create a brand-new lineage (hybrid build from scratch). Returns lineageId
  // synchronously so callers can navigate to it immediately.
  const createLineage = useCallback(
    (plan: TripPlan, kind: VersionKind = "hybrid", changeSummary?: string) => {
      const lineageId = uid("lineage");
      const version: PlanVersion = {
        id: uid("ver"),
        lineageId,
        label: kind === "hybrid" ? "Custom Hybrid" : "Original",
        kind,
        createdAt: new Date().toISOString(),
        plan: { ...plan, id: uid("plan"), seed: false },
        changeSummary,
      };
      runMutation(
        (prev) => ({
          ...prev,
          versions: [...prev.versions, version],
          activeVersionByLineage: { ...prev.activeVersionByLineage, [lineageId]: version.id },
        }),
        () => saveVersionAction(version)
      );
      return lineageId;
    },
    [runMutation]
  );

  const addPreference = useCallback(
    (pref: Omit<Preference, "id">) => {
      const full: Preference = { ...pref, id: uid("pref") };
      runMutation(
        (prev) => ({ ...prev, preferences: [...prev.preferences, full] }),
        () => addPreferenceAction(full)
      );
    },
    [runMutation]
  );

  const updatePreference = useCallback(
    (id: string, patch: Partial<Preference>) => {
      runMutation(
        (prev) => ({
          ...prev,
          preferences: prev.preferences.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
        () => {
          const rest = { ...patch };
          delete (rest as { id?: string }).id;
          return updatePreferenceAction(id, rest);
        }
      );
    },
    [runMutation]
  );

  const removePreference = useCallback(
    (id: string) => {
      runMutation(
        (prev) => ({ ...prev, preferences: prev.preferences.filter((p) => p.id !== id) }),
        () => removePreferenceAction(id)
      );
    },
    [runMutation]
  );

  const resetWorkspace = useCallback(() => {
    void mutate(async () => resetWorkspaceAction(), { revalidate: false }).catch(() => {});
  }, [mutate]);

  // Build a hybrid TripPlan from selected days across plans (pure, unchanged).
  const buildHybridPlan = useCallback(
    (selection: HybridPlanSelection): TripPlan | null => {
      if (!state || selection.picks.length === 0) return null;
      const planById = new Map<string, TripPlan>();
      for (const v of state.versions) planById.set(v.plan.id, v.plan);

      const days = selection.picks
        .map((pick) => {
          const plan = planById.get(pick.sourcePlanId);
          return plan?.days.find((d) => d.id === pick.dayId) ?? null;
        })
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .map((d, i) => ({ ...d, id: `${d.id}-h${i}`, dayNumber: i + 1 }));

      if (days.length === 0) return null;

      const route = Array.from(new Set(days.map((d) => d.destination)));
      const countries = Array.from(new Set(days.map((d) => d.country)));
      const sourcePlans = Array.from(new Set(selection.picks.map((p) => p.sourcePlanId)))
        .map((id) => planById.get(id))
        .filter((p): p is TripPlan => !!p);

      // Average the contributing plans' scores as a starting point.
      const avg = (key: keyof TripPlan["scores"]) =>
        Math.round(sourcePlans.reduce((s, p) => s + p.scores[key], 0) / sourcePlans.length);

      const hybrid: TripPlan = {
        id: uid("plan"),
        title: selection.title || `Hybrid: ${route.join(" → ")}`,
        route,
        countries,
        durationDays: days.length,
        ptoDays: activeDateOption.ptoDays,
        ptoEfficiency: avg("coreMemory"),
        vibeTags: Array.from(new Set(sourcePlans.flatMap((p) => p.vibeTags))).slice(0, 6),
        logisticsDifficulty: countries.length >= 2 ? "moderate" : "easy",
        transferBurden: `${countries.length} countr${countries.length > 1 ? "ies" : "y"}, hand-assembled route`,
        scores: {
          lucasFit: avg("lucasFit"),
          girlfriendFit: avg("girlfriendFit"),
          culture: avg("culture"),
          relaxation: avg("relaxation"),
          food: avg("food"),
          history: avg("history"),
          nature: avg("nature"),
          coreMemory: avg("coreMemory"),
        },
        pros: ["Hand-built from your favorite days", "Only the stops you actually wanted"],
        cons: ["Transfers between hand-picked stops need a real logistics check"],
        whyChoose: "You assembled this yourself from the best days across plans.",
        whySkip: "Skip if the stitched-together route creates awkward connections.",
        destinations: route.map((name) => {
          const src = sourcePlans
            .flatMap((p) => p.destinations)
            .find((d) => d.name === name);
          return (
            src ?? {
              id: uid("dest"),
              name,
              country: days.find((d) => d.destination === name)!.country,
              nights: days.filter((d) => d.destination === name).length,
              blurb: "",
            }
          );
        }),
        days,
        seed: false,
      };
      return hybrid;
    },
    [state, activeDateOption]
  );

  return {
    ready,
    state,
    lineages,
    favoriteLineages,
    activeDateOption,
    preferences: state?.preferences ?? [],
    feedback: state?.feedback ?? {},
    destinationDecisions: state?.destinationDecisions ?? {},
    northStar: state?.northStar,
    // actions
    toggleFavorite,
    setFeedback,
    setDestinationDecision,
    setActiveVersion,
    setDateOption,
    setNorthStar,
    saveVersion,
    createLineage,
    addPreference,
    updatePreference,
    removePreference,
    resetWorkspace,
    buildHybridPlan,
  };
}

export type UseWorkspace = ReturnType<typeof useWorkspace>;
