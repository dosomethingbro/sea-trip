// src/app/invite/[token]/page.tsx
//
// Invite landing. Validates the token, sends unauthenticated visitors to
// sign-up (preserving the invite as ?next), then renders the accept UI.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getInvite, getMembership, getSessionUser } from "@/lib/membership";
import { PROFILE_LABELS } from "@/lib/workspaceConfig";
import { InviteAccept } from "@/components/InviteAccept";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

  if (!invite) {
    return <InviteMessage title="Invite not found" body="This invite link is not valid." />;
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(`/sign-up?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  // Already a member of the workspace? Go straight in.
  const existing = await getMembership(user!.id);
  if (existing) redirect("/");

  if (!invite.valid) {
    return (
      <InviteMessage
        title="Invite unavailable"
        body={invite.reason ?? "This invite can no longer be used."}
      />
    );
  }

  return (
    <InviteAccept token={token} profileLabel={PROFILE_LABELS[invite.profileId]} />
  );
}

function InviteMessage({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-7 text-center">
        <p className="eyebrow mb-2">Two Countries</p>
        <h1 className="text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <Link href="/" className="btn btn-secondary mt-6 w-full">
          Go home
        </Link>
      </div>
    </main>
  );
}
