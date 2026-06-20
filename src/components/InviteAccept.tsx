"use client";

// src/components/InviteAccept.tsx
//
// Client UI for accepting a workspace invite. Assumes the user is already
// authenticated (the page redirects to sign-up?next=... otherwise).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/app/actions/auth";

export function InviteAccept({
  token,
  profileLabel,
}: {
  token: string;
  profileLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    const res = await acceptInviteAction(token);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-7 text-center">
        <p className="eyebrow mb-2">Two Countries</p>
        <h1 className="text-2xl">You&apos;re invited</h1>
        <p className="mt-2 text-sm text-muted">
          Join the shared planning workspace as{" "}
          <span className="font-semibold text-forest">{profileLabel}</span>.
        </p>

        {error && (
          <p className="mt-4 text-sm text-clay" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={accept}
          disabled={busy}
          className="btn btn-primary mt-6 w-full"
        >
          {busy ? "Joining…" : `Join as ${profileLabel}`}
        </button>
      </div>
    </main>
  );
}
