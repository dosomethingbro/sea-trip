// src/components/PlanComparisonMatrix.tsx
"use client";

import type { Lineage } from "@/hooks/useWorkspace";
import { SCORE_LABELS, scoreColor } from "@/lib/scoreMeta";

export function PlanComparisonMatrix({
  lineages,
  onClear,
  onOpen,
}: {
  lineages: Lineage[];
  onClear: () => void;
  onOpen: (lineageId: string) => void;
}) {
  if (lineages.length < 2) {
    return (
      <div className="card p-10 text-center">
        <h3 className="font-display text-xl font-semibold text-ink">Pick at least 2 plans to compare</h3>
        <p className="mt-2 text-sm text-muted">
          Tick the “Compare” box on plan cards in the Library (up to 4) and they’ll line up here side by side.
        </p>
      </div>
    );
  }

  const plans = lineages.map((l) => l.activePlan);

  const Row = ({ label, render }: { label: string; render: (p: (typeof plans)[number]) => React.ReactNode }) => (
    <tr className="border-t border-forest/10 align-top">
      <th scope="row" className="sticky left-0 z-10 bg-cream-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </th>
      {plans.map((p) => (
        <td key={p.id} className="px-4 py-3 text-sm text-ink/90">
          {render(p)}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-forest/10 px-5 py-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-ink">Comparison matrix</h3>
          <p className="text-sm text-muted">{plans.length} plans side by side</p>
        </div>
        <button type="button" onClick={onClear} className="btn btn-ghost">
          Clear selection
        </button>
      </div>

      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-cream-50/95 px-4 py-4 text-left" />
              {lineages.map((l) => (
                <th key={l.lineageId} className="px-4 py-4 text-left">
                  <div className="font-display text-base font-semibold text-ink">{l.activePlan.title}</div>
                  <button
                    type="button"
                    onClick={() => onOpen(l.lineageId)}
                    className="mt-1 text-xs font-semibold text-clay hover:underline"
                  >
                    Open plan →
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Route" render={(p) => <span>{p.route.join(" → ")}</span>} />
            <Row
              label="Countries"
              render={(p) => (
                <div className="flex flex-wrap gap-1">
                  {p.countries.map((c) => (
                    <span key={c} className="rounded-full bg-forest/5 px-2 py-0.5 text-[11px] font-semibold text-forest-600">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            />
            <Row label="Travel days" render={(p) => <span>{p.durationDays}</span>} />
            <Row label="PTO efficiency" render={(p) => <span>{p.ptoEfficiency}/10</span>} />
            <Row label="Transfer burden" render={(p) => <span>{p.transferBurden}</span>} />
            <Row
              label="Logistics"
              render={(p) => <span className="capitalize">{p.logisticsDifficulty}</span>}
            />
            {SCORE_LABELS.map((s) => (
              <Row
                key={s.key}
                label={s.label}
                render={(p) => (
                  <div className="flex items-center gap-2">
                    <span className={`font-display text-base font-semibold ${scoreColor(p.scores[s.key])}`}>
                      {p.scores[s.key]}
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-forest/10">
                      <div
                        className={`h-full rounded-full ${
                          p.scores[s.key] >= 9 ? "bg-forest" : p.scores[s.key] >= 7 ? "bg-forest-500" : p.scores[s.key] >= 5 ? "bg-gold" : "bg-clay-400"
                        }`}
                        style={{ width: `${p.scores[s.key] * 10}%` }}
                      />
                    </div>
                  </div>
                )}
              />
            ))}
            <Row label="Why choose" render={(p) => <span className="italic text-ink/80">{p.whyChoose}</span>} />
            <Row label="Why skip" render={(p) => <span className="italic text-ink/70">{p.whySkip}</span>} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
