"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const signOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };
  return (
    <button type="button" onClick={signOut} className="btn btn-ghost w-full">
      Sign out
    </button>
  );
}
