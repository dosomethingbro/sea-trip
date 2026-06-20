// src/app/api/plan-assistant/route.ts
//
// Server-only. API keys live in process.env and are NEVER sent to the browser.
// The client posts an LLMPlanRequest and gets back an LLMPlanResponse.
//
// Provider selection:
//   PLAN_ASSISTANT_PROVIDER unset / "mock"  -> deterministic local engine.
//   anything else (e.g. "gateway" / "claude") -> real AI (Claude when
//                                               ANTHROPIC_API_KEY is set) for
//                                               synthesize-itinerary AND the
//                                               console, with the deterministic
//                                               engine as a hard fallback.

import { NextResponse } from "next/server";
import { runPlanAssistant, synthesizeItineraryMock } from "@/lib/planAssistant";
import { synthesizeItinerary } from "@/lib/aiSynthesis";
import { runConsoleAI } from "@/lib/aiConsole";
import { usingClaude } from "@/lib/aiClient";
import { requireProfileId } from "@/lib/membership";
import { PROFILE_LABELS } from "@/lib/workspaceConfig";
import type { LLMPlanRequest, LLMPlanResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: LLMPlanRequest;
  try {
    body = (await request.json()) as LLMPlanRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.type) {
    return NextResponse.json({ error: "Missing request 'type'" }, { status: 400 });
  }

  // Use real AI whenever a provider is available (Claude via ANTHROPIC_API_KEY,
  // or the AI Gateway). Set PLAN_ASSISTANT_PROVIDER=mock to force the
  // deterministic engine for offline/testing.
  const forceMock = process.env.PLAN_ASSISTANT_PROVIDER === "mock";
  const useAI = !forceMock && (usingClaude() || Boolean(process.env.AI_GATEWAY_API_KEY));

  try {
    let result: LLMPlanResponse;

    if (body.type === "synthesize-itinerary" && useAI) {
      // Real model call. If it throws or returns an invalid plan, fall back to
      // the deterministic synthesizer so the UI never dead-ends.
      try {
        result = { type: body.type, synthesize: await synthesizeItinerary(body) };
      } catch (err) {
        console.error("[v0] AI synthesis failed, using fallback:", err);
        result = { type: body.type, synthesize: synthesizeItineraryMock(body) };
      }
    } else if (body.type === "console" && useAI) {
      // Claude-powered console. It can LOG decisions for the signed-in user, so
      // we resolve the session->profile here (never trust the client for it).
      try {
        const profileId = await requireProfileId();
        const displayName = PROFILE_LABELS[profileId] ?? "there";
        result = { type: "console", console: await runConsoleAI(body, profileId, displayName) };
      } catch (err) {
        console.error("[v0] AI console failed, using fallback:", err);
        result = runPlanAssistant(body);
      }
    } else {
      // Deterministic local engine — no network, no key required. Also handles
      // analyze-favorites / revise-plan which stay rule-based.
      result = runPlanAssistant(body);
    }

    return NextResponse.json(result satisfies LLMPlanResponse);
  } catch (err) {
    console.error("[v0] plan-assistant error:", err);
    try {
      return NextResponse.json(runPlanAssistant(body));
    } catch {
      return NextResponse.json(
        { error: "Assistant failed to produce a response" },
        { status: 500 }
      );
    }
  }
}
