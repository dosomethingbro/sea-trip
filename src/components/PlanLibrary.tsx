// src/components/PlanLibrary.tsx
"use client";

import { useMemo, useState } from "react";
import type { Lineage } from "@/hooks/useWorkspace";
import { PlanCard } from "./PlanCard";
import { FilterChips, type ChipOption } from "./FilterChips";

const COUNTRY_OPTIONS: ChipOption[] = [
  { value: "Vietnam", label: "Vietnam" },
  { value: "Thailand", label: "Thailand" },
  { value: "Cambodia", label: "Cambodia" },
];

const DIFFICULTY_OPTIONS: ChipOption[] = [
  { value: "easy", label: "Easy logistics" },
  { value: "moderate", label: "Moderate" },
  { value: "involved", label: "Involved" },
];

export function PlanLibrary({
  lineages,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onOpen,
}: {
  lineages: Lineage[];
  compareIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [countries, setCountries] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const vibeOptions = useMemo<ChipOption[]>(() => {
    const all = new Set<string>();
    lineages.forEach((l) => l.activePlan.vibeTags.forEach((t) => all.add(t)));
    return Array.from(all)
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [lineages]);

  const [vibes, setVibes] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return lineages.filter((l) => {
      const p = l.activePlan;
      if (favoritesOnly && !l.isFavorite) return false;
      if (countries.length && !countries.every((c) => p.countries.includes(c as any))) return false;
      if (difficulties.length && !difficulties.includes(p.logisticsDifficulty)) return false;
      if (vibes.length && !vibes.some((v) => p.vibeTags.includes(v))) return false;
      return true;
    });
  }, [lineages, favoritesOnly, countries, difficulties, vibes]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  return (
    <div>
      <div className="card mb-6 space-y-4 p-5">
        <div>
          <p className="eyebrow mb-2">Countries (match all selected)</p>
          <FilterChips options={COUNTRY_OPTIONS} selected={countries} onToggle={toggle(setCountries)} />
        </div>
        <div>
          <p className="eyebrow mb-2">Logistics</p>
          <FilterChips options={DIFFICULTY_OPTIONS} selected={difficulties} onToggle={toggle(setDifficulties)} />
        </div>
        <div>
          <p className="eyebrow mb-2">Vibe (match any)</p>
          <FilterChips options={vibeOptions} selected={vibes} onToggle={toggle(setVibes)} />
        </div>
        <div className="flex items-center justify-between border-t border-forest/10 pt-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-forest">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={() => setFavoritesOnly((v) => !v)}
              className="hidden"
            />
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${favoritesOnly ? "border-clay bg-clay text-cream" : "border-forest/30 bg-white"}`}>
              {favoritesOnly ? "✓" : ""}
            </span>
            Favorites only
          </label>
          <span className="text-sm text-muted">
            {filtered.length} of {lineages.length} plans
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-muted">No plans match these filters.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <PlanCard
              key={l.lineageId}
              lineage={l}
              selectedForCompare={compareIds.includes(l.lineageId)}
              onToggleFavorite={onToggleFavorite}
              onToggleCompare={onToggleCompare}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
