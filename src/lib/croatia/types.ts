// src/lib/croatia/types.ts
//
// Data model for the Croatia trip planner. This is a SEPARATE fork from the
// SE Asia plan-comparison app: instead of comparing competing multi-country
// plans, Croatia is ONE fixed itinerary (Split -> Korcula -> Dubrovnik) where
// the core interaction is swapping activities per day and pulling live LLM
// recommendations.

export type CroatiaLocation = "Split" | "Korcula" | "Dubrovnik" | "Travel";

export type ActivityCategory =
  | "flight"
  | "transfer"
  | "lodging"
  | "food"
  | "culture"
  | "history"
  | "nature"
  | "beach"
  | "nightlife"
  | "relax"
  | "experience"
  | "celebration";

export type ActivitySource = "seed" | "curated" | "ai" | "custom";

// Where an activity sits in the day. Free-form label ("Morning", "12:15pm",
// "Afternoon") plus a coarse slot used for ordering/grouping.
export type DaySlot = "all-day" | "morning" | "afternoon" | "evening";

export interface ActivitySourceLink {
  title: string;
  url: string;
}

// The two travelers. Used for per-partner favorites + ratings and the compare
// matrix. Kept as a const tuple so seed data and UI share one source of truth.
export const TRAVELERS = ["Lucas", "Tobi"] as const;
export type Traveler = (typeof TRAVELERS)[number];

// Aggregated, human-readable reviews for an activity (e.g. Google / TripAdvisor).
export interface ActivityReviews {
  rating?: number; // out of 5, e.g. 4.6
  count?: number; // number of reviews
  source?: string; // "Google", "TripAdvisor", etc.
}

// Practical detail shown in the expandable card body. All optional — seed
// logistics may have none, AI/curated picks fill what they can.
export interface ActivityDetails {
  area?: string; // neighborhood / area, e.g. "Varoš, Split"
  address?: string;
  travelTime?: string; // "10-min walk from the Riva", "1.5-hr boat"
  bestTime?: string; // "Sunset", "Early morning to beat crowds"
  seasonNote?: string; // "Runs mid-July weekends; book ahead"
  priceLevel?: string; // "Free", "€", "€€", "€€€"
  reviews?: ActivityReviews;
  bookingUrl?: string;
  mapUrl?: string;
}

// One partner's take on an activity: a favorite heart and a 0-5 rating
// (0 = not rated yet).
export interface PartnerVote {
  favorite: boolean;
  rating: number;
}

export type ActivityVotes = Partial<Record<Traveler, PartnerVote>>;

export interface CroatiaActivity {
  id: string;
  dayId: string;
  position: number;
  slot: DaySlot;
  timeLabel?: string; // e.g. "12:15pm", "Morning", "PM"
  title: string;
  description: string;
  category: ActivityCategory;
  location: CroatiaLocation;
  source: ActivitySource;
  // Fixed logistics (flights, check-ins, the catamaran) cannot be swapped or
  // removed — they anchor the trip.
  locked?: boolean;
  tags?: string[];
  // Populated when an activity came from a live AI web-search recommendation.
  sourceLinks?: ActivitySourceLink[];
  // Rich, practical detail (area, travel time, reviews, price…).
  details?: ActivityDetails;
  // Per-partner favorites + ratings, keyed by traveler.
  votes?: ActivityVotes;
}

// Days are STATIC seed data (dates, locations, and titles come straight from
// the printed itinerary). Only the activities inside a day are mutable.
export interface CroatiaDay {
  id: string;
  dayNumber: number;
  dateISO: string; // "2026-07-03"
  dateLabel: string; // "Fri, Jul 3"
  location: CroatiaLocation;
  title: string;
  summary: string;
  // Lodging context shown in the day header (address etc.) when relevant.
  lodging?: { name: string; address: string };
  isBirthday?: boolean;
}

export interface CroatiaTrip {
  title: string;
  subtitle: string;
  travelers: string[];
  days: CroatiaDay[];
}

// ---------------------------------------------------------------------------
// Persisted state (assembled from the croatia_activities table)
// ---------------------------------------------------------------------------

export interface CroatiaState {
  schemaVersion: number;
  // activities grouped is derived client-side; the wire shape is a flat list.
  activities: CroatiaActivity[];
}

// ---------------------------------------------------------------------------
// AI contract (web-search recommendations + swap alternatives)
// ---------------------------------------------------------------------------

// "discover": fresh ideas for the day. "swap": replace one activity.
// "nearby": more things close to (and around the time of) an anchor activity.
export type RecommendKind = "discover" | "swap" | "nearby";

// Optional angle to steer the search — e.g. focus on food/restaurants.
export type RecommendFocus = "food" | "events";

export interface RecommendRequest {
  kind: RecommendKind;
  dayId: string;
  location: CroatiaLocation;
  dateISO: string;
  // For "swap": the activity being replaced (for context + same time slot).
  replacing?: {
    title: string;
    category: ActivityCategory;
    slot: DaySlot;
    timeLabel?: string;
  };
  // For "nearby": the activity we want options close to / around the time of.
  anchor?: {
    title: string;
    area?: string;
    slot: DaySlot;
    timeLabel?: string;
  };
  focus?: RecommendFocus;
  // Free-form steering from the user ("more food", "off the beaten path").
  note?: string;
}

export interface Suggestion {
  title: string;
  description: string;
  category: ActivityCategory;
  slot: DaySlot;
  timeLabel?: string;
  // Why this fits Lucas + Tobi / the day.
  whyItFits: string;
  // "live" if grounded in a current event/festival/Reddit thread this trip.
  liveSignal?: string;
  sourceLinks?: ActivitySourceLink[];
  // Practical detail to carry onto the card when added.
  details?: ActivityDetails;
}

export interface RecommendResponse {
  kind: RecommendKind;
  location: CroatiaLocation;
  summary: string;
  suggestions: Suggestion[];
  sources: ActivitySourceLink[];
}

// ---------------------------------------------------------------------------
// Compare / matrix helpers
// ---------------------------------------------------------------------------

export const DEFAULT_VOTE: PartnerVote = { favorite: false, rating: 0 };
