// src/components/croatia/categoryMeta.ts
// Visual metadata for activity categories (label + chip classes). No emojis.

import type { ActivityCategory, CroatiaLocation } from "@/lib/croatia/types";

export const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; chip: string }
> = {
  flight: { label: "Flight", chip: "bg-adriatic/10 text-adriatic-700 border-adriatic/20" },
  transfer: { label: "Transfer", chip: "bg-adriatic/10 text-adriatic-700 border-adriatic/20" },
  lodging: { label: "Stay", chip: "bg-muted/10 text-muted border-muted/20" },
  food: { label: "Food", chip: "bg-clay/10 text-clay-600 border-clay/20" },
  culture: { label: "Culture", chip: "bg-forest/10 text-forest border-forest/20" },
  history: { label: "History", chip: "bg-forest/10 text-forest border-forest/20" },
  nature: { label: "Nature", chip: "bg-forest-500/10 text-forest-600 border-forest-500/20" },
  beach: { label: "Beach", chip: "bg-adriatic-500/10 text-adriatic-600 border-adriatic-500/20" },
  nightlife: { label: "Nightlife", chip: "bg-clay/10 text-clay-600 border-clay/20" },
  relax: { label: "Relax", chip: "bg-gold/10 text-clay-600 border-gold/30" },
  experience: { label: "Experience", chip: "bg-gold/15 text-clay-600 border-gold/30" },
  celebration: { label: "Celebration", chip: "bg-gold/20 text-clay-600 border-gold/40" },
};

export const LOCATION_META: Record<
  CroatiaLocation,
  { label: string; chip: string }
> = {
  Split: { label: "Split", chip: "bg-adriatic text-cream" },
  Korcula: { label: "Korčula", chip: "bg-forest text-cream" },
  Dubrovnik: { label: "Dubrovnik", chip: "bg-clay text-cream" },
  Travel: { label: "Travel", chip: "bg-muted text-cream" },
};

export const SLOT_LABEL: Record<string, string> = {
  "all-day": "All day",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};
