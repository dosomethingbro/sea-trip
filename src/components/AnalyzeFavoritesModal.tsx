// src/components/AnalyzeFavoritesModal.tsx
"use client";

import type { AnalyzeFavoritesResult, Recommendation } from "@/lib/types";
import { Modal } from "./Modal";

function RecCard({ tag, rec, accent }: { tag: string; rec: Recommendation; accent: string }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white/70 p-4">
      <p className={`text-xs font-bold uppercase tracking-wide ${accent}`}>{tag}</p>
      <h4 className="mt-1 font-display text-base font-semibold text-ink">{rec.planTitle}</h4>
      <p className="mt-1 text-sm leading-relaxed text-ink/80">{rec.rationale}</p>
    </div>
  );
}

export function AnalyzeFavoritesModal({
  open,
  result,
  loading,
  onClose,
}: {
  open: boolean;
  result: AnalyzeFavoritesResult | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Analyze favorites" subtitle="Assistant read your favorites, preferences, and feedback">
      {loading || !result ? (
        <div className="flex items-center justify-center py-16 text-muted">
          <span className="animate-pulse">Reading your favorites…</span>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <RecCard tag="Best overall" rec={result.bestOverall} accent="text-forest" />
            <RecCard tag="Best compromise" rec={result.bestCompromise} accent="text-gold-600" />
            <RecCard tag="Most adventurous" rec={result.mostAdventurous} accent="text-clay" />
            <RecCard tag="Most relaxed" rec={result.mostRelaxed} accent="text-forest-500" />
          </div>

          <div className="rounded-2xl border border-clay/30 bg-clay-100/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-clay-600">Suggested hybrid route</p>
            <h4 className="mt-1 font-display text-lg font-semibold text-ink">{result.hybridRoute.title}</h4>
            <p className="mt-1 text-sm text-muted">{result.hybridRoute.route.join("  →  ")}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/85">{result.hybridRoute.rationale}</p>
          </div>

          {result.tradeoffs.length > 0 && (
            <div className="rounded-2xl border border-forest/10 bg-white/60 p-4">
              <p className="eyebrow mb-2">Tradeoffs to weigh</p>
              <ul className="space-y-1.5 text-sm text-ink/85">
                {result.tradeoffs.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gold-600">⇄</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-forest/20 bg-forest-100/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-forest">Recommended next action</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/90">{result.nextAction}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
