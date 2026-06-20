// src/lib/aiConsole.ts
//
// Server-only. Claude-powered planning console. Unlike the deterministic
// engine, this lets the signed-in user TALK to Claude about their plans and
// have it LOG their decisions (activity feedback + destination decisions)
// directly to Neon — scoped to their own ProfileId. Every tool write is
// recorded in `actionsTaken` so the UI can show what changed and refetch.

import "server-only";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/aiClient";
import { setDestinationDecisionRow, setFeedbackRow } from "@/storage/remoteTripStore";
import type { LLMPlanRequest, ConsoleResult, ProfileId, TripPlan } from "@/lib/types";

interface ActivityRef {
  id: string;
  title: string;
  type: string;
  destination: string;
}
interface DestinationRef {
  id: string;
  name: string;
}

// Build a deduped index of the activities + destinations Claude is allowed to
// reference, so its logging tools target real ids.
function indexPlans(plans: TripPlan[]): {
  activities: ActivityRef[];
  destinations: DestinationRef[];
} {
  const activities = new Map<string, ActivityRef>();
  const destinations = new Map<string, DestinationRef>();
  for (const plan of plans) {
    for (const d of plan.destinations ?? []) {
      if (!destinations.has(d.id)) destinations.set(d.id, { id: d.id, name: d.name });
    }
    for (const day of plan.days ?? []) {
      for (const a of day.activities ?? []) {
        if (!activities.has(a.id)) {
          activities.set(a.id, {
            id: a.id,
            title: a.title,
            type: a.type,
            destination: day.destination,
          });
        }
      }
    }
  }
  return {
    activities: Array.from(activities.values()),
    destinations: Array.from(destinations.values()),
  };
}

function buildSystem(displayName: string): string {
  return [
    `You are the planning assistant inside a couple's Southeast Asia travel decision workspace.`,
    `You are talking to ${displayName}, who is signed in. Decisions you log are recorded as THEIR decisions only.`,
    ``,
    `Philosophy: trips begin with EXPERIENCES, not destinations. Optimize for OVERLAP between both partners.`,
    `Avoid airport-hopping and over-scheduling (~3 activities per day).`,
    ``,
    `You can LOG decisions on the user's behalf when they clearly express an opinion:`,
    `- logActivityDecision: Love / Keep / Defer / Drop for a specific activity.`,
    `- logDestinationDecision: Love / Like / Maybe / Skip for a destination.`,
    `Only log when the user clearly wants it (e.g. "I love the lantern market", "skip Bangkok", "drop anything touristy").`,
    `Use ONLY the activity ids and destination ids provided in the context. Never invent ids.`,
    `If the user just asks a question or wants advice, answer conversationally and DO NOT log anything.`,
    ``,
    `Keep replies concise, warm, and specific. Reference real activities by name.`,
  ].join("\n");
}

function buildPrompt(
  req: LLMPlanRequest,
  index: { activities: ActivityRef[]; destinations: DestinationRef[] }
): string {
  const lines: string[] = [];
  if (req.plan) {
    lines.push(`Target plan: "${req.plan.title}" — route ${req.plan.route.join(" → ")}.`, "");
  }
  if (req.preferences?.length) {
    lines.push("Saved preferences:");
    for (const p of req.preferences) lines.push(`- [${p.person}] ${p.text} (weight ${p.weight})`);
    lines.push("");
  }
  if (index.destinations.length) {
    lines.push("Destinations you may reference (id | name):");
    for (const d of index.destinations) lines.push(`- ${d.id} | ${d.name}`);
    lines.push("");
  }
  if (index.activities.length) {
    lines.push("Activities you may reference (id | title | type | destination):");
    for (const a of index.activities.slice(0, 120)) {
      lines.push(`- ${a.id} | ${a.title} | ${a.type} | ${a.destination}`);
    }
    lines.push("");
  }
  lines.push(`User says: ${req.prompt ?? ""}`);
  return lines.join("\n");
}

const FEEDBACK = ["love", "keep", "defer", "drop"] as const;
const DECISION = ["love", "like", "maybe", "skip"] as const;

export async function runConsoleAI(
  req: LLMPlanRequest,
  profileId: ProfileId,
  displayName: string
): Promise<ConsoleResult> {
  const plans = [req.plan, ...(req.favoritePlans ?? [])].filter(
    (p): p is TripPlan => Boolean(p)
  );
  const index = indexPlans(plans);
  const validActivityIds = new Set(index.activities.map((a) => a.id));
  const validDestinationIds = new Set(index.destinations.map((d) => d.id));

  const actionsTaken: string[] = [];

  const { text } = await generateText({
    model: getModel(),
    system: buildSystem(displayName),
    prompt: buildPrompt(req, index),
    stopWhen: stepCountIs(6),
    tools: {
      logActivityDecision: tool({
        description:
          "Record the signed-in user's decision on a specific activity. Use only when the user clearly expresses keep/drop/defer/love.",
        inputSchema: z.object({
          activityId: z.string().describe("Exact activity id from the context"),
          status: z.enum(FEEDBACK),
          note: z.string().nullable().describe("Optional short rationale"),
        }),
        execute: async ({ activityId, status, note }) => {
          if (!validActivityIds.has(activityId)) {
            return { ok: false, error: "Unknown activityId — not in context." };
          }
          await setFeedbackRow(profileId, activityId, status, note ?? undefined);
          const ref = index.activities.find((a) => a.id === activityId);
          const label = `${status[0].toUpperCase()}${status.slice(1)}: ${ref?.title ?? activityId}`;
          actionsTaken.push(label);
          return { ok: true, logged: label };
        },
      }),
      logDestinationDecision: tool({
        description:
          "Record the signed-in user's decision on a destination. Use only when the user clearly expresses love/like/maybe/skip.",
        inputSchema: z.object({
          destinationId: z.string().describe("Exact destination id from the context"),
          status: z.enum(DECISION),
          note: z.string().nullable().describe("Optional short rationale"),
        }),
        execute: async ({ destinationId, status, note }) => {
          if (!validDestinationIds.has(destinationId)) {
            return { ok: false, error: "Unknown destinationId — not in context." };
          }
          await setDestinationDecisionRow(profileId, destinationId, status, note ?? undefined);
          const ref = index.destinations.find((d) => d.id === destinationId);
          const label = `${status[0].toUpperCase()}${status.slice(1)}: ${ref?.name ?? destinationId}`;
          actionsTaken.push(label);
          return { ok: true, logged: label };
        },
      }),
    },
  });

  const contextIncluded: string[] = [
    req.plan ? `Target: ${req.plan.title}` : "No target plan (general)",
    `${req.favoritePlans?.length ?? 0} favorite plan(s)`,
    `${req.preferences?.length ?? 0} preferences`,
    `${index.activities.length} activities in scope`,
  ];

  return {
    message: text.trim() || "Done.",
    contextIncluded,
    actionsTaken,
    source: "ai",
  };
}
