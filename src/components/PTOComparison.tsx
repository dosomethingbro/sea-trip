// src/components/PTOComparison.tsx
"use client";

import type { DateOption } from "@/lib/types";

export function PTOComparison({
  options,
  activeId,
  onSelect,
}: {
  options: DateOption[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const active = opt.id === activeId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              active
                ? "border-forest bg-forest text-cream shadow-lift"
                : "border-forest/15 bg-white/70 text-ink hover:border-forest/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wide ${active ? "text-gold-100" : "text-muted"}`}>
                {opt.label}
              </span>
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  active ? "border-cream bg-cream text-forest" : "border-forest/30"
                }`}
              >
                {active ? "✓" : ""}
              </span>
            </div>
            <div className="mt-2 font-display text-lg font-semibold leading-tight">
              {opt.departure} → {opt.returnDate}
            </div>
            <div className={`mt-1 text-sm ${active ? "text-cream/80" : "text-muted"}`}>
              {opt.ptoDays} PTO days · {opt.fullTravelDays} full travel days
            </div>
            <p className={`mt-2 text-xs ${active ? "text-cream/70" : "text-muted"}`}>{opt.note}</p>
          </button>
        );
      })}
    </div>
  );
}
