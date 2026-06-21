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

export type RecommendKind = "discover" | "swap";

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
  // Free-form steering from the user ("more food", "off the beaten path").
  note?: string;
}

export interface Suggestion {
  title: string;
  description: string;
  category: ActivityCategory;
  slot: DaySlot;
  timeLabel?: string;
  // Why this fits Lucas + his girlfriend / the day.
  whyItFits: string;
  // "live" if grounded in a current event/festival/Reddit thread this trip.
  liveSignal?: string;
  sourceLinks?: ActivitySourceLink[];
}

export interface RecommendResponse {
  kind: RecommendKind;
  location: CroatiaLocation;
  summary: string;
  suggestions: Suggestion[];
  sources: ActivitySourceLink[];
}
