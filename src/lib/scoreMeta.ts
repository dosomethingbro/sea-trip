// src/lib/scoreMeta.ts
import type { PlanScore } from "./types";

export const SCORE_LABELS: { key: keyof PlanScore; label: string; short: string }[] = [
  { key: "lucasFit", label: "Lucas fit", short: "Lucas" },
  { key: "girlfriendFit", label: "Girlfriend fit", short: "Her" },
  { key: "culture", label: "Culture", short: "Culture" },
  { key: "food", label: "Food", short: "Food" },
  { key: "history", label: "History", short: "History" },
  { key: "nature", label: "Nature", short: "Nature" },
  { key: "relaxation", label: "Relaxation", short: "Relax" },
  { key: "coreMemory", label: "Core memory", short: "Core mem." },
];

export function scoreColor(value: number): string {
  if (value >= 9) return "text-forest";
  if (value >= 7) return "text-forest-500";
  if (value >= 5) return "text-gold";
  return "text-clay";
}

export function scoreBarColor(value: number): string {
  if (value >= 9) return "bg-forest";
  if (value >= 7) return "bg-forest-500";
  if (value >= 5) return "bg-gold";
  return "bg-clay-400";
}

export const ACTIVITY_TYPE_META: Record<string, { label: string; dot: string }> = {
  food: { label: "Food", dot: "bg-clay" },
  culture: { label: "Culture", dot: "bg-forest-500" },
  history: { label: "History", dot: "bg-forest" },
  market: { label: "Market", dot: "bg-gold" },
  nature: { label: "Nature", dot: "bg-forest-600" },
  neighborhood: { label: "Neighborhood", dot: "bg-clay-400" },
  transit: { label: "Transit", dot: "bg-muted" },
  relax: { label: "Relax", dot: "bg-gold-400" },
  experience: { label: "Experience", dot: "bg-clay-600" },
};
