// src/lib/workspaceConfig.ts
//
// Constants for the single shared workspace (Phase 1 scope). Safe to import
// from both client and server modules — no secrets, no DB access here.

import type { ProfileId } from "@/lib/types";

// One real workspace for now (Constitution: "one real workspace table, seeded
// as a single workspace for now").
export const WORKSPACE_ID = "default";

// The owner seat. The first account to sign up claims this profile; the partner
// joins via an invite link that assigns the remaining seat.
export const DEFAULT_PROFILE_ID: ProfileId = "lucas";

// The two profile seats in the workspace, in claim-priority order.
export const PROFILE_IDS: ProfileId[] = ["lucas", "girlfriend"];

// Human-friendly labels for each profile seat (used in auth/invite UI).
export const PROFILE_LABELS: Record<ProfileId, string> = {
  lucas: "Lucas",
  girlfriend: "Tobi",
};
