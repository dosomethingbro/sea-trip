// src/components/TripHeader.tsx
"use client";

import { DATE_OPTIONS } from "@/lib/seedConfig";
import { PTOComparison } from "./PTOComparison";

export function TripHeader({
  activeDateOptionId,
  onSelectDateOption,
  onReset,
}: {
  activeDateOptionId: string;
  onSelectDateOption: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <header className="border-b border-forest/10 bg-cream-50/80">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Thanksgiving 2026 · Southeast Asia</p>
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Two countries, one good trip.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              A planning workspace — not a fixed itinerary. Compare options, favorite the ones you like, leave Keep /
              Drop / Defer feedback on activities, then let the assistant revise plans or build a hybrid from your
              favorites.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/croatia" className="btn btn-secondary text-xs">
              Croatia trip →
            </a>
            <button type="button" onClick={onReset} className="btn btn-ghost text-xs">
              Reset workspace
            </button>
          </div>
        </div>

        <div className="mt-6">
          <p className="eyebrow mb-2">Date options — pick the trade-off you’re sizing plans against</p>
          <PTOComparison options={DATE_OPTIONS} activeId={activeDateOptionId} onSelect={onSelectDateOption} />
        </div>
      </div>
    </header>
  );
}
