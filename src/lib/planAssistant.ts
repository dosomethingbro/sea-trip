// src/lib/planAssistant.ts
//
// The "AI" engine. Today it is a deterministic mock that reacts to real
// feedback and prompt keywords. The API route (src/app/api/plan-assistant)
// calls runPlanAssistant(); to go live, replace the body of that route with a
// Claude/OpenAI call and keep this as the fallback. The request/response shapes
// are the contract either way.

import type {
  Activity,
  AnalyzeFavoritesResult,
  ConsoleResult,
  ItineraryDay,
  LLMPlanRequest,
  LLMPlanResponse,
  PlanScore,
  Recommendation,
  RevisedPlanResult,
  ScoreChange,
  TripPlan,
} from "./types";

let idSeq = 0;
function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)));
}

function overall(p: TripPlan): number {
  const s = p.scores;
  return (
    s.lucasFit * 0.18 +
    s.girlfriendFit * 0.18 +
    s.coreMemory * 0.16 +
    s.food * 0.14 +
    s.culture * 0.12 +
    s.nature * 0.1 +
    s.relaxation * 0.07 +
    s.history * 0.05
  );
}

function fitGap(p: TripPlan): number {
  return Math.abs(p.scores.lucasFit - p.scores.girlfriendFit);
}

function adventure(p: TripPlan): number {
  const diff = p.logisticsDifficulty === "involved" ? 3 : p.logisticsDifficulty === "moderate" ? 1.5 : 0;
  return p.scores.nature + p.scores.coreMemory + p.countries.length * 1.5 + diff;
}

function relaxScore(p: TripPlan): number {
  const diff = p.logisticsDifficulty === "involved" ? 3 : p.logisticsDifficulty === "moderate" ? 1.5 : 0;
  return p.scores.relaxation * 2 - diff + p.scores.girlfriendFit * 0.5;
}

function rec(p: TripPlan, rationale: string): Recommendation {
  return { planId: p.id, planTitle: p.title, rationale };
}

// ---------------------------------------------------------------------------
// Analyze favorites
// ---------------------------------------------------------------------------

function analyzeFavorites(req: LLMPlanRequest): AnalyzeFavoritesResult {
  const favs = (req.favoritePlans ?? []).slice();
  if (favs.length === 0) {
    const empty: Recommendation = {
      planTitle: "No favorites yet",
      rationale: "Favorite a couple of plans first, then run this again.",
    };
    return {
      bestOverall: empty,
      bestCompromise: empty,
      mostAdventurous: empty,
      mostRelaxed: empty,
      hybridRoute: { title: "—", route: [], rationale: "Add favorites to generate a hybrid." },
      tradeoffs: [],
      nextAction: "Open the Plan Library and favorite 2–3 plans.",
    };
  }

  const byOverall = [...favs].sort((a, b) => overall(b) - overall(a));
  const byCompromise = [...favs].sort(
    (a, b) => fitGap(a) - fitGap(b) || overall(b) - overall(a)
  );
  const byAdventure = [...favs].sort((a, b) => adventure(b) - adventure(a));
  const byRelax = [...favs].sort((a, b) => relaxScore(b) - relaxScore(a));

  const best = byOverall[0];
  const compromise = byCompromise[0];
  const adv = byAdventure[0];
  const relax = byRelax[0];

  // Hybrid: take the strongest opening leg and a contrasting finish.
  const opener = best.destinations[0]?.name ?? best.route[0];
  const second = best.destinations[1]?.name;
  const finisher =
    relax.destinations[relax.destinations.length - 1]?.name ??
    relax.route[relax.route.length - 1];
  const hybridRoute = Array.from(
    new Set([opener, second, finisher].filter(Boolean) as string[])
  );

  const prefNote = (req.preferences?.length ?? 0) > 0
    ? "weighed against your saved preferences (relaxed pace, two cultures, food-first)"
    : "based on plan scores alone";

  const feedbackCount = Object.values(req.feedback ?? {}).filter((f) => f.status).length;

  return {
    bestOverall: rec(
      best,
      `Highest weighted score across the favorites you starred, ${prefNote}. Strongest on ${topAxes(best)}.`
    ),
    bestCompromise: rec(
      compromise,
      `Smallest gap between your fit (${compromise.scores.lucasFit}/10) and hers (${compromise.scores.girlfriendFit}/10) — the most mutually satisfying pick.`
    ),
    mostAdventurous: rec(
      adv,
      `Most ground covered and biggest "core memory" payoff (${adv.scores.coreMemory}/10), at the cost of ${adv.logisticsDifficulty} logistics.`
    ),
    mostRelaxed: rec(
      relax,
      `Best decompression: relaxation ${relax.scores.relaxation}/10 with ${relax.logisticsDifficulty} logistics. The version you'd come home rested from.`
    ),
    hybridRoute: {
      title: `Hybrid: ${hybridRoute.join(" → ")}`,
      route: hybridRoute,
      rationale: `Opens with the strongest leg of "${best.title}" and ends on the calm finish of "${relax.title}" so the trip decompresses rather than sprints to the airport.`,
    },
    tradeoffs: buildTradeoffs(byOverall, feedbackCount),
    nextAction:
      feedbackCount > 0
        ? `Revise "${best.title}" with AI to fold in your ${feedbackCount} activity notes, then save it as a new version to compare.`
        : `Leave Keep/Drop/Defer notes on a few activities in "${best.title}", then Revise with AI for a tailored version.`,
  };
}

function topAxes(p: TripPlan): string {
  const entries: [string, number][] = [
    ["food", p.scores.food],
    ["culture", p.scores.culture],
    ["history", p.scores.history],
    ["nature", p.scores.nature],
    ["relaxation", p.scores.relaxation],
  ];
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k)
    .join(" + ");
}

function buildTradeoffs(sorted: TripPlan[], feedbackCount: number): string[] {
  const out: string[] = [];
  if (sorted.length >= 2) {
    const a = sorted[0];
    const b = sorted[1];
    out.push(
      `"${a.title}" wins on ${topAxes(a)}, but "${b.title}" is easier logistically (${b.logisticsDifficulty} vs ${a.logisticsDifficulty}).`
    );
  }
  const multi = sorted.filter((p) => p.countries.length > 1);
  const single = sorted.filter((p) => p.countries.length === 1);
  if (multi.length && single.length) {
    out.push(
      `Two-country options (${multi.map((p) => p.title).join(", ")}) add contrast but a travel day; single-country (${single
        .map((p) => p.title)
        .join(", ")}) trade variety for depth.`
    );
  }
  if (feedbackCount === 0) {
    out.push("No activity feedback yet — recommendations are score-based until you leave Keep/Drop/Defer notes.");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Prompt understanding (shared by revise + console)
// ---------------------------------------------------------------------------

interface Intent {
  compressToDays?: number;
  slower: boolean;
  fewerTemples: boolean;
  moreFoodMarkets: boolean;
  lessTouristy: boolean;
  forGirlfriend: boolean;
  moreNature: boolean;
}

function parseIntent(prompt?: string): Intent {
  const t = (prompt ?? "").toLowerCase();
  const dayMatch = t.match(/(\d+)\s*[- ]?day/);
  return {
    compressToDays: dayMatch ? parseInt(dayMatch[1], 10) : undefined,
    slower: /(slower|slow.?paced|less rushed|relax(ed)? pace|fewer activities|more downtime|breathe)/.test(t),
    fewerTemples: /(less temple|fewer temple|temple.?heavy|too many temple|less history)/.test(t),
    moreFoodMarkets: /(market|street food|food|eat|culinary|night market)/.test(t),
    lessTouristy: /(touristy|tourist trap|less crowded|off the beaten|authentic|local(?!\w))/.test(t),
    forGirlfriend: /(girlfriend|her|relax|scenery|beautiful|good vibe|cute|spa|comfortable)/.test(t),
    moreNature: /(nature|scenery|outdoors|landscape|mountain|beach|island|hike)/.test(t),
  };
}

function foodMarketActivity(destination: string): Activity {
  return {
    id: newId("act"),
    title: "Local market + street-food graze",
    type: "market",
    timeOfDay: "evening",
    description: `Skip a sit-down dinner and graze the neighborhood market stalls in ${destination} — added per your request for more markets and street food.`,
    location: destination,
    tags: ["market", "food", "added"],
  };
}

function relaxedActivity(destination: string): Activity {
  return {
    id: newId("act"),
    title: "Unstructured slow morning",
    type: "relax",
    timeOfDay: "morning",
    description: `A deliberately empty morning in ${destination} — coffee, wandering, no schedule. Added to ease the pace.`,
    location: destination,
    tags: ["relax", "added"],
  };
}

function natureActivity(destination: string): Activity {
  return {
    id: newId("act"),
    title: "Scenic viewpoint + nature time",
    type: "nature",
    timeOfDay: "afternoon",
    description: `Built-in scenery near ${destination} — a viewpoint or waterfall stop. Added for more nature and beautiful views.`,
    location: destination,
    tags: ["nature", "added"],
  };
}

// ---------------------------------------------------------------------------
// Revision engine (applies feedback + intent to a single plan)
// ---------------------------------------------------------------------------

function revisePlan(req: LLMPlanRequest): RevisedPlanResult {
  const source = req.plan;
  if (!source) {
    throw new Error("revise-plan requires a target plan");
  }
  const intent = parseIntent(req.prompt);
  const feedback = req.feedback ?? {};

  const kept: string[] = [];
  const dropped: string[] = [];
  const deferred: string[] = [];
  const added: string[] = [];

  // 1) Apply explicit activity feedback.
  let days: ItineraryDay[] = source.days.map((d) => {
    const activities: Activity[] = [];
    for (const a of d.activities) {
      const fb = feedback[a.id];
      const status = fb?.status;
      if (status === "drop") {
        dropped.push(a.title);
        continue;
      }
      if (status === "defer") {
        deferred.push(a.title);
        activities.push({
          ...a,
          tags: Array.from(new Set([...(a.tags ?? []), "deferred"])),
          description: `(Deferred / flex) ${a.description}`,
        });
        continue;
      }
      if (status === "love") {
        kept.push(`★ ${a.title}`);
        activities.push({
          ...a,
          tags: Array.from(new Set([...(a.tags ?? []), "loved"])),
        });
        continue;
      }
      if (status === "keep") kept.push(a.title);
      activities.push(a);
    }
    return { ...d, activities };
  });

  // 2) Fewer temples — thin out repeated history/temple activities, keep the marquee one per plan.
  if (intent.fewerTemples) {
    let templeSeen = 0;
    days = days.map((d) => {
      const activities = d.activities.filter((a) => {
        const isTemple = a.type === "history" || (a.type === "culture" && /temple|pagoda|wat/i.test(a.title));
        const marquee = (a.tags ?? []).includes("core memory");
        if (isTemple && !marquee) {
          templeSeen += 1;
          if (templeSeen % 2 === 0) {
            dropped.push(a.title);
            return false;
          }
        }
        return true;
      });
      return { ...d, activities };
    });
  }

  // 3) More food / markets — inject into a couple of days that lack a market.
  if (intent.moreFoodMarkets) {
    let injected = 0;
    days = days.map((d) => {
      const hasMarket = d.activities.some((a) => a.type === "market" || a.type === "food");
      if (!hasMarket && injected < 2) {
        injected += 1;
        const a = foodMarketActivity(d.destination);
        added.push(a.title);
        return { ...d, activities: [...d.activities, a] };
      }
      return d;
    });
  }

  // 4) Tune for girlfriend / relaxation — add a slow morning, lift relaxation score.
  if (intent.forGirlfriend || intent.slower) {
    const target = days.find((d) => d.activities.length >= 3) ?? days[Math.floor(days.length / 2)];
    if (target) {
      const a = relaxedActivity(target.destination);
      added.push(a.title);
      days = days.map((d) => (d.id === target.id ? { ...d, activities: [a, ...d.activities] } : d));
    }
  }

  // 5) More nature.
  if (intent.moreNature && !intent.forGirlfriend) {
    const target = days[Math.min(2, days.length - 1)];
    if (target) {
      const a = natureActivity(target.destination);
      added.push(a.title);
      days = days.map((d) => (d.id === target.id ? { ...d, activities: [...d.activities, a] } : d));
    }
  }

  // 6) Slower pace — cap activities per day.
  if (intent.slower) {
    days = days.map((d) => {
      if (d.activities.length > 3) {
        const trimmed = d.activities.slice(0, 3);
        d.activities.slice(3).forEach((a) => {
          if (!deferred.includes(a.title)) deferred.push(a.title);
        });
        return { ...d, activities: trimmed };
      }
      return d;
    });
  }

  // 7) Compress to N days.
  let durationDays = source.durationDays;
  if (intent.compressToDays && intent.compressToDays < days.length) {
    const keep = intent.compressToDays;
    const removed = days.slice(keep);
    removed.forEach((d) =>
      d.activities.forEach((a) => {
        if (!deferred.includes(a.title) && !dropped.includes(a.title)) deferred.push(a.title);
      })
    );
    days = days.slice(0, keep).map((d, i) => ({ ...d, dayNumber: i + 1 }));
    durationDays = keep;
  } else {
    days = days.map((d, i) => ({ ...d, dayNumber: i + 1 }));
  }

  // 8) Recompute a few scores from the changes.
  const nextScores: PlanScore = { ...source.scores };
  if (intent.fewerTemples) nextScores.history = clamp(nextScores.history - 2);
  if (intent.moreFoodMarkets) nextScores.food = clamp(nextScores.food + 1);
  if (intent.forGirlfriend || intent.slower) {
    nextScores.relaxation = clamp(nextScores.relaxation + 2);
    nextScores.girlfriendFit = clamp(nextScores.girlfriendFit + 1);
  }
  if (intent.moreNature) nextScores.nature = clamp(nextScores.nature + 1);
  if (intent.compressToDays && intent.compressToDays < source.days.length) {
    nextScores.relaxation = clamp(nextScores.relaxation - 1); // tighter trip
  }

  const scoreChanges: ScoreChange[] = (
    Object.keys(nextScores) as (keyof PlanScore)[]
  )
    .filter((k) => nextScores[k] !== source.scores[k])
    .map((k) => ({ label: k, from: source.scores[k], to: nextScores[k] }));

  const revised: TripPlan = {
    ...source,
    id: newId("plan"),
    title: revisionTitle(source.title, intent),
    durationDays,
    scores: nextScores,
    days,
    seed: false,
  };

  return {
    plan: revised,
    kept: dedupe(kept),
    dropped: dedupe(dropped),
    deferred: dedupe(deferred),
    added: dedupe(added),
    explanation: buildExplanation(intent, { kept, dropped, deferred, added }, req),
    scoreChanges,
    risks: buildRisks(revised, intent),
  };
}

function revisionTitle(base: string, intent: Intent): string {
  if (intent.compressToDays) return `${base} (${intent.compressToDays}-day)`;
  if (intent.forGirlfriend) return `${base} (relaxed cut)`;
  if (intent.fewerTemples) return `${base} (lighter on temples)`;
  if (intent.moreFoodMarkets) return `${base} (food-forward)`;
  if (intent.slower) return `${base} (slower pace)`;
  return `${base} (revised)`;
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function buildExplanation(
  intent: Intent,
  lists: { kept: string[]; dropped: string[]; deferred: string[]; added: string[] },
  req: LLMPlanRequest
): string {
  const parts: string[] = [];
  const fbCount = Object.values(req.feedback ?? {}).filter((f) => f.status).length;
  if (fbCount > 0) parts.push(`Applied your ${fbCount} activity decisions`);
  if (intent.fewerTemples) parts.push("thinned repeated temple stops while keeping the marquee one");
  if (intent.moreFoodMarkets) parts.push("added market/street-food time on lighter days");
  if (intent.forGirlfriend || intent.slower) parts.push("inserted unstructured downtime and eased the pace");
  if (intent.moreNature) parts.push("worked in more scenery");
  if (intent.compressToDays) parts.push(`compressed to ${intent.compressToDays} days, deferring the rest`);
  const summary = parts.length ? parts.join("; ") + "." : "Light revision based on the current plan.";
  return `${summary} Kept ${lists.kept.length}, dropped ${lists.dropped.length}, deferred ${lists.deferred.length}, added ${lists.added.length}.`;
}

function buildRisks(plan: TripPlan, intent: Intent): string[] {
  const risks: string[] = [];
  if (intent.compressToDays) {
    risks.push("Compressing days can strand a flight or hotel booking — re-check transfers before committing.");
  }
  if (plan.logisticsDifficulty === "involved") {
    risks.push("This route still has 2+ flights; a delay early eats into the beach/relax tail.");
  }
  if (plan.countries.includes("Vietnam") && plan.days.some((d) => /hoi an|hue|central/i.test(d.destination))) {
    risks.push("Central Vietnam in late November can catch late-rainy-season showers — keep a flex indoor option.");
  }
  if (risks.length === 0) {
    risks.push("No major logistics risks flagged for this revision.");
  }
  return risks;
}

// ---------------------------------------------------------------------------
// Console (freeform)
// ---------------------------------------------------------------------------

function runConsole(req: LLMPlanRequest): ConsoleResult {
  const intent = parseIntent(req.prompt);
  const context: string[] = [];
  if (req.plan) context.push(`Target plan: ${req.plan.title}`);
  if (req.favoritePlans?.length) context.push(`${req.favoritePlans.length} favorited plan(s)`);
  const fbCount = Object.values(req.feedback ?? {}).filter((f) => f.status).length;
  if (fbCount) context.push(`${fbCount} activity feedback note(s)`);
  if (req.preferences?.length) context.push(`${req.preferences.length} saved preference(s)`);
  if (req.dateOptionId) context.push(`Date option: ${req.dateOptionId}`);

  // If there is a target plan and an actionable intent, produce a proposed plan.
  const actionable =
    intent.compressToDays !== undefined ||
    intent.slower ||
    intent.fewerTemples ||
    intent.moreFoodMarkets ||
    intent.forGirlfriend ||
    intent.moreNature;

  if (req.plan && actionable) {
    const revision = revisePlan(req);
    return {
      message: `Here's a proposed revision of "${req.plan.title}". ${revision.explanation} Review the changes, then Apply to preview or Save as a new version.`,
      contextIncluded: context,
      proposedPlan: revision.plan,
      changeSummary: revision.explanation,
    };
  }

  // Otherwise respond conversationally with guidance.
  let message: string;
  if (/(3 options|three options|create.*options)/i.test(req.prompt ?? "")) {
    message =
      "I'd generate three directions from your feedback: (1) a food-forward two-country trip, (2) a single-country deep dive with more downtime, and (3) an adventurous temples-plus-beach loop. Favorite the plans you like and use Analyze Favorites to score them head-to-head, or open a specific plan and ask me to revise it.";
  } else if (/(swap|replace).*(thailand|cambodia|vietnam)/i.test(req.prompt ?? "")) {
    message =
      "To swap a country, open the two plans you want to mix and use the Hybrid Builder — pick the days you want to keep from each (e.g. keep the Vietnam legs, take Siem Reap from the Cambodia plan), and I'll assemble them into a new draft you can refine.";
  } else if (!req.plan) {
    message =
      "Open a plan first (or favorite a few) so I have something concrete to work on. Then ask me to make it slower, lighter on temples, more food-focused, better for your girlfriend, or a shorter day count.";
  } else {
    message =
      "Got it. Try a concrete instruction like “make this an 8-day version”, “add more markets and street food”, “make this slower-paced”, or “make this better for my girlfriend”, and I'll propose specific changes you can apply or save.";
  }

  return { message, contextIncluded: context };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function runPlanAssistant(req: LLMPlanRequest): LLMPlanResponse {
  switch (req.type) {
    case "analyze-favorites":
      return { type: req.type, analyze: analyzeFavorites(req) };
    case "revise-plan":
      return { type: req.type, revision: revisePlan(req) };
    case "console":
      return { type: req.type, console: runConsole(req) };
    default:
      return { type: "console", console: { message: "Unknown request type.", contextIncluded: [] } };
  }
}
