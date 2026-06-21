"use client";

import type { CroatiaActivity, CroatiaDay } from "@/lib/croatia/types";
import { ActivityRow } from "./ActivityRow";
import { LOCATION_META } from "./categoryMeta";

interface Props {
  day: CroatiaDay;
  activities: CroatiaActivity[];
  onSwap: (activity: CroatiaActivity) => void;
  onRemove: (id: string) => void;
  onDiscover: (day: CroatiaDay) => void;
}

export function DayCard({ day, activities, onSwap, onRemove, onDiscover }: Props) {
  const loc = LOCATION_META[day.location];

  return (
    <article className="relative">
      {/* timeline node */}
      <div className="absolute -left-[1.6rem] top-2 hidden h-3 w-3 rounded-full border-2 border-cream bg-adriatic md:block" />

      <div className="card overflow-hidden">
        {/* header */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-forest/10 bg-cream-100/60 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-adriatic font-display text-sm font-bold text-cream">
            {day.dayNumber}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-adriatic-700">
                {day.title}
              </h3>
              <span className={`chip ${loc.chip} !px-2.5 !py-0.5 text-[10px]`}>
                {loc.label}
              </span>
              {day.isBirthday && (
                <span className="chip border border-gold/40 bg-gold/20 !px-2.5 !py-0.5 text-[10px] text-clay-600">
                  Birthday
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-muted">
              {day.dateLabel}, 2026
            </p>
          </div>
        </header>

        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed text-forest-600">{day.summary}</p>

          {day.lodging && (
            <p className="mt-1.5 text-xs text-muted">
              <span className="font-semibold text-forest">Stay:</span>{" "}
              {day.lodging.name} — {day.lodging.address}
            </p>
          )}

          <ul className="mt-3 space-y-2">
            {activities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                onSwap={onSwap}
                onRemove={onRemove}
              />
            ))}
          </ul>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onDiscover(day)}
              className="btn btn-secondary text-xs"
            >
              Add ideas / live recommendations
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
