// src/components/ActivityCard.tsx
"use client";

import type { Activity, ActivityFeedback, FeedbackStatus } from "@/lib/types";
import { ACTIVITY_TYPE_META } from "@/lib/scoreMeta";
import { FeedbackControls } from "./FeedbackControls";

const STATUS_STYLE: Record<string, { ring: string; bg: string; tag: string; tagText: string }> = {
  love: { ring: "border-clay/60", bg: "bg-clay-100/50", tag: "bg-clay text-cream", tagText: "Loved" },
  keep: { ring: "border-forest/50", bg: "bg-forest-100/40", tag: "bg-forest text-cream", tagText: "Keeping" },
  defer: { ring: "border-gold/60", bg: "bg-gold-100/50", tag: "bg-gold text-ink", tagText: "Deferred" },
  drop: { ring: "border-muted/40", bg: "bg-cream-100/60 opacity-70", tag: "bg-muted text-cream", tagText: "Dropped" },
};

export function ActivityCard({
  activity,
  feedback,
  onSetStatus,
  onSetNote,
  showFeedback = true,
}: {
  activity: Activity;
  feedback?: ActivityFeedback;
  onSetStatus: (status: FeedbackStatus) => void;
  onSetNote: (note: string) => void;
  showFeedback?: boolean;
}) {
  const meta = ACTIVITY_TYPE_META[activity.type] ?? { label: activity.type, dot: "bg-muted" };
  const status = feedback?.status ?? null;
  const style = status ? STATUS_STYLE[status] : null;

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        style ? `${style.ring} ${style.bg}` : "border-forest/10 bg-white/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted/70">{activity.timeOfDay}</span>
            {style && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.tag}`}>
                {style.tagText}
              </span>
            )}
          </div>
          <h4 className="mt-1.5 font-display text-base font-semibold text-ink">{activity.title}</h4>
          {activity.location && <p className="text-xs text-muted">{activity.location}</p>}
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink/80">{activity.description}</p>

      {activity.tags && activity.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activity.tags.map((t) => (
            <span key={t} className="rounded-full bg-forest/5 px-2 py-0.5 text-[11px] text-forest-600">
              {t}
            </span>
          ))}
        </div>
      )}

      {feedback?.note && (
        <p className="mt-2 rounded-xl border border-gold/30 bg-gold-100/40 px-3 py-2 text-sm italic text-ink/80">
          “{feedback.note}”
        </p>
      )}

      {showFeedback && (
        <FeedbackControls feedback={feedback} onSetStatus={onSetStatus} onSetNote={onSetNote} />
      )}
    </div>
  );
}
