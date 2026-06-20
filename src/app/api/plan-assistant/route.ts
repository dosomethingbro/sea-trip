// src/app/api/plan-assistant/route.ts
//
// Server-only. API keys live in process.env and are NEVER sent to the browser.
// The client posts an LLMPlanRequest and gets back an LLMPlanResponse.

import { NextResponse } from "next/server";
import { runPlanAssistant } from "@/lib/planAssistant";
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

  const provider = process.env.PLAN_ASSISTANT_PROVIDER ?? "mock";

  try {
    let result: LLMPlanResponse;

    if (provider === "mock") {
      // Deterministic local engine — no network, no key required.
      result = runPlanAssistant(body);
    } else {
      // ----------------------------------------------------------------
      // TO GO LIVE: build a prompt from `body` and call your provider here.
      // Keep runPlanAssistant(body) as a fallback if the call fails so the
      // UI never hard-breaks.
      //
      // Anthropic example:
      //   import Anthropic from "@anthropic-ai/sdk";
      //   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      //   const msg = await anthropic.messages.create({
      //     model: "claude-sonnet-4-6",
      //     max_tokens: 4000,
      //     system: SYSTEM_PROMPT,                // describe the JSON schema you want
      //     messages: [{ role: "user", content: JSON.stringify(body) }],
      //   });
      //   result = JSON.parse(extractText(msg)) as LLMPlanResponse;
      //
      // OpenAI example:
      //   import OpenAI from "openai";
      //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      //   const completion = await openai.chat.completions.create({
      //     model: "gpt-4o",
      //     response_format: { type: "json_object" },
      //     messages: [{ role: "system", content: SYSTEM_PROMPT },
      //                { role: "user", content: JSON.stringify(body) }],
      //   });
      //   result = JSON.parse(completion.choices[0].message.content!) as LLMPlanResponse;
      // ----------------------------------------------------------------
      result = runPlanAssistant(body); // fallback until a provider is wired up
    }

    return NextResponse.json(result satisfies LLMPlanResponse);
  } catch (err) {
    console.error("plan-assistant error:", err);
    // Last-resort fallback so the console/analysis never dead-ends.
    try {
      return NextResponse.json(runPlanAssistant(body));
    } catch {
      return NextResponse.json({ error: "Assistant failed to produce a response" }, { status: 500 });
    }
  }
}
