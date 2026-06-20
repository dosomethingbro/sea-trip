"use client";

// src/components/ProfileBar.tsx
//
// Thin top strip showing the signed-in profile, an invite-partner action (owner
// only, when a seat is open), and sign out.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { createInviteAction } from "@/app/actions/auth";

export interface ProfileBarInfo {
  name: string;
  profileLabel: string;
  role: "owner" | "member";
  partnerSeatOpen: boolean;
}

export function ProfileBar({ profile }: { profile: ProfileBarInfo }) {
  const router = useRouter();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInvite = async () => {
    setBusy(true);
    setError(null);
    const res = await createInviteAction();
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setInviteUrl(res.url);
    setInviteFor(res.profileLabel);
  };

  const copy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked; the input below still lets them copy manually
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <div className="border-b border-forest/10 bg-forest text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2">
        <span className="text-sm">
          Signed in as{" "}
          <span className="font-semibold">{profile.profileLabel}</span>
          <span className="text-cream/60"> · {profile.name}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          {profile.partnerSeatOpen && (
            <button
              type="button"
              onClick={generateInvite}
              disabled={busy}
              className="rounded-full border border-cream/30 px-3 py-1 text-xs font-semibold text-cream transition-colors hover:bg-cream/10 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Invite partner"}
            </button>
          )}
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-cream/30 px-3 py-1 text-xs font-semibold text-cream transition-colors hover:bg-cream/10"
          >
            Sign out
          </button>
        </div>

        {error && (
          <p className="w-full text-xs text-cream/80" role="alert">
            {error}
          </p>
        )}

        {inviteUrl && (
          <div className="flex w-full items-center gap-2 pb-1">
            <span className="text-xs text-cream/80">
              Invite link for {inviteFor}:
            </span>
            <input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-cream/20 bg-cream/10 px-2 py-1 text-xs text-cream"
            />
            <button
              type="button"
              onClick={copy}
              className="rounded-lg bg-cream px-2 py-1 text-xs font-semibold text-forest"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
