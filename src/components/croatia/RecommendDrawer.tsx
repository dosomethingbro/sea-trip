"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchRecommendations } from "@/lib/croatia/api";
import { CURATED_IDEAS } from "@/lib/croatia/curated";
import type {
  CroatiaActivity,
  CroatiaDay,
  RecommendResponse,
  Suggestion,
} from "@/lib/croatia/types";
import { CATEGORY_META, SLOT_LABEL } from "./categoryMeta";

type Mode = "discover" | "swap";

interface Props {
  open: boolean;
  mode: Mode;
  day: CroatiaDay | null;
  replacing?: CroatiaActivity | null;
  onClose: () => void;
  onAdd: (s: Suggestion, source: CroatiaActivity["source"]) => void;
  onReplace: (
    oldId: string,
    s: Suggestion,
    source: CroatiaActivity["source"]
  ) => void;
}

function curatedAsSuggestions(day: CroatiaDay | null): Suggestion[] {
  if (!day) return [];
  const loc = day.location === "Travel" ? null : day.location;
  if (!loc) return [];
  return (CURATED_IDEAS[loc] ?? []).map((i) => ({
    title: i.title,
    description: i.description,
    category: i.category,
    slot: i.slot,
    whyItFits: "Curated local favorite — relaxed, food- and scenery-forward.",
  }));
}

export function RecommendDrawer({
  open,
  mode,
  day,
  replacing,
  onClose,
  onAdd,
  onReplace,
}: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const curated = useMemo(() => curatedAsSuggestions(day), [day]);

  // Reset transient state when the drawer target changes.
  useEffect(() => {
    if (open) {
      setNote("");
      setResult(null);
      setError(null);
      setLoading(false);
    }
  }, [open, day?.id, replacing?.id, mode]);

  if (!open || !day) return null;

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetchRecommendations({
        kind: mode,
        dayId: day.id,
        location: day.location,
        dateISO: day.dateISO,
        note: note.trim() || undefined,
        replacing:
          mode === "swap" && replacing
            ? {
                title: replacing.title,
                category: replacing.category,
                slot: replacing.slot,
                timeLabel: replacing.timeLabel,
              }
            : undefined,
      });
      setResult(res);
    } catch {
      setError("Couldn't reach the live search. Try the curated ideas below.");
    } finally {
      setLoading(false);
    }
  };

  const act = (s: Suggestion, source: CroatiaActivity["source"]) => {
    if (mode === "swap" && replacing) onReplace(replacing.id, s, source);
    else onAdd(s, source);
    onClose();
  };

  const heading =
    mode === "swap"
      ? `Swap "${replacing?.title ?? "activity"}"`
      : `Add ideas — ${day.dateLabel}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-cream-50 shadow-lift">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-forest/10 bg-adriatic px-5 py-4 text-cream">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-100">
              {mode === "swap" ? "Swap activity" : "Recommendations"}
            </p>
            <h3 className="mt-0.5 font-display text-lg font-semibold leading-tight text-cream">
              {heading}
            </h3>
            <p className="mt-0.5 text-xs text-adriatic-100">
              {day.location === "Travel" ? "Transit day" : day.location} ·{" "}
              {day.dateLabel}, 2026
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-cream/80 hover:bg-white/10 hover:text-cream"
          >
            Close
          </button>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">
          {/* live search box */}
          <div className="rounded-2xl border border-adriatic/15 bg-white/70 p-3">
            <label className="text-xs font-semibold text-forest">
              Pull live ideas
            </label>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              Searches current events, festivals, and Reddit/forum tips for{" "}
              {day.location === "Travel" ? "the route" : day.location} around
              your dates, with sources.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional: 'more food', 'off the beaten path'…"
                className="min-w-0 flex-1 rounded-full border border-forest/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-adriatic/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={loading}
                className="btn btn-clay shrink-0 text-xs"
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-clay/10 px-3 py-2 text-xs text-clay-600">
              {error}
            </p>
          )}

          {/* AI results */}
          {result && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="eyebrow">Live picks</span>
                <span className="h-px flex-1 bg-forest/10" />
              </div>
              {result.summary && (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {result.summary}
                </p>
              )}
              <ul className="mt-3 space-y-3">
                {result.suggestions.map((s, i) => (
                  <SuggestionCard
                    key={`ai-${i}`}
                    suggestion={s}
                    actionLabel={mode === "swap" ? "Use this" : "Add to day"}
                    onAct={() => act(s, "ai")}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* curated */}
          {curated.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <span className="eyebrow">Curated favorites</span>
                <span className="h-px flex-1 bg-forest/10" />
              </div>
              <ul className="mt-3 space-y-3">
                {curated.map((s, i) => (
                  <SuggestionCard
                    key={`cur-${i}`}
                    suggestion={s}
                    actionLabel={mode === "swap" ? "Use this" : "Add to day"}
                    onAct={() => act(s, "curated")}
                  />
                ))}
              </ul>
            </div>
          )}

          {curated.length === 0 && !result && !loading && (
            <p className="mt-5 text-center text-xs text-muted">
              This is a transit day — use live search above for ideas around the
              route.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  actionLabel,
  onAct,
}: {
  suggestion: Suggestion;
  actionLabel: string;
  onAct: () => void;
}) {
  const cat = CATEGORY_META[suggestion.category];
  return (
    <li className="rounded-xl border border-forest/10 bg-white/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h5 className="font-display text-sm font-semibold text-ink">
          {suggestion.title}
        </h5>
        <span className={`chip border ${cat.chip} !px-2 !py-0.5 text-[10px]`}>
          {cat.label}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          {SLOT_LABEL[suggestion.slot] ?? suggestion.slot}
        </span>
        {suggestion.liveSignal && (
          <span className="chip border border-gold/40 bg-gold/15 !px-2 !py-0.5 text-[10px] text-clay-600">
            Live
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {suggestion.description}
      </p>
      {suggestion.liveSignal && (
        <p className="mt-1 text-xs font-medium text-clay-600">
          {suggestion.liveSignal}
        </p>
      )}
      <p className="mt-1 text-[11px] italic leading-relaxed text-forest-600">
        {suggestion.whyItFits}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {(suggestion.sourceLinks ?? []).slice(0, 3).map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-[8rem] items-center truncate rounded-full border border-adriatic/15 bg-adriatic/5 px-2 py-0.5 text-[10px] font-medium text-adriatic-700 hover:border-adriatic/40"
            >
              {s.title}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={onAct}
          className="shrink-0 rounded-full bg-forest px-3 py-1 text-xs font-semibold text-cream hover:bg-forest-700"
        >
          {actionLabel}
        </button>
      </div>
    </li>
  );
}
