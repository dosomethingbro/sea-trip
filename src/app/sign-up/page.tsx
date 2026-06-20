import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/membership";
import { AuthForm } from "@/components/AuthForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/");
  return <AuthForm mode="sign-up" redirectTo={next} />;
}
