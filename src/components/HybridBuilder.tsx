// src/components/HybridBuilder.tsx
"use client";

import { useMemo, useState } from "react";
import type { Lineage } from "@/hooks/useWorkspace";
import type { HybridPick, HybridPlanSelection, TripPlan } from "@/lib/types";

export function HybridBuilder({
  lineages,
  onBuild,
  onPreview,
}: {
  lineages: Lineage[];
  onBuild: (selection: HybridPlanSelection) => void;
  onPreview: (selection: HybridPlanSelection) => TripPlan | null;
}) {
  const [title, setTitle] = useState("");
  const [picks, setPicks] = useState<HybridPick[]>([]);

  const isPicked = (planId: string, dayId: string) =>
    picks.some((p) => p.sourcePlanId === planId && p.dayId === dayId);

  const togglePick = (plan: TripPlan, dayId: string) => {
    setPicks((prev) => {
      const exists = prev.some((p) => p.sourcePlanId === plan.id && p.dayId === dayId);
      if (exists) return prev.filter((p) => !(p.sourcePlanId === plan.id && p.dayId === dayId));
      return [...prev, { sourcePlanId: plan.id, sourcePlanTitle: plan.title, dayId }];
    });
  };

  const selection: HybridPlanSelection = useMemo(() => ({ title, picks }), [title, picks]);
  const preview = useMemo(() => (picks.length ? onPreview(selection) : null), [selection, picks.length, onPreview]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="card mb-4 p-5">
          <h3 className="font-display text-lg font-semibold text-ink">Build a hybrid</h3>
          <p className="mt-1 text-sm text-muted">
            Tick the days you want from any plans below. The route is assembled in the order you’d travel it; you can
            re-favorite and revise the result like any other plan.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your hybrid (optional)"
            className="mt-3 w-full rounded-xl border border-forest/15 bg-white/80 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest/40"
          />
        </div>

        <div className="space-y-4">
          {lineages.map((l) => {
            const plan = l.activePlan;
            return (
              <div key={l.lineageId} className="card p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-semibold text-ink">{plan.title}</h4>
                  <span className="text-xs text-muted">{plan.route.join(" → ")}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {plan.days.map((d) => {
                    const picked = isPicked(plan.id, d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => togglePick(plan, d.id)}
                        className={`rounded-xl border px-3 py-2 text-left transition-all ${
                          picked ? "border-clay bg-clay-100/60 shadow-card" : "border-forest/15 bg-white/60 hover:border-forest/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${picked ? "border-clay bg-clay text-cream" : "border-forest/30 bg-white"}`}>
                            {picked ? "✓" : ""}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                            Day {d.dayNumber} · {d.destination}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-ink">{d.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:sticky lg:top-4 lg:h-fit">
        <div className="card p-5">
          <p className="eyebrow">Preview</p>
          {!preview ? (
            <p className="mt-2 text-sm italic text-muted">Pick some days to preview your hybrid route.</p>
          ) : (
            <>
              <h3 className="mt-1 font-display text-xl font-semibold text-ink">
                {preview.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{preview.route.join("  →  ")}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {preview.countries.map((c) => (
                  <span key={c} className="rounded-full bg-forest/5 px-2 py-0.5 text-[11px] font-semibold text-forest-600">
                    {c}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                {preview.days.length} days · {picks.length} picked
              </p>
              <ol className="mt-3 space-y-1 text-sm text-ink/85">
                {preview.days.map((d) => (
                  <li key={d.id} className="flex gap-2">
                    <span className="text-muted">{d.dayNumber}.</span>
                    <span>
                      {d.destination} — {d.title}
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => {
                  onBuild(selection);
                  setPicks([]);
                  setTitle("");
                }}
                className="btn btn-primary mt-4 w-full"
              >
                Create hybrid plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setPicks([]);
                  setTitle("");
                }}
                className="btn btn-ghost mt-2 w-full text-xs"
              >
                Clear picks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
