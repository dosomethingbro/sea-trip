// src/lib/workspaceConfig.ts
//
// Constants for the single shared workspace (Phase 1 scope). Safe to import
// from both client and server modules — no secrets, no DB access here.

import type { ProfileId } from "@/lib/types";

// One real workspace for now (Constitution: "one real workspace table, seeded
// as a single workspace for now").
export const WORKSPACE_ID = "default";

// Until Phase 2 wires real auth + membership, every read/write is attributed to
// this profile. Phase 2 will replace call sites that use this constant with the
// session-derived ProfileId.
export const DEFAULT_PROFILE_ID: ProfileId = "lucas";
