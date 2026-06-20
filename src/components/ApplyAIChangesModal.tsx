// src/components/ApplyAIChangesModal.tsx
"use client";

import type { RevisedPlanResult } from "@/lib/types";
import { Modal } from "./Modal";

const LIST_META: { key: keyof Pick<RevisedPlanResult, "kept" | "dropped" | "deferred" | "added">; label: string; cls: string }[] = [
  { key: "added", label: "Newly suggested", cls: "text-clay" },
  { key: "kept", label: "Kept", cls: "text-forest" },
  { key: "deferred", label: "Deferred", cls: "text-gold-600" },
  { key: "dropped", label: "Dropped", cls: "text-muted" },
];

export function ApplyAIChangesModal({
  open,
  result,
  sourceTitle,
  onClose,
  onSaveVersion,
}: {
  open: boolean;
  result: RevisedPlanResult | null;
  sourceTitle: string;
  onClose: () => void;
  onSaveVersion: (result: RevisedPlanResult) => void;
}) {
  if (!result) return null;
  const { plan, explanation, scoreChanges, risks } = result;

  return (
    <Modal open={open} onClose={onClose} title="Proposed revision" subtitle={`Based on ${sourceTitle}`}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-forest/10 bg-white/70 p-4">
          <p className="eyebrow">Revised plan</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">{plan.title}</h3>
          <p className="mt-1 text-sm text-muted">{plan.route.join("  →  ")}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink/85">{explanation}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {LIST_META.map((m) => {
            const items = result[m.key];
            if (!items || items.length === 0) return null;
            return (
              <div key={m.key} className="rounded-2xl border border-forest/10 bg-white/60 p-4">
                <p className={`text-xs font-bold uppercase tracking-wide ${m.cls}`}>
                  {m.label} · {items.length}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-ink/85">
                  {items.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted">·</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {scoreChanges.length > 0 && (
          <div className="rounded-2xl border border-forest/10 bg-white/60 p-4">
            <p className="eyebrow mb-2">Score changes</p>
            <div className="space-y-1.5">
              {scoreChanges.map((c) => {
                const delta = c.to - c.from;
                return (
                  <div key={c.label} className="flex items-center justify-between text-sm">
                    <span className="text-ink/85">{c.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-muted">{c.from}</span>
                      <span className="text-muted">→</span>
                      <span className="font-semibold text-ink">{c.to}</span>
                      <span
                        className={`w-10 text-right text-xs font-bold ${
                          delta > 0 ? "text-forest" : delta < 0 ? "text-clay" : "text-muted"
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {risks.length > 0 && (
          <div className="rounded-2xl border border-clay/30 bg-clay-100/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-clay-600">Risk / logistics notes</p>
            <ul className="mt-2 space-y-1 text-sm text-ink/85">
              {risks.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-clay">!</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-forest/10 pt-4">
        <button type="button" onClick={onClose} className="btn btn-ghost">
          Discard
        </button>
        <button
          type="button"
          onClick={() => onSaveVersion(result)}
          className="btn btn-primary"
        >
          Save as new version
        </button>
      </div>
    </Modal>
  );
}
