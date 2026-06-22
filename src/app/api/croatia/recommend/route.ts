// src/app/api/croatia/recommend/route.ts
//
// Server-only. Produces live, source-grounded activity recommendations for a
// Croatia day. Two-step pipeline:
//   1) RESEARCH with a web-search model (Perplexity Sonar) — pulls current
//      events/festivals + Reddit/forum sentiment for the location & dates,
//      returning real source URLs.
//   2) STRUCTURE that research into typed Suggestions (with practical details)
//      using a fast model.
// Falls back to the curated library if the AI pipeline fails, so the UI never
// dead-ends.

import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { CURATED_IDEAS } from "@/lib/croatia/curated";
import type {
  ActivitySourceLink,
  RecommendRequest,
  RecommendResponse,
  Suggestion,
} from "@/lib/croatia/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RESEARCH_MODEL = "perplexity/sonar-pro";
const STRUCTURE_MODEL = "openai/gpt-5.4-mini";

const CATEGORIES = [
  "food",
  "culture",
  "history",
  "nature",
  "beach",
  "nightlife",
  "relax",
  "experience",
  "celebration",
] as const;

const SLOTS = ["all-day", "morning", "afternoon", "evening"] as const;

const detailsSchema = z.object({
  area: z.string().nullable().describe("Neighborhood / area, e.g. 'Varoš, Split'."),
  travelTime: z
    .string()
    .nullable()
    .describe("How to get there / how long from the town center or the anchor activity."),
  bestTime: z.string().nullable().describe("Best time of day to go."),
  seasonNote: z
    .string()
    .nullable()
    .describe("Dated/seasonal note, e.g. 'Open Tue–Sun in July; book ahead'."),
  priceLevel: z.string().nullable().describe("Free, €, €€, or €€€."),
  rating: z.number().nullable().describe("Review rating out of 5 if known, e.g. 4.6."),
  reviewCount: z.number().nullable().describe("Approx number of reviews if known."),
  reviewSource: z.string().nullable().describe("Where the rating is from, e.g. 'Google'."),
});

const suggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z.enum(CATEGORIES),
        slot: z.enum(SLOTS),
        timeLabel: z.string().nullable(),
        whyItFits: z.string(),
        liveSignal: z
          .string()
          .nullable()
          .describe(
            "A one-line note IF this is tied to a current event/festival/Reddit tip for these dates; otherwise null."
          ),
        sourceUrls: z
          .array(z.string())
          .describe("URLs from the research that back this suggestion."),
        details: detailsSchema,
      })
    )
    .min(3)
    .max(6),
  summary: z.string(),
});

const TRAVELER_PROFILE = `The travelers are Lucas and Tobi (two people traveling together). They like:
- Authentic local culture and food over polished tourist versions
- Wandering neighborhoods and eating their way through them
- Beautiful scenery, swimming, and a mix of culture + nature
- Relaxed pacing, not over-scheduled checklists
- Characterful (not luxury) experiences and genuine "core memory" moments
One day is Lucas's birthday in Dubrovnik (July 8).`;

function curatedFallback(req: RecommendRequest): RecommendResponse {
  const loc = req.location === "Travel" ? "Split" : req.location;
  let ideas = CURATED_IDEAS[loc] ?? [];
  if (req.focus === "food") {
    const food = ideas.filter((i) => i.category === "food");
    if (food.length) ideas = food;
  }
  const suggestions: Suggestion[] = ideas.slice(0, 5).map((i) => ({
    title: i.title,
    description: i.description,
    category: i.category,
    slot: i.slot,
    whyItFits:
      "Hand-picked local favorite that matches your relaxed, food-and-scenery style.",
    details: i.details,
  }));
  return {
    kind: req.kind,
    location: req.location,
    summary:
      "Showing curated local favorites (live web results weren't available just now).",
    suggestions,
    sources: [],
  };
}

function extractSources(raw: unknown): ActivitySourceLink[] {
  if (!Array.isArray(raw)) return [];
  const out: ActivitySourceLink[] = [];
  const seen = new Set<string>();
  for (const s of raw) {
    const url: string | undefined = s?.url ?? s?.sourceURL ?? s?.id;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    let host = url;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* keep raw */
    }
    out.push({ title: s?.title || host, url });
  }
  return out;
}

export async function POST(request: Request) {
  let body: RecommendRequest;
  try {
    body = (await request.json()) as RecommendRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.location || !body?.dateISO) {
    return NextResponse.json({ error: "Missing location/date" }, { status: 400 });
  }

  const place =
    body.location === "Travel"
      ? "the Croatian coast (transit day)"
      : `${body.location}, Croatia`;

  let intent: string;
  if (body.kind === "swap" && body.replacing) {
    intent = `The traveler wants to REPLACE this activity: "${body.replacing.title}" (${body.replacing.category}, ${body.replacing.slot}${
      body.replacing.timeLabel ? `, ${body.replacing.timeLabel}` : ""
    }). Suggest alternatives that fit the same time slot.`;
  } else if (body.kind === "nearby" && body.anchor) {
    intent = `The traveler is doing "${body.anchor.title}"${
      body.anchor.area ? ` in/around ${body.anchor.area}` : ""
    }${
      body.anchor.timeLabel ? ` around ${body.anchor.timeLabel}` : ""
    }. Suggest things that are PHYSICALLY CLOSE and good to combine right before/after it (a short walk away), ideally around the same time of day.`;
  } else {
    intent = `The traveler wants fresh ideas to add to their day in ${place}.`;
  }

  const focusLine =
    body.focus === "food"
      ? "FOCUS: food only — specific restaurants, konobas, bakeries, markets, wine/cocktail bars. Include signature dishes and price level."
      : body.focus === "events"
        ? "FOCUS: live events — concerts, festivals, markets, and happenings on these dates."
        : "";

  const steer = body.note ? `Extra steering from the traveler: "${body.note}".` : "";

  const researchPrompt = `You are a local Croatia travel scout. Research CURRENT, real, specific things to do in ${place} around ${body.dateISO} (summer 2026).

${TRAVELER_PROFILE}

${intent}
${focusLine}
${steer}

Find and report, with concrete details and source links:
1. Any festivals, concerts, markets, or events happening on or near ${body.dateISO}.
2. Specific, well-reviewed local restaurants, konobas, bars, beaches, viewpoints, or experiences — include the neighborhood/area, rough walking time from the center, the best time to go, price level, and a review rating if you know it.
3. Recent first-hand tips and warnings from Reddit (r/Croatia, r/travel), TripAdvisor, or travel forums — quote the gist.
Prioritize authentic, local, scenery- and food-forward picks over generic tourist traps. Always cite sources.`;

  try {
    // Step 1 — live web research (returns text + real sources).
    const research = await generateText({
      model: RESEARCH_MODEL,
      prompt: researchPrompt,
    });

    const sources = extractSources(
      (research as unknown as { sources?: unknown }).sources
    );

    // Step 2 — structure the research into typed suggestions.
    const { experimental_output: structured } = await generateText({
      model: STRUCTURE_MODEL,
      system:
        "Convert travel research into concrete, addable itinerary suggestions. Only use places/events that appear in the research. Keep descriptions to 1-2 sentences. Fill the details object (area, travelTime, bestTime, seasonNote, priceLevel, rating, reviewCount, reviewSource) from the research where available; use null for anything unknown. Set liveSignal only when a suggestion is tied to a dated event or a specific recent forum tip. Put backing URLs (from the research) into sourceUrls.",
      prompt: `Research notes for ${place} around ${body.dateISO}:\n\n${research.text}\n\nKnown source URLs:\n${sources
        .map((s) => `- ${s.url}`)
        .join("\n")}\n\n${intent}\n${focusLine}\n${steer}\nProduce 4-6 suggestions tuned to the travelers.`,
      experimental_output: Output.object({ schema: suggestionSchema }),
    });

    const urlToSource = new Map(sources.map((s) => [s.url, s]));
    const suggestions: Suggestion[] = structured.suggestions.map((s) => {
      const d = s.details;
      const hasReviews =
        d.rating != null || d.reviewCount != null || d.reviewSource != null;
      return {
        title: s.title,
        description: s.description,
        category: s.category,
        slot: s.slot,
        timeLabel: s.timeLabel ?? undefined,
        whyItFits: s.whyItFits,
        liveSignal: s.liveSignal ?? undefined,
        sourceLinks: (s.sourceUrls ?? [])
          .map((u) => urlToSource.get(u))
          .filter((x): x is ActivitySourceLink => !!x),
        details: {
          area: d.area ?? undefined,
          travelTime: d.travelTime ?? undefined,
          bestTime: d.bestTime ?? undefined,
          seasonNote: d.seasonNote ?? undefined,
          priceLevel: d.priceLevel ?? undefined,
          reviews: hasReviews
            ? {
                rating: d.rating ?? undefined,
                count: d.reviewCount ?? undefined,
                source: d.reviewSource ?? undefined,
              }
            : undefined,
        },
      };
    });

    const response: RecommendResponse = {
      kind: body.kind,
      location: body.location,
      summary: structured.summary,
      suggestions,
      sources,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[v0] croatia recommend error:", err);
    return NextResponse.json(curatedFallback(body));
  }
}
