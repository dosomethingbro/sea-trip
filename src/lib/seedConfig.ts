// src/lib/seedConfig.ts
import type { DateOption, Preference } from "./types";

export const DATE_OPTIONS: DateOption[] = [
  {
    id: "opt-1",
    label: "Option 1 — Long",
    departure: "Fri, Nov 20, 2026 (late)",
    returnDate: "Sat, Dec 5, 2026",
    ptoDays: 7,
    fullTravelDays: 12,
    note: "Maximum trip. Enough room for two countries without rushing.",
  },
  {
    id: "opt-2",
    label: "Option 2 — Lean",
    departure: "Tue, Nov 24, 2026 (late)",
    returnDate: "Sat, Dec 5, 2026",
    ptoDays: 5,
    fullTravelDays: 8,
    note: "Fewer PTO days. Best for one country deep, or two with tight pacing.",
  },
];

export const SEED_PREFERENCES: Preference[] = [
  // Lucas
  { id: "pref-l1", person: "lucas", category: "history", text: "Likes history with meaningful stories, not just monuments to tick off", weight: 4 },
  { id: "pref-l2", person: "lucas", category: "food", text: "Likes wandering neighborhoods and eating his way through them", weight: 5 },
  { id: "pref-l3", person: "lucas", category: "pace", text: "Dislikes over-scheduled checklist trips", weight: 4 },
  { id: "pref-l4", person: "lucas", category: "culture", text: "Likes authentic, local culture over polished tourist versions", weight: 5 },

  // Girlfriend
  { id: "pref-g1", person: "girlfriend", category: "logistics", text: "Likes enough structure to reduce day-to-day stress", weight: 4 },
  { id: "pref-g2", person: "girlfriend", category: "nature", text: "Likes beautiful scenery and experiencing different cultures", weight: 5 },
  { id: "pref-g3", person: "girlfriend", category: "relaxation", text: "Likes relaxed good vibes, markets, cute neighborhoods, shared experiences", weight: 5 },
  { id: "pref-g4", person: "girlfriend", category: "lodging", text: "Not luxury or spa-first — comfortable and characterful is the goal", weight: 3 },

  // Both
  { id: "pref-b1", person: "both", category: "culture", text: "Want two countries if it genuinely makes sense, not just to say they did", weight: 4 },
  { id: "pref-b2", person: "both", category: "food", text: "Want consistently good food throughout", weight: 5 },
  { id: "pref-b3", person: "both", category: "nature", text: "Want a mix of culture and scenery", weight: 4 },
  { id: "pref-b4", person: "both", category: "pace", text: "Prefer relaxed pacing over cramming", weight: 5 },
];
