// src/app/page.tsx
//
// Server-side auth gate. Resolves the session -> membership before rendering the
// client workspace. Unauthenticated users go to /sign-in; authenticated users
// without a seat go to /join (they need an invite).

import { redirect } from "next/navigation";
import { getProfileInfoAction } from "@/app/actions/auth";
import { hasOpenSeat } from "@/lib/membership";
import { WorkspaceApp } from "@/components/WorkspaceApp";

export default async function Page() {
  const info = await getProfileInfoAction();

  if (info === null) redirect("/sign-in");
  if ("needsInvite" in info) redirect("/join");

  const partnerSeatOpen = info.role === "owner" && (await hasOpenSeat());

  return (
    <WorkspaceApp
      profile={{
        name: info.name,
        profileLabel: info.profileLabel,
        role: info.role,
        partnerSeatOpen,
      }}
    />
  );
}
