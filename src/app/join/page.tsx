// src/app/join/page.tsx
//
// Shown to an authenticated user who has no workspace seat. They can't proceed
// without an invite link from the owner.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership, getSessionUser } from "@/lib/membership";
import { SignOutButton } from "@/components/SignOutButton";

export default async function JoinPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const membership = await getMembership(user.id);
  if (membership) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-7 text-center">
        <p className="eyebrow mb-2">Two Countries</p>
        <h1 className="text-2xl">Almost there</h1>
        <p className="mt-2 text-sm text-muted">
          You&apos;re signed in, but this workspace is private. Ask your partner
          to send you their{" "}
          <span className="font-semibold text-forest">Invite partner</span> link,
          then open it while signed in to claim your seat.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/" className="btn btn-secondary w-full">
            Check again
          </Link>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
