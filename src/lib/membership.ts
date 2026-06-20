// src/lib/membership.ts
//
// Server-only: resolves an authenticated session into a workspace ProfileId via
// the membership table, and manages invites. This is the bridge that lets the
// two-profile UX (Lucas / girlfriend) sit on top of real per-user accounts.
//
// Model: one workspace (WORKSPACE_ID) with exactly two profile seats. The first
// account to sign up claims the OWNER seat (DEFAULT_PROFILE_ID = "lucas"); the
// partner joins via an invite link that assigns the remaining seat.

import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { invite as inviteTable, membership as membershipTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  DEFAULT_PROFILE_ID,
  PROFILE_IDS,
  WORKSPACE_ID,
} from "@/lib/workspaceConfig";
import type { ProfileId } from "@/lib/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface Membership {
  workspaceId: string;
  userId: string;
  profileId: ProfileId;
  role: "owner" | "member";
}

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

/** Current authenticated user, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

/** Look up the membership row for a user in the workspace. */
export async function getMembership(userId: string): Promise<Membership | null> {
  const rows = await db
    .select()
    .from(membershipTable)
    .where(
      and(
        eq(membershipTable.workspaceId, WORKSPACE_ID),
        eq(membershipTable.userId, userId)
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    workspaceId: row.workspaceId,
    userId: row.userId,
    profileId: row.profileId,
    role: row.role,
  };
}

/** Which profile seats are already taken in the workspace. */
async function takenProfileIds(): Promise<ProfileId[]> {
  const rows = await db
    .select({ profileId: membershipTable.profileId })
    .from(membershipTable)
    .where(eq(membershipTable.workspaceId, WORKSPACE_ID));
  return rows.map((r) => r.profileId);
}

/** True when at least one profile seat is still unclaimed. */
export async function hasOpenSeat(): Promise<boolean> {
  const taken = await takenProfileIds();
  return taken.length < PROFILE_IDS.length;
}

/**
 * Resolve the acting ProfileId for the current request. Throws if unauthenticated
 * or not a member. Server Actions call this instead of the Phase 1 constant.
 */
export async function requireProfileId(): Promise<ProfileId> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("Unauthorized");
  const m = await getMembership(sessionUser.id);
  if (!m) throw new Error("No workspace membership");
  return m.profileId;
}

/**
 * Ensure a freshly signed-up user has a membership. The FIRST user becomes the
 * owner with DEFAULT_PROFILE_ID. Subsequent users WITHOUT an invite are
 * rejected (they must use an invite link) so we never silently overflow the
 * two-seat workspace. Returns the membership or null if no seat could be
 * assigned.
 */
export async function ensureOwnerMembership(
  userId: string
): Promise<Membership | null> {
  const existing = await getMembership(userId);
  if (existing) return existing;

  const taken = await takenProfileIds();
  // Only auto-assign the owner seat when the workspace is empty.
  if (taken.length === 0) {
    const m: Membership = {
      workspaceId: WORKSPACE_ID,
      userId,
      profileId: DEFAULT_PROFILE_ID,
      role: "owner",
    };
    await db.insert(membershipTable).values({ id: randomUUID(), ...m });
    return m;
  }
  return null;
}

/** Create an invite for the remaining (unclaimed) profile seat. */
export async function createInviteForRemainingSeat(
  createdByUserId: string
): Promise<{ token: string; profileId: ProfileId } | { error: string }> {
  const taken = await takenProfileIds();
  const remaining = PROFILE_IDS.find((p) => !taken.includes(p));
  if (!remaining) return { error: "Both seats are already filled." };

  const token = randomBytes(24).toString("base64url");
  await db.insert(inviteTable).values({
    token,
    workspaceId: WORKSPACE_ID,
    profileId: remaining,
    createdBy: createdByUserId,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });
  return { token, profileId: remaining };
}

export interface InviteInfo {
  token: string;
  profileId: ProfileId;
  valid: boolean;
  reason?: string;
}

/** Read an invite's status without consuming it. */
export async function getInvite(token: string): Promise<InviteInfo | null> {
  const rows = await db
    .select()
    .from(inviteTable)
    .where(eq(inviteTable.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  let valid = true;
  let reason: string | undefined;
  if (row.acceptedBy) {
    valid = false;
    reason = "This invite has already been used.";
  } else if (row.expiresAt.getTime() < Date.now()) {
    valid = false;
    reason = "This invite has expired.";
  }
  return { token: row.token, profileId: row.profileId, valid, reason };
}

/**
 * Accept an invite: assign the invited ProfileId to the given user and mark the
 * invite consumed. Idempotent if the user already holds that seat.
 */
export async function acceptInvite(
  token: string,
  userId: string
): Promise<{ ok: true; profileId: ProfileId } | { ok: false; error: string }> {
  const info = await getInvite(token);
  if (!info) return { ok: false, error: "Invite not found." };

  // Already a member? Treat as success (re-clicking the link).
  const existing = await getMembership(userId);
  if (existing) return { ok: true, profileId: existing.profileId };

  if (!info.valid) return { ok: false, error: info.reason ?? "Invalid invite." };

  // Guard: seat still free?
  const taken = await takenProfileIds();
  if (taken.includes(info.profileId)) {
    return { ok: false, error: "That seat has already been claimed." };
  }

  await db.insert(membershipTable).values({
    id: randomUUID(),
    workspaceId: WORKSPACE_ID,
    userId,
    profileId: info.profileId,
    role: "member",
  });
  await db
    .update(inviteTable)
    .set({ acceptedBy: userId, acceptedAt: new Date() })
    .where(eq(inviteTable.token, token));

  return { ok: true, profileId: info.profileId };
}
