// src/lib/planDraft.ts
//
// Shared, framework-agnostic helper that turns a lightweight "plan draft"
// (the creative content the Claude assistant produces from a conversation)
// into a complete, internally-consistent TripPlan. Route, destinations and
// duration are derived from the day list so the assistant only has to supply
// the itinerary itself; scoring is optional with neutral defaults.

import { z } from "zod";
import type { TripPlan } from "@/lib/types";

const COUNTRY = z.enum(["Vietnam", "Thailand", "Cambodia", "Laos"]);

const draftActivitySchema = z.object({
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
  tags: z.array(z.string()).nullable(),
});

const draftDaySchema = z.object({
  title: z.string(),
  destination: z.string(),
  country: COUNTRY,
  summary: z.string(),
  activities: z.array(draftActivitySchema).min(1),
});

// Optional 0-10 scores. Claude may estimate these; otherwise we default to a
// neutral 5 so the comparison matrix still renders.
const draftScoresSchema = z
  .object({
    lucasFit: z.number().min(0).max(10),
    girlfriendFit: z.number().min(0).max(10),
    culture: z.number().min(0).max(10),
    relaxation: z.number().min(0).max(10),
    food: z.number().min(0).max(10),
    history: z.number().min(0).max(10),
    nature: z.number().min(0).max(10),
    coreMemory: z.number().min(0).max(10),
  })
  .nullable();

export const planDraftSchema = z.object({
  title: z.string().describe("Short, evocative plan name"),
  rationale: z
    .string()
    .describe("1-2 sentences on why this plan fits the couple's discussion + feedback"),
  vibeTags: z.array(z.string()).min(1).describe("3-6 short vibe tags"),
  ptoDays: z.number().int().min(0).describe("Estimated PTO days needed"),
  logisticsDifficulty: z.enum(["easy", "moderate", "involved"]),
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
  scores: draftScoresSchema,
  days: z.array(draftDaySchema).min(1).describe("Day-by-day itinerary, experiences first"),
});

export type PlanDraft = z.infer<typeof planDraftSchema>;

const NEUTRAL = 5;

let idSeq = 0;
function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

export function buildPlanFromDraft(draft: PlanDraft): TripPlan {
  const days = draft.days.map((d, i) => ({
    id: newId("day"),
    dayNumber: i + 1,
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
      tags: a.tags ?? undefined,
    })),
  }));

  // Derive route (ordered, de-duplicated destinations) and countries.
  const route: string[] = [];
  for (const d of days) if (!route.includes(d.destination)) route.push(d.destination);
  const countries = Array.from(new Set(days.map((d) => d.country)));

  const destinations = route.map((name) => {
    const dayForDest = days.find((d) => d.destination === name);
    return {
      id: newId("dest"),
      name,
      country: dayForDest?.country ?? countries[0],
      nights: days.filter((d) => d.destination === name).length,
      blurb: "",
    };
  });

  const scores = draft.scores ?? {
    lucasFit: NEUTRAL,
    girlfriendFit: NEUTRAL,
    culture: NEUTRAL,
    relaxation: NEUTRAL,
    food: NEUTRAL,
    history: NEUTRAL,
    nature: NEUTRAL,
    coreMemory: NEUTRAL,
  };

  return {
    id: newId("plan"),
    title: draft.title,
    route,
    countries,
    durationDays: days.length,
    ptoDays: draft.ptoDays,
    ptoEfficiency: scores.coreMemory,
    vibeTags: draft.vibeTags,
    logisticsDifficulty: draft.logisticsDifficulty,
    transferBurden: `${route.length} stops over ${days.length} days`,
    scores,
    pros: draft.pros,
    cons: draft.cons,
    whyChoose: draft.rationale,
    whySkip: "",
    destinations,
    days,
    seed: false,
  };
}
