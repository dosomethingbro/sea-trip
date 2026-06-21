"use client";

import type { CroatiaActivity } from "@/lib/croatia/types";
import { CATEGORY_META } from "./categoryMeta";

interface Props {
  activity: CroatiaActivity;
  onSwap: (activity: CroatiaActivity) => void;
  onRemove: (id: string) => void;
}

export function ActivityRow({ activity, onSwap, onRemove }: Props) {
  const cat = CATEGORY_META[activity.category];
  const isLive = activity.tags?.includes("live");

  return (
    <li className="group relative flex gap-3 rounded-xl border border-forest/10 bg-white/70 p-3 transition-shadow hover:shadow-card">
      {/* time rail */}
      <div className="flex w-16 shrink-0 flex-col items-start pt-0.5">
        <span className="text-xs font-semibold text-adriatic-700">
          {activity.timeLabel ?? ""}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
          {activity.slot === "all-day" ? "All day" : activity.slot}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-[15px] font-semibold leading-tight text-ink">
            {activity.title}
          </h4>
          <span className={`chip border ${cat.chip} !px-2 !py-0.5 text-[10px]`}>
            {cat.label}
          </span>
          {activity.locked && (
            <span className="chip border border-muted/30 bg-muted/5 !px-2 !py-0.5 text-[10px] text-muted">
              Fixed
            </span>
          )}
          {activity.source === "ai" && (
            <span className="chip border border-clay/30 bg-clay/10 !px-2 !py-0.5 text-[10px] text-clay-600">
              AI pick
            </span>
          )}
          {isLive && (
            <span className="chip border border-gold/40 bg-gold/15 !px-2 !py-0.5 text-[10px] text-clay-600">
              Live
            </span>
          )}
        </div>

        {activity.description && (
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {activity.description}
          </p>
        )}

        {activity.sourceLinks && activity.sourceLinks.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activity.sourceLinks.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-adriatic/15 bg-adriatic/5 px-2 py-0.5 text-[10px] font-medium text-adriatic-700 hover:border-adriatic/40"
              >
                {s.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* actions */}
      {!activity.locked && (
        <div className="flex shrink-0 flex-col items-end gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onSwap(activity)}
            className="rounded-full border border-adriatic/20 bg-white px-3 py-1 text-xs font-semibold text-adriatic-700 hover:border-adriatic/50"
          >
            Swap
          </button>
          <button
            type="button"
            onClick={() => onRemove(activity.id)}
            className="rounded-full px-3 py-1 text-xs font-medium text-muted hover:text-clay-600"
          >
            Remove
          </button>
        </div>
      )}
    </li>
  );
}
