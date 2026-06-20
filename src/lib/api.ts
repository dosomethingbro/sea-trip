// src/lib/api.ts
import type { LLMPlanRequest, LLMPlanResponse } from "./types";

export async function callPlanAssistant(req: LLMPlanRequest): Promise<LLMPlanResponse> {
  const res = await fetch("/api/plan-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Assistant request failed (${res.status}). ${detail}`);
  }
  return (await res.json()) as LLMPlanResponse;
}
