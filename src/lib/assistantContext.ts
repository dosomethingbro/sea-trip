// src/lib/assistantContext.ts
//
// Server-only. Builds a compact catalog of the workspace for the in-app Claude
// assistant: the plans, their days/activities (with ids + the current profile's
// feedback), and destinations. Also exposes the set of VALID ids so the chat
// route can reject hallucinated ids before mutating the database.

import "server-only";
import { loadWorkspaceState } from "@/storage/remoteTripStore";
import type { ProfileId, WorkspaceState } from "@/lib/types";

export interface AssistantContext {
  catalog: string;
  validActivityIds: Set<string>;
  validDestinationIds: Set<string>;
  validLineageIds: Set<string>;
  state: WorkspaceState;
}

/** Resolve the plan currently shown for a lineage (active version, else original). */
function activePlanForLineage(state: WorkspaceState, lineageId: string) {
  const activeId = state.activeVersionByLineage[lineageId];
  const versions = state.versions.filter((v) => v.lineageId === lineageId);
  return (
    versions.find((v) => v.id === activeId) ??
    versions.find((v) => v.kind === "original") ??
    versions[0]
  );
}

export async function buildAssistantContext(
  profileId: ProfileId,
  displayName: string
): Promise<AssistantContext> {
  const state = await loadWorkspaceState(profileId);

  const validActivityIds = new Set<string>();
  const validDestinationIds = new Set<string>();
  const validLineageIds = new Set<string>();

  const lineageIds = Array.from(new Set(state.versions.map((v) => v.lineageId)));
  const lines: string[] = [];

  lines.push(`Workspace catalog for ${displayName}. Favorited plans are marked ★.`);
  lines.push("");

  for (const lineageId of lineageIds) {
    const version = activePlanForLineage(state, lineageId);
    if (!version) continue;
    validLineageIds.add(lineageId);
    const plan = version.plan;
    const fav = state.favoriteIds.includes(lineageId) ? "★" : "☆";
    lines.push(
      `PLAN ${fav} lineageId="${lineageId}" — "${plan.title}" (${plan.durationDays}d, route: ${plan.route.join(
        " → "
      )})`
    );

    for (const dest of plan.destinations ?? []) {
      validDestinationIds.add(dest.id);
      const decision = state.destinationDecisions[dest.id]?.status;
      lines.push(
        `  DEST destinationId="${dest.id}" — ${dest.name}, ${dest.country}${
          decision ? ` [decision: ${decision}]` : ""
        }`
      );
    }

    for (const day of plan.days ?? []) {
      for (const act of day.activities ?? []) {
        validActivityIds.add(act.id);
        const fb = state.feedback[act.id]?.status;
        lines.push(
          `    ACT activityId="${act.id}" — ${act.title} (${act.type}, ${day.destination})${
            fb ? ` [feedback: ${fb}]` : ""
          }`
        );
      }
    }
    lines.push("");
  }

  return {
    catalog: lines.join("\n"),
    validActivityIds,
    validDestinationIds,
    validLineageIds,
    state,
  };
}
