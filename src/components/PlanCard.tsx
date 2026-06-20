// src/components/PlanCard.tsx
"use client";

import type { Lineage } from "@/hooks/useWorkspace";
import { SCORE_LABELS, scoreColor } from "@/lib/scoreMeta";

const DIFFICULTY_LABEL: Record<string, { label: string; cls: string }> = {
  easy: { label: "Easy logistics", cls: "bg-forest-100 text-forest" },
  moderate: { label: "Moderate logistics", cls: "bg-gold-100 text-ink" },
  involved: { label: "Involved logistics", cls: "bg-clay-100 text-clay-600" },
};

export function PlanCard({
  lineage,
  selectedForCompare,
  onToggleFavorite,
  onToggleCompare,
  onOpen,
}: {
  lineage: Lineage;
  selectedForCompare: boolean;
  onToggleFavorite: (lineageId: string) => void;
  onToggleCompare: (lineageId: string) => void;
  onOpen: (lineageId: string) => void;
}) {
  const plan = lineage.activePlan;
  const diff = DIFFICULTY_LABEL[plan.logisticsDifficulty];
  const headline = SCORE_LABELS.filter((s) =>
    ["lucasFit", "girlfriendFit", "coreMemory"].includes(s.key)
  );

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {plan.countries.map((c) => (
              <span key={c} className="rounded-full bg-forest/5 px-2 py-0.5 text-[11px] font-semibold text-forest-600">
                {c}
              </span>
            ))}
            {lineage.versions.length > 1 && (
              <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-ink">
                {lineage.activeVersion.label}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-ink">{plan.title}</h3>
        </div>
        <button
          type="button"
          aria-label={lineage.isFavorite ? "Remove favorite" : "Add favorite"}
          onClick={() => onToggleFavorite(lineage.lineageId)}
          className="shrink-0"
          title="Toggle favorite"
        >
          <HeartToggle active={lineage.isFavorite} />
        </button>
      </div>

      <p className="mt-2 text-sm text-muted">{plan.route.join("  →  ")}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {plan.vibeTags.slice(0, 5).map((t) => (
          <span key={t} className="chip chip-idle !cursor-default !py-1 !text-[11px]">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {headline.map((s) => (
          <div key={s.key} className="rounded-xl border border-forest/10 bg-white/60 px-2 py-2 text-center">
            <div className={`font-display text-lg font-semibold leading-none ${scoreColor(plan.scores[s.key])}`}>
              {plan.scores[s.key]}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">{s.short}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>{plan.durationDays} travel days</span>
        <span>·</span>
        <span>PTO efficiency {plan.ptoEfficiency}/10</span>
        <span>·</span>
        <span className={`rounded-full px-2 py-0.5 font-semibold ${diff.cls}`}>{diff.label}</span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm italic text-ink/70">{plan.whyChoose}</p>

      <div className="mt-4 flex items-center gap-2 border-t border-forest/10 pt-4">
        <button type="button" onClick={() => onOpen(lineage.lineageId)} className="btn btn-primary flex-1">
          Open & give feedback
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-forest/15 bg-white/60 px-3 py-2 text-xs font-semibold text-forest">
          <input
            type="checkbox"
            checked={selectedForCompare}
            onChange={() => onToggleCompare(lineage.lineageId)}
            className="hidden"
          />
          <span className={`flex h-4 w-4 items-center justify-center rounded border ${selectedForCompare ? "border-forest bg-forest text-cream" : "border-forest/30 bg-white"}`}>
            {selectedForCompare ? "✓" : ""}
          </span>
          Compare
        </label>
      </div>
    </article>
  );
}

function HeartToggle({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 transition-colors ${active ? "fill-clay stroke-clay" : "fill-none stroke-muted/60"}`}
      strokeWidth={1.8}
    >
      <path d="M12 21s-7.5-4.6-10-9.2C.4 8.7 1.9 5 5.3 5c2 0 3.4 1.2 4.2 2.4C10.3 6.2 11.7 5 13.7 5c3.4 0 4.9 3.7 3.3 6.8C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}
