"use client";

// src/components/AuthForm.tsx
//
// Shared email+password form for sign-in and sign-up, styled to match the
// project's forest/cream design system (no shadcn/ui in this project).

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  /** Optional next path to send the user to after success (e.g. invite accept). */
  redirectTo?: string;
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";
  const dest = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Something went wrong");
      return;
    }

    router.push(dest);
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-7">
        <p className="eyebrow mb-2">Two Countries</p>
        <h1 className="text-2xl">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isSignUp
            ? "Sign up to start planning together."
            : "Sign in to your planning workspace."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-semibold text-forest">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="rounded-xl border border-forest/20 bg-white/80 px-3 py-2 text-sm text-ink outline-none focus:border-forest/60"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-forest">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-xl border border-forest/20 bg-white/80 px-3 py-2 text-sm text-ink outline-none focus:border-forest/60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-forest">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="rounded-xl border border-forest/20 bg-white/80 px-3 py-2 text-sm text-ink outline-none focus:border-forest/60"
            />
          </div>

          {error && (
            <p className="text-sm text-clay" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <Link
            href={
              isSignUp
                ? `/sign-in${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`
                : `/sign-up${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`
            }
            className="font-semibold text-forest underline-offset-4 hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </main>
  );
}
