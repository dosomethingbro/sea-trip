// src/db/schema.ts
//
// Drizzle table definitions for the Neon-backed planning workspace (Phase 1).
//
// Notes:
// - App tables intentionally have NO foreign-key constraints (per Neon stack
//   guidance) — scoping is done in queries by workspace_id / profile_id.
// - `profile_id` defaults to 'lucas'. Phase 2 (auth) will derive it from the
//   session->membership mapping; until then everything is the single profile.
// - Phase 2 will add Better Auth tables (user/session/account/verification)
//   plus membership/invite to this same file.

import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  ActivityFeedback,
  DestinationDecisionStatus,
  PreferenceCategory,
  Person,
  TripPlan,
  VersionKind,
} from "@/lib/types";
import type { CroatiaActivity } from "@/lib/croatia/types";

// One workspace for now (id = "default"). Small mutable "active state"
// (which version is shown per lineage + the active date option) lives here so
// it can be updated as a single small row without touching the big collections.
export const workspace = pgTable("workspace", {
  id: text("id").primaryKey(),
  northStar: text("north_star"),
  activeDateOptionId: text("active_date_option_id"),
  activeVersionByLineage: jsonb("active_version_by_lineage")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Every plan + its revisions/hybrids. The full TripPlan snapshot is stored as
// JSONB so the existing rich plan shape is preserved verbatim.
export const planVersions = pgTable("plan_versions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  lineageId: text("lineage_id").notNull(),
  label: text("label").notNull(),
  kind: text("kind").$type<VersionKind>().notNull(),
  plan: jsonb("plan").$type<TripPlan>().notNull(),
  changeSummary: text("change_summary"),
  parentVersionId: text("parent_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Row-level activity feedback (keep | drop | defer | love). One row per
// (workspace, profile, activity).
export const feedback = pgTable(
  "feedback",
  {
    workspaceId: text("workspace_id").notNull(),
    profileId: text("profile_id").notNull().default("lucas"),
    activityId: text("activity_id").notNull(),
    status: text("status").$type<NonNullable<ActivityFeedback["status"]>>(),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workspaceId, t.profileId, t.activityId] }),
  })
);

// Row-level favorites (lineage-level). One row per (workspace, profile, lineage).
export const favorites = pgTable(
  "favorites",
  {
    workspaceId: text("workspace_id").notNull(),
    profileId: text("profile_id").notNull().default("lucas"),
    lineageId: text("lineage_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workspaceId, t.profileId, t.lineageId] }),
  })
);

// Destination-level decisions (love | like | maybe | skip) — distinct from
// activity feedback (Constitution reconciliation #3).
export const destinationDecisions = pgTable(
  "destination_decisions",
  {
    workspaceId: text("workspace_id").notNull(),
    profileId: text("profile_id").notNull().default("lucas"),
    destinationId: text("destination_id").notNull(),
    status: text("status").$type<DestinationDecisionStatus>().notNull(),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workspaceId, t.profileId, t.destinationId] }),
  })
);

export const preferences = pgTable("preferences", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  person: text("person").$type<Person>().notNull(),
  category: text("category").$type<PreferenceCategory>().notNull(),
  text: text("text").notNull(),
  weight: integer("weight").notNull().default(3),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Croatia trip planner (separate fork). One fixed itinerary whose per-day
// activities are mutable. Days themselves are static seed data in code, so the
// only persisted thing is the list of activities (with their ordering).
// No FK constraints, per Neon stack guidance; scoped by workspace_id.
// ---------------------------------------------------------------------------
export const croatiaActivities = pgTable("croatia_activities", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  dayId: text("day_id").notNull(),
  position: integer("position").notNull().default(0),
  activity: jsonb("activity").$type<CroatiaActivity>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
