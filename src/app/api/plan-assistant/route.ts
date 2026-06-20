// src/app/api/plan-assistant/route.ts
//
// Server-only. API keys live in process.env and are NEVER sent to the browser.
// The client posts an LLMPlanRequest and gets back an LLMPlanResponse.
//
// Provider selection:
//   PLAN_ASSISTANT_PROVIDER unset / "mock"  -> deterministic local engine.
//   anything else (e.g. "gateway")          -> real AI for synthesize-itinerary
//                                               via the Vercel AI Gateway, with
//                                               the mock as a hard fallback.

import { NextResponse } from "next/server";
import { runPlanAssistant, synthesizeItineraryMock } from "@/lib/planAssistant";
import { synthesizeItinerary } from "@/lib/aiSynthesis";
import { hasClaudeKey } from "@/lib/aiProvider";
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

  // Use real AI for synthesis whenever a Claude key is configured. The explicit
  // PLAN_ASSISTANT_PROVIDER="mock" override still forces the deterministic path.
  const forceMock = process.env.PLAN_ASSISTANT_PROVIDER === "mock";
  const useAI = !forceMock && hasClaudeKey();

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
    } else {
      // Deterministic local engine — no network, no key required. Also handles
      // analyze-favorites / revise-plan / console which stay rule-based.
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
