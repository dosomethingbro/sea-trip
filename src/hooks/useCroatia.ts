"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import {
  addCroatiaActivityAction,
  getCroatiaStateAction,
  removeCroatiaActivityAction,
  reorderCroatiaDayAction,
  resetCroatiaAction,
  swapCroatiaActivityAction,
} from "@/app/actions/croatia";
import { CROATIA_DAYS, CROATIA_TRIP } from "@/lib/croatia/seed";
import type {
  CroatiaActivity,
  CroatiaDay,
  CroatiaState,
  Suggestion,
} from "@/lib/croatia/types";

const SWR_KEY = "croatia-workspace";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export interface DayBundle {
  day: CroatiaDay;
  activities: CroatiaActivity[];
}

export function useCroatia() {
  const { data, mutate, isLoading } = useSWR<CroatiaState>(
    SWR_KEY,
    getCroatiaStateAction,
    { revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  const ready = data != null;

  // Group activities by day, in itinerary order.
  const dayBundles: DayBundle[] = useMemo(() => {
    const byDay = new Map<string, CroatiaActivity[]>();
    for (const a of data?.activities ?? []) {
      const arr = byDay.get(a.dayId) ?? [];
      arr.push(a);
      byDay.set(a.dayId, arr);
    }
    return CROATIA_DAYS.map((day) => ({
      day,
      activities: (byDay.get(day.id) ?? []).sort(
        (a, b) => a.position - b.position
      ),
    }));
  }, [data]);

  const tripStats = useMemo(() => {
    const activities = data?.activities ?? [];
    return {
      total: activities.length,
      swappable: activities.filter((a) => !a.locked).length,
      aiAdded: activities.filter((a) => a.source === "ai").length,
    };
  }, [data]);

  // Optimistic mutation runner mirroring the SE Asia workspace hook.
  const runMutation = useCallback(
    (
      optimistic: (prev: CroatiaState) => CroatiaState,
      serverCall: () => Promise<unknown>
    ) => {
      void mutate(
        async () => {
          await serverCall();
          return getCroatiaStateAction();
        },
        {
          optimisticData: (prev?: CroatiaState) =>
            prev ? optimistic(prev) : (prev as unknown as CroatiaState),
          rollbackOnError: true,
          revalidate: false,
        }
      ).catch(() => {});
    },
    [mutate]
  );

  // Convert a Suggestion into a concrete activity for a day.
  const suggestionToActivity = useCallback(
    (
      dayId: string,
      location: CroatiaActivity["location"],
      s: Suggestion,
      position: number,
      source: CroatiaActivity["source"] = "ai"
    ): CroatiaActivity => ({
      id: uid("act"),
      dayId,
      position,
      slot: s.slot,
      timeLabel: s.timeLabel,
      title: s.title,
      description: s.description,
      category: s.category,
      location,
      source,
      tags: s.liveSignal ? ["live"] : undefined,
      sourceLinks: s.sourceLinks,
    }),
    []
  );

  const addSuggestion = useCallback(
    (
      dayId: string,
      location: CroatiaActivity["location"],
      s: Suggestion,
      source: CroatiaActivity["source"] = "ai"
    ) => {
      const bundle = dayBundles.find((b) => b.day.id === dayId);
      const position = bundle ? bundle.activities.length : 0;
      const activity = suggestionToActivity(dayId, location, s, position, source);
      runMutation(
        (prev) => ({ ...prev, activities: [...prev.activities, activity] }),
        () => addCroatiaActivityAction(activity)
      );
    },
    [dayBundles, runMutation, suggestionToActivity]
  );

  const swapActivity = useCallback(
    (
      oldId: string,
      dayId: string,
      location: CroatiaActivity["location"],
      s: Suggestion,
      source: CroatiaActivity["source"] = "ai"
    ) => {
      const old = (data?.activities ?? []).find((a) => a.id === oldId);
      const next = suggestionToActivity(
        dayId,
        location,
        s,
        old?.position ?? 0,
        source
      );
      runMutation(
        (prev) => ({
          ...prev,
          activities: prev.activities.map((a) =>
            a.id === oldId ? { ...next, position: a.position } : a
          ),
        }),
        () => swapCroatiaActivityAction(oldId, next)
      );
    },
    [data, runMutation, suggestionToActivity]
  );

  const removeActivity = useCallback(
    (id: string) => {
      runMutation(
        (prev) => ({
          ...prev,
          activities: prev.activities.filter((a) => a.id !== id),
        }),
        () => removeCroatiaActivityAction(id)
      );
    },
    [runMutation]
  );

  const reorderDay = useCallback(
    (dayId: string, orderedIds: string[]) => {
      runMutation(
        (prev) => {
          const order = new Map(orderedIds.map((id, i) => [id, i]));
          return {
            ...prev,
            activities: prev.activities.map((a) =>
              a.dayId === dayId && order.has(a.id)
                ? { ...a, position: order.get(a.id)! }
                : a
            ),
          };
        },
        () => reorderCroatiaDayAction(dayId, orderedIds)
      );
    },
    [runMutation]
  );

  const resetTrip = useCallback(() => {
    void mutate(async () => resetCroatiaAction(), { revalidate: false }).catch(
      () => {}
    );
  }, [mutate]);

  return {
    ready,
    isLoading,
    trip: CROATIA_TRIP,
    dayBundles,
    tripStats,
    // actions
    addSuggestion,
    swapActivity,
    removeActivity,
    reorderDay,
    resetTrip,
  };
}

export type UseCroatia = ReturnType<typeof useCroatia>;
