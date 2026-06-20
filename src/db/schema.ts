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
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type {
  ActivityFeedback,
  DestinationDecisionStatus,
  PreferenceCategory,
  Person,
  ProfileId,
  TripPlan,
  VersionKind,
} from "@/lib/types";

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
// Phase 2 — Better Auth tables (camelCase column names are Better Auth's
// defaults; do NOT rename). These keep their references as generated.
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Phase 2 — workspace membership + invites (app tables, no FK constraints).
// Each authenticated user maps to exactly one ProfileId per workspace.
// ---------------------------------------------------------------------------

export const membership = pgTable(
  "membership",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    profileId: text("profile_id").$type<ProfileId>().notNull(),
    role: text("role").$type<"owner" | "member">().notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqUser: unique().on(t.workspaceId, t.userId),
    uniqProfile: unique().on(t.workspaceId, t.profileId),
  })
);

export const invite = pgTable("invite", {
  token: text("token").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  profileId: text("profile_id").$type<ProfileId>().notNull(),
  createdBy: text("created_by").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedBy: text("accepted_by"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
