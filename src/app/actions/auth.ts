"use server";

// src/app/actions/auth.ts
//
// Server Actions for membership-aware auth flows: bootstrapping the owner seat
// after sign-up, generating an invite link for the partner, and accepting an
// invite. Session creation/destruction itself is handled by Better Auth's
// client (signUp/signIn/signOut) + its route handler.

import { headers } from "next/headers";
import {
  acceptInvite,
  createInviteForRemainingSeat,
  ensureOwnerMembership,
  getMembership,
  getSessionUser,
} from "@/lib/membership";
import { PROFILE_LABELS } from "@/lib/workspaceConfig";
import type { ProfileId } from "@/lib/types";

export interface ProfileInfo {
  userId: string;
  name: string;
  email: string;
  profileId: ProfileId;
  profileLabel: string;
  role: "owner" | "member";
}

/**
 * Resolve the current user's profile info, ensuring the owner seat is claimed
 * on first sign-in. Returns null if unauthenticated, or { needsInvite: true }
 * if the user is authenticated but has no seat (must accept an invite).
 */
export async function getProfileInfoAction(): Promise<
  ProfileInfo | { needsInvite: true } | null
> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  let membership = await getMembership(sessionUser.id);
  if (!membership) {
    membership = await ensureOwnerMembership(sessionUser.id);
  }
  if (!membership) return { needsInvite: true };

  return {
    userId: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    profileId: membership.profileId,
    profileLabel: PROFILE_LABELS[membership.profileId],
    role: membership.role,
  };
}

/** Owner generates an invite link for the remaining profile seat. */
export async function createInviteAction(): Promise<
  { url: string; profileLabel: string } | { error: string }
> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { error: "You must be signed in." };

  const result = await createInviteForRemainingSeat(sessionUser.id);
  if ("error" in result) return result;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";
  return {
    url: `${origin}/invite/${result.token}`,
    profileLabel: PROFILE_LABELS[result.profileId],
  };
}

/** Accept an invite for the currently signed-in user. */
export async function acceptInviteAction(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { ok: false, error: "You must be signed in to accept an invite." };
  }
  const result = await acceptInvite(token, sessionUser.id);
  if (!result.ok) return result;
  return { ok: true };
}
