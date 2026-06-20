// src/lib/auth.ts
//
// Better Auth server config. Shares the SAME pg Pool as Drizzle (see
// @/db/client) so there is exactly one connection pool and one source of truth.
//
// The baseURL / trustedOrigins cascade makes the same code work in production,
// Vercel previews, and the v0 preview iframe. The dev-mode cookie override is
// REQUIRED for the cross-site v0 preview iframe to retain the session cookie.

import { betterAuth } from "better-auth";
import { pool } from "@/db/client";

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // Local dev / preview-iframe loopback origins.
    ...(process.env.NODE_ENV === "development"
      ? [
          "http://localhost:3000",
          `http://localhost:${process.env.PORT ?? "3000"}`,
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
});
