"use server";

// src/app/actions/croatia.ts
//
// Server Actions are the only write path from the Croatia client. Each performs
// a single row-level mutation. Reads go through getCroatiaStateAction (the SWR
// fetcher).

import {
  addCroatiaActivity,
  loadCroatiaState,
  removeCroatiaActivity,
  reorderCroatiaDay,
  resetCroatiaData,
  swapCroatiaActivity,
} from "@/storage/croatiaStore";
import type { CroatiaActivity, CroatiaState } from "@/lib/croatia/types";

export async function getCroatiaStateAction(): Promise<CroatiaState> {
  return loadCroatiaState();
}

export async function addCroatiaActivityAction(
  activity: CroatiaActivity
): Promise<void> {
  await addCroatiaActivity(activity);
}

export async function swapCroatiaActivityAction(
  oldId: string,
  next: CroatiaActivity
): Promise<void> {
  await swapCroatiaActivity(oldId, next);
}

export async function removeCroatiaActivityAction(id: string): Promise<void> {
  await removeCroatiaActivity(id);
}

export async function reorderCroatiaDayAction(
  dayId: string,
  orderedIds: string[]
): Promise<void> {
  await reorderCroatiaDay(dayId, orderedIds);
}

export async function resetCroatiaAction(): Promise<CroatiaState> {
  return resetCroatiaData();
}
