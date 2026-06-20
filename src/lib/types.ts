// src/lib/types.ts
// Single source of truth for the planning workspace data model.

export type Country = "Vietnam" | "Thailand" | "Cambodia" | "Laos";

export type Person = "lucas" | "girlfriend" | "both";

// An owning profile (a real human seat in the workspace). Distinct from
// `Person`, which includes the synthetic "both" used for shared preferences.
// Phase 2 maps each authenticated account to one ProfileId via a membership row.
export type ProfileId = "lucas" | "girlfriend";

export type PreferenceCategory =
  | "food"
  | "history"
  | "nature"
  | "markets"
  | "logistics"
  | "relaxation"
  | "lodging"
  | "pace"
  | "culture";

export type ActivityType =
  | "food"
  | "culture"
  | "history"
  | "nature"
  | "market"
  | "neighborhood"
  | "transit"
  | "relax"
  | "experience";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "flexible";

export type FeedbackStatus = "keep" | "drop" | "defer" | "love" | null;

// Destination-level decisions are intentionally a DIFFERENT vocabulary from
// activity feedback (Constitution reconciliation #3).
export type DestinationDecisionStatus = "love" | "like" | "maybe" | "skip";

export type LogisticsDifficulty = "easy" | "moderate" | "involved";

export type VersionKind = "original" | "ai-revision" | "hybrid" | "custom";

export type LLMRequestType =
  | "analyze-favorites"
  | "revise-plan"
  | "console"
  | "synthesize-itinerary";

// ---------------------------------------------------------------------------
// Trip building blocks
// ---------------------------------------------------------------------------

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  timeOfDay: TimeOfDay;
  location?: string;
  durationHours?: number;
  tags?: string[];
  // Optional deeper-hierarchy fields (Constitution reconciliation #2). Kept as
  // optional fields rather than tables so existing seed plans stay valid.
  neighborhood?: string;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  destination: string;
  country: Country;
  summary: string;
  activities: Activity[];
}

export interface Destination {
  id: string;
  name: string;
  country: Country;
  nights: number;
  blurb: string;
  // Optional deeper-hierarchy field (Constitution reconciliation #2).
  region?: string;
}

// Destination-level decision record (parallels ActivityFeedback).
export interface DestinationDecision {
  status: DestinationDecisionStatus;
  note?: string;
  updatedAt: string; // ISO
}

export interface PlanScore {
  lucasFit: number; // 0-10
  girlfriendFit: number; // 0-10
  culture: number; // 0-10
  relaxation: number; // 0-10
  food: number; // 0-10
  history: number; // 0-10
  nature: number; // 0-10
  coreMemory: number; // 0-10 "core memory" potential
}

export interface TripPlan {
  id: string;
  title: string;
  route: string[]; // ordered destination names
  countries: Country[];
  durationDays: number; // full travel days this plan is sized for
  ptoDays: number;
  ptoEfficiency: number; // 0-10 — memory per PTO day
  vibeTags: string[];
  logisticsDifficulty: LogisticsDifficulty;
  transferBurden: string; // e.g. "2 flights + 1 scenic drive"
  scores: PlanScore;
  pros: string[];
  cons: string[];
  whyChoose: string;
  whySkip: string;
  destinations: Destination[];
  days: ItineraryDay[];
  seed?: boolean;
}

// ---------------------------------------------------------------------------
// Versioning
// ---------------------------------------------------------------------------

export interface PlanVersion {
  id: string;
  lineageId: string; // groups versions of the same plan
  label: string; // "Original", "AI Revision 1", "Custom Hybrid"
  kind: VersionKind;
  createdAt: string; // ISO
  plan: TripPlan; // full snapshot
  changeSummary?: string;
  parentVersionId?: string;
}

// ---------------------------------------------------------------------------
// Feedback & preferences
// ---------------------------------------------------------------------------

export interface ActivityFeedback {
  status: FeedbackStatus;
  note?: string;
  updatedAt: string; // ISO
}

export interface Preference {
  id: string;
  person: Person;
  category: PreferenceCategory;
  text: string;
  weight: number; // 1-5
}

export interface DateOption {
  id: string;
  label: string;
  departure: string;
  returnDate: string;
  ptoDays: number;
  fullTravelDays: number;
  note: string;
}

// ---------------------------------------------------------------------------
// Hybrid builder
// ---------------------------------------------------------------------------

export interface HybridPick {
  sourcePlanId: string;
  sourcePlanTitle: string;
  dayId: string;
}

export interface HybridPlanSelection {
  title: string;
  picks: HybridPick[];
}

// ---------------------------------------------------------------------------
// LLM contract
// ---------------------------------------------------------------------------

// One partner's decision footprint, used to synthesize a couples itinerary
// that optimizes for OVERLAP (Constitution: design FOR Lucas and Tobi).
export interface ProfileFeedbackBundle {
  profileId: ProfileId;
  displayName: string;
  favoritePlans: TripPlan[]; // plans this profile starred
  feedback: Record<string, ActivityFeedback>; // activityId -> this profile's feedback
}

export interface LLMPlanRequest {
  type: LLMRequestType;
  prompt?: string; // freeform console input
  dateOptionId?: string;
  plan?: TripPlan; // target for revise-plan / console
  favoritePlans?: TripPlan[]; // for analyze-favorites
  feedback?: Record<string, ActivityFeedback>; // activityId -> feedback
  preferences?: Preference[];
  constraints?: string[];
  // For "synthesize-itinerary": both partners' favorites + feedback.
  couplesFeedback?: ProfileFeedbackBundle[];
}

export interface Recommendation {
  planId?: string;
  planTitle: string;
  rationale: string;
}

export interface HybridSuggestion {
  title: string;
  route: string[];
  rationale: string;
}

export interface AnalyzeFavoritesResult {
  bestOverall: Recommendation;
  bestCompromise: Recommendation;
  mostAdventurous: Recommendation;
  mostRelaxed: Recommendation;
  hybridRoute: HybridSuggestion;
  tradeoffs: string[];
  nextAction: string;
}

export interface ScoreChange {
  label: string;
  from: number;
  to: number;
}

export interface RevisedPlanResult {
  plan: TripPlan; // new revised plan (not saved server-side)
  kept: string[];
  dropped: string[];
  deferred: string[];
  added: string[];
  explanation: string;
  scoreChanges: ScoreChange[];
  risks: string[];
}

export interface ConsoleResult {
  message: string;
  contextIncluded: string[];
  proposedPlan?: TripPlan;
  changeSummary?: string;
}

export interface SynthesizeItineraryResult {
  proposedPlan: TripPlan; // full, editable plan with days — saved as a PlanVersion
  rationale: string; // why this itinerary serves both partners
  overlapHighlights: string[]; // experiences both partners independently favored
  tradeoffs: string[]; // where one partner compromised, and why it's worth it
  source: "ai" | "fallback"; // provenance for the UI
}

export interface LLMPlanResponse {
  type: LLMRequestType;
  analyze?: AnalyzeFavoritesResult;
  revision?: RevisedPlanResult;
  console?: ConsoleResult;
  synthesize?: SynthesizeItineraryResult;
}

// ---------------------------------------------------------------------------
// Persisted workspace shape
// ---------------------------------------------------------------------------

export interface WorkspaceState {
  schemaVersion: number;
  versions: PlanVersion[]; // every plan + its revisions/hybrids
  activeVersionByLineage: Record<string, string>; // lineageId -> versionId shown in library
  favoriteIds: string[]; // lineageIds
  feedback: Record<string, ActivityFeedback>; // activityId -> feedback
  destinationDecisions: Record<string, DestinationDecision>; // destinationId -> decision
  preferences: Preference[];
  activeDateOptionId: string;
  northStar?: string; // workspace-level guiding intent (experience-first anchor)
}

// ---------------------------------------------------------------------------
// Live intelligence seam (Constitution reconciliation #4)
//
// DEFERRED for now — no fetching happens yet. This type only reserves the shape
// so weather/festivals/sentiment/etc. can plug in later without a refactor.
// ---------------------------------------------------------------------------

export type LiveSignalKind =
  | "weather"
  | "festival"
  | "sentiment"
  | "event"
  | "safety"
  | "flight";

export interface LiveSignal {
  kind: LiveSignalKind;
  destinationId?: string;
  summary: string;
  detail?: string;
  fetchedAt: string; // ISO
}
