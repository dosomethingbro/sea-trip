// src/lib/aiSynthesis.ts
//
// Server-only. Real AI synthesis of a couples itinerary via the Vercel AI
// Gateway. Builds a structured prompt from both partners' favorites + feedback,
// asks the model for a full TripPlan (with days), and validates the output
// against a Zod schema before returning. The caller (route handler / server
// action) is responsible for falling back to the deterministic mock on failure.

import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/aiClient";
import type {
  LLMPlanRequest,
  SynthesizeItineraryResult,
  TripPlan,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Zod schema mirroring TripPlan. OpenAI strict mode (default in AI SDK 6)
// requires every property to be present, so we use .nullable() not .optional().
// ---------------------------------------------------------------------------

const activitySchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum([
    "food",
    "culture",
    "history",
    "nature",
    "market",
    "neighborhood",
    "transit",
    "relax",
    "experience",
  ]),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "flexible"]),
  location: z.string().nullable(),
  durationHours: z.number().nullable(),
  tags: z.array(z.string()).nullable(),
});

const daySchema = z.object({
  dayNumber: z.number().int(),
  title: z.string(),
  destination: z.string(),
  country: z.enum(["Vietnam", "Thailand", "Cambodia", "Laos"]),
  summary: z.string(),
  activities: z.array(activitySchema),
});

const scoresSchema = z.object({
  lucasFit: z.number(),
  girlfriendFit: z.number(),
  culture: z.number(),
  relaxation: z.number(),
  food: z.number(),
  history: z.number(),
  nature: z.number(),
  coreMemory: z.number(),
});

const synthSchema = z.object({
  title: z.string(),
  route: z.array(z.string()),
  countries: z.array(z.enum(["Vietnam", "Thailand", "Cambodia", "Laos"])),
  durationDays: z.number().int(),
  ptoDays: z.number().int(),
  vibeTags: z.array(z.string()),
  logisticsDifficulty: z.enum(["easy", "moderate", "involved"]),
  transferBurden: z.string(),
  scores: scoresSchema,
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  whyChoose: z.string(),
  whySkip: z.string(),
  days: z.array(daySchema),
  rationale: z.string(),
  overlapHighlights: z.array(z.string()),
  tradeoffs: z.array(z.string()),
});

type SynthSchema = z.infer<typeof synthSchema>;

let idSeq = 0;
function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

function buildPrompt(req: LLMPlanRequest): string {
  const bundles = req.couplesFeedback ?? [];
  const lines: string[] = [];

  lines.push(
    "You are a travel decision assistant for a couple planning a Southeast Asia trip.",
    "Both partners have independently starred plans and left keep/drop/defer/love notes on activities.",
    "Your job: synthesize ONE itinerary that maximizes OVERLAP — experiences BOTH partners independently favored — while honoring saved preferences.",
    "Trips begin with EXPERIENCES, not destinations: lead with the activities both partners loved, then arrange destinations around them.",
    "Avoid airport-hopping and over-scheduling. Cap roughly 3 activities per day. Keep a realistic transfer burden.",
    ""
  );

  for (const b of bundles) {
    lines.push(`### ${b.displayName} (${b.profileId})`);
    if (b.favoritePlans.length) {
      lines.push("Favorited plans:");
      for (const p of b.favoritePlans) {
        lines.push(
          `- "${p.title}" — route ${p.route.join(" → ")}; loves ${
            p.vibeTags.slice(0, 4).join(", ") || "n/a"
          }`
        );
        for (const day of p.days) {
          for (const a of day.activities) {
            const fb = b.feedback[a.id]?.status;
            if (fb === "love" || fb === "keep") {
              lines.push(`    • ${fb.toUpperCase()}: ${a.title} (${a.type}, ${day.destination})`);
            } else if (fb === "drop") {
              lines.push(`    • DROP: ${a.title} (avoid this kind of stop)`);
            }
          }
        }
      }
    } else {
      lines.push("(no favorites)");
    }
    lines.push("");
  }

  if (req.preferences?.length) {
    lines.push("### Saved preferences");
    for (const p of req.preferences) {
      lines.push(`- [${p.person}] ${p.text} (weight ${p.weight})`);
    }
    lines.push("");
  }

  if (req.dateOptionId) {
    lines.push(`Active date option: ${req.dateOptionId}.`);
  }
  if (req.constraints?.length) {
    lines.push(`Constraints: ${req.constraints.join("; ")}.`);
  }

  lines.push(
    "",
    "Produce a complete itinerary with day-by-day activities. Scores are 0-10.",
    "In overlapHighlights, name the specific experiences both partners independently favored.",
    "In tradeoffs, explain where one partner compromised and why the result still serves both."
  );

  return lines.join("\n");
}

function toTripPlan(out: SynthSchema, req: LLMPlanRequest): TripPlan {
  const days = out.days.map((d, i) => ({
    id: newId("day"),
    dayNumber: d.dayNumber || i + 1,
    title: d.title,
    destination: d.destination,
    country: d.country,
    summary: d.summary,
    activities: d.activities.map((a) => ({
      id: newId("act"),
      title: a.title,
      description: a.description,
      type: a.type,
      timeOfDay: a.timeOfDay,
      location: a.location ?? undefined,
      durationHours: a.durationHours ?? undefined,
      tags: a.tags ?? undefined,
    })),
  }));

  const route = out.route.length
    ? out.route
    : Array.from(new Set(days.map((d) => d.destination)));
  const countries = out.countries.length
    ? out.countries
    : Array.from(new Set(days.map((d) => d.country)));

  const destinations = route.map((name) => ({
    id: newId("dest"),
    name,
    country: days.find((d) => d.destination === name)?.country ?? countries[0],
    nights: days.filter((d) => d.destination === name).length,
    blurb: "",
  }));

  return {
    id: newId("plan"),
    title: out.title,
    route,
    countries,
    durationDays: out.durationDays || days.length,
    ptoDays: out.ptoDays,
    ptoEfficiency: out.scores.coreMemory,
    vibeTags: out.vibeTags,
    logisticsDifficulty: out.logisticsDifficulty,
    transferBurden: out.transferBurden,
    scores: out.scores,
    pros: out.pros,
    cons: out.cons,
    whyChoose: out.whyChoose,
    whySkip: out.whySkip,
    destinations,
    days,
    seed: false,
  };
}

export async function synthesizeItinerary(
  req: LLMPlanRequest
): Promise<SynthesizeItineraryResult> {
  const { experimental_output } = await generateText({
    model: getModel(),
    system:
      "You are a precise travel-planning assistant. Always return a complete, internally consistent itinerary that maximizes the couple's shared interests.",
    prompt: buildPrompt(req),
    experimental_output: Output.object({ schema: synthSchema }),
  });

  const out = experimental_output;
  const proposedPlan = toTripPlan(out, req);

  // Structural guard: a usable plan must have at least one day with activities.
  if (proposedPlan.days.length === 0 || proposedPlan.days.every((d) => d.activities.length === 0)) {
    throw new Error("AI synthesis produced an empty itinerary");
  }

  return {
    proposedPlan,
    rationale: out.rationale,
    overlapHighlights: out.overlapHighlights,
    tradeoffs: out.tradeoffs,
    source: "ai",
  };
}
