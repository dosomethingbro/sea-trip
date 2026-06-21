// src/lib/croatia/api.ts
// Client helper for the Croatia recommendation endpoint.

import type { RecommendRequest, RecommendResponse } from "./types";

export async function fetchRecommendations(
  req: RecommendRequest
): Promise<RecommendResponse> {
  const res = await fetch("/api/croatia/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Recommendation request failed (${res.status})`);
  }
  return (await res.json()) as RecommendResponse;
}
