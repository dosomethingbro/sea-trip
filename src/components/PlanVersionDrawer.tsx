// src/components/PlanVersionDrawer.tsx
"use client";

import type { Lineage } from "@/hooks/useWorkspace";

const KIND_STYLE: Record<string, string> = {
  original: "bg-forest-100 text-forest",
  "ai-revision": "bg-clay-100 text-clay-600",
  hybrid: "bg-gold-100 text-ink",
  custom: "bg-cream-100 text-ink",
};

export function PlanVersionDrawer({
  lineage,
  onSelectVersion,
}: {
  lineage: Lineage;
  onSelectVersion: (lineageId: string, versionId: string) => void;
}) {
  if (lineage.versions.length <= 1) return null;

  return (
    <div className="rounded-2xl border border-forest/10 bg-white/60 p-4">
      <p className="eyebrow mb-2">Version history · {lineage.versions.length}</p>
      <div className="flex flex-wrap gap-2">
        {lineage.versions.map((v) => {
          const active = v.id === lineage.activeVersion.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVersion(lineage.lineageId, v.id)}
              className={`rounded-xl border px-3 py-2 text-left transition-all ${
                active ? "border-forest bg-forest-100/60 shadow-card" : "border-forest/15 bg-white/70 hover:border-forest/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${KIND_STYLE[v.kind] ?? "bg-cream-100 text-ink"}`}>
                  {v.label}
                </span>
                {active && <span className="text-[10px] font-bold uppercase tracking-wide text-forest">Active</span>}
              </div>
              {v.changeSummary && <p className="mt-1 max-w-[200px] text-xs text-muted">{v.changeSummary}</p>}
              <p className="mt-1 text-[10px] text-muted/70">
                {new Date(v.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
