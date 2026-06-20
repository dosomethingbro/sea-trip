// src/app/api/assistant/route.ts
//
// Server-only. The native in-app Claude assistant. It is gated by the session:
// the acting profile comes from requireProfileId(), so every decision the
// assistant logs is attributed to the LOGGED-IN user. Tools mutate the same
// Neon tables the rest of the app uses (row-level), and reject any id that is
// not present in the freshly-loaded workspace catalog.

import { convertToModelMessages, streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { claudeModel, hasClaudeKey } from "@/lib/aiProvider";
import { requireProfileId } from "@/lib/membership";
import { PROFILE_LABELS } from "@/lib/workspaceConfig";
import { buildAssistantContext } from "@/lib/assistantContext";
import { planDraftSchema, buildPlanFromDraft } from "@/lib/planDraft";
import {
  setFeedbackRow,
  setFavoriteRow,
  setDestinationDecisionRow,
  insertVersionRow,
} from "@/storage/remoteTripStore";
import type { UIMessage } from "ai";
import type { PlanVersion } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM = `You are the in-app travel decision assistant for a couple — Lucas (food, history, hidden gems, culture) and Tobi (scenery, markets, animals, shared experiences) — planning a Southeast Asia trip.

Your job: help the LOGGED-IN partner think through and RECORD their decisions. You can read their workspace and log decisions on their behalf using tools.

Decision vocabularies (use the exact values):
- Activities: "love" | "keep" | "defer" | "drop".
- Destinations: "love" | "like" | "maybe" | "skip".

Creating plans:
- When the user asks you to build / draft / create a NEW travel plan (a "travel card") from your discussion and their logged feedback, call createTravelPlan.
- Build the itinerary EXPERIENCES-FIRST: lead with the activities both partners favored (love/keep), then arrange destinations around them. Honor their drops.
- Keep it realistic: ~3 activities per day, minimal airport-hopping, sensible transfer burden. Estimate the 0-10 scores honestly (lucasFit/girlfriendFit reflect each partner's interests).
- After creating, confirm the plan title in plain language and tell them it was added to their plan library as a new card.

Rules:
- Lead with matrix-style comparisons and concise tradeoffs before logging anything.
- Only call a tool when the user clearly wants to record a decision, favorite, or create a plan. Confirm what you did in plain language afterward.
- For feedback/favorites, use ONLY the activityId / destinationId / lineageId values from the catalog below. Never invent ids. (createTravelPlan is exempt — it makes a brand-new plan.)
- Optimize for OVERLAP between the two partners; favor experiences over destinations.
- Be concise. Avoid over-scheduling and airport-hopping in any advice.`;

export async function POST(request: Request) {
  // Gate: must be an authenticated member; resolves WHO we log decisions for.
  let profileId;
  try {
    profileId = await requireProfileId();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!hasClaudeKey()) {
    return new Response("Claude is not configured (missing ANTHROPIC_API_KEY).", {
      status: 503,
    });
  }

  const { messages }: { messages: UIMessage[] } = await request.json();
  const displayName = PROFILE_LABELS[profileId];
  const { catalog, validActivityIds, validDestinationIds, validLineageIds } =
    await buildAssistantContext(profileId, displayName);

  const result = streamText({
    model: claudeModel(),
    system: `${SYSTEM}\n\n--- WORKSPACE CATALOG ---\n${catalog}`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
    tools: {
      setActivityFeedback: tool({
        description:
          "Record the logged-in partner's decision on a single activity. Use the exact activityId from the catalog.",
        inputSchema: z.object({
          activityId: z.string().describe("activityId from the catalog"),
          status: z.enum(["love", "keep", "defer", "drop"]),
          note: z.string().nullable().describe("optional short reason"),
        }),
        execute: async ({ activityId, status, note }) => {
          if (!validActivityIds.has(activityId)) {
            return { ok: false, error: `Unknown activityId "${activityId}".` };
          }
          await setFeedbackRow(profileId, activityId, status, note ?? undefined);
          return { ok: true, activityId, status };
        },
      }),

      setDestinationDecision: tool({
        description:
          "Record the logged-in partner's decision on a destination (city). Use the exact destinationId from the catalog.",
        inputSchema: z.object({
          destinationId: z.string().describe("destinationId from the catalog"),
          status: z.enum(["love", "like", "maybe", "skip"]),
          note: z.string().nullable().describe("optional short reason"),
        }),
        execute: async ({ destinationId, status, note }) => {
          if (!validDestinationIds.has(destinationId)) {
            return { ok: false, error: `Unknown destinationId "${destinationId}".` };
          }
          await setDestinationDecisionRow(profileId, destinationId, status, note ?? undefined);
          return { ok: true, destinationId, status };
        },
      }),

      toggleFavorite: tool({
        description:
          "Star or unstar a whole plan for the logged-in partner. Use the exact lineageId from the catalog.",
        inputSchema: z.object({
          lineageId: z.string().describe("lineageId from the catalog"),
          favorite: z.boolean(),
        }),
        execute: async ({ lineageId, favorite }) => {
          if (!validLineageIds.has(lineageId)) {
            return { ok: false, error: `Unknown lineageId "${lineageId}".` };
          }
          await setFavoriteRow(profileId, lineageId, favorite);
          return { ok: true, lineageId, favorite };
        },
      }),

      createTravelPlan: tool({
        description:
          "Create a BRAND-NEW travel plan (a new card / lineage) from the conversation and the couple's logged feedback. Build the full day-by-day itinerary, experiences first. Use this when the user asks you to draft or build a new plan.",
        inputSchema: planDraftSchema,
        execute: async (draft) => {
          try {
            const plan = buildPlanFromDraft(draft);
            const lineageId = `lineage-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 7)}`;
            const version: PlanVersion = {
              id: `ver-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              lineageId,
              label: "Claude Draft",
              kind: "ai-revision",
              createdAt: new Date().toISOString(),
              plan: { ...plan, id: lineageId },
              changeSummary: draft.rationale.slice(0, 140),
            };
            await insertVersionRow(version);
            return {
              ok: true,
              lineageId,
              title: plan.title,
              days: plan.days.length,
              route: plan.route,
            };
          } catch (err) {
            return {
              ok: false,
              error: err instanceof Error ? err.message : "Failed to create plan.",
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
