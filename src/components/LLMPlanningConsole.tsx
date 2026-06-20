// src/components/LLMPlanningConsole.tsx
"use client";

import { useState } from "react";
import type { Lineage } from "@/hooks/useWorkspace";
import type { ConsoleResult, Preference, ActivityFeedback, TripPlan } from "@/lib/types";
import { callPlanAssistant } from "@/lib/api";

const EXAMPLE_PROMPTS = [
  "Make this less temple-heavy",
  "Add more markets and street food",
  "Drop anything too touristy",
  "Make this better for my girlfriend",
  "Turn this into an 8-day version",
  "Give me a slower-paced version",
  "Use my favorite plans to make one best plan",
  "Keep Vietnam but swap Thailand for Cambodia",
  "Create 3 options from our feedback",
];

export function LLMPlanningConsole({
  open,
  onClose,
  targetLineage,
  favoritePlans,
  preferences,
  feedback,
  dateOptionId,
  onSaveProposed,
  onActionsTaken,
}: {
  open: boolean;
  onClose: () => void;
  targetLineage: Lineage | null;
  favoritePlans: TripPlan[];
  preferences: Preference[];
  feedback: Record<string, ActivityFeedback>;
  dateOptionId: string;
  onSaveProposed: (plan: TripPlan, changeSummary: string, targetLineageId: string | null) => void;
  // Called when the assistant logs decisions server-side, so the workspace can
  // refetch and reflect the new feedback/destination decisions.
  onActionsTaken?: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConsoleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetPlan = targetLineage?.activePlan ?? null;

  const contextChips = [
    targetPlan ? `Target: ${targetPlan.title}` : "No target plan (general)",
    `${favoritePlans.length} favorite${favoritePlans.length === 1 ? "" : "s"}`,
    `${preferences.length} preferences`,
    `${Object.keys(feedback).length} activity notes`,
    `Date option ${dateOptionId === "opt-1" ? "1" : "2"}`,
  ];

  const run = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await callPlanAssistant({
        type: "console",
        prompt: trimmed,
        plan: targetPlan ?? undefined,
        favoritePlans,
        preferences,
        feedback,
        dateOptionId,
      });
      const consoleResult = res.console ?? null;
      setResult(consoleResult);
      if (consoleResult?.actionsTaken && consoleResult.actionsTaken.length > 0) {
        onActionsTaken?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-forest/10 bg-cream-50 shadow-lift">
        <div className="flex items-start justify-between gap-3 border-b border-forest/10 px-5 py-4">
          <div>
            <p className="eyebrow">Planning console</p>
            <h2 className="font-display text-xl font-semibold text-ink">Ask the assistant</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close console"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-forest/15 bg-white/60 text-muted hover:text-forest"
          >
            ✕
          </button>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">
          <p className="eyebrow mb-2">Context included</p>
          <div className="flex flex-wrap gap-1.5">
            {contextChips.map((c) => (
              <span key={c} className="rounded-full bg-forest/5 px-2.5 py-1 text-[11px] font-semibold text-forest-600">
                {c}
              </span>
            ))}
          </div>

          <p className="eyebrow mb-2 mt-5">Try</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-forest/15 bg-white/60 px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-forest/40 hover:text-forest"
              >
                {ex}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Ask for a change, a new option, or a comparison…"
            className="mt-4 w-full resize-none rounded-2xl border border-forest/15 bg-white/80 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest/40"
          />

          {error && <p className="mt-2 text-sm text-clay">{error}</p>}

          {result && (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-forest/10 bg-white/70 p-4">
                <p className="eyebrow mb-1">Assistant</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">{result.message}</p>
              </div>

              {result.actionsTaken && result.actionsTaken.length > 0 && (
                <div className="rounded-2xl border border-forest/20 bg-forest/5 p-4">
                  <p className="eyebrow mb-1 text-forest-600">Logged for you</p>
                  <ul className="space-y-1 text-sm text-ink/85">
                    {result.actionsTaken.map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-forest">✓</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.contextIncluded.length > 0 && (
                <div className="rounded-2xl border border-forest/10 bg-white/50 p-4">
                  <p className="eyebrow mb-1">What it weighed</p>
                  <ul className="space-y-1 text-sm text-ink/80">
                    {result.contextIncluded.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted">·</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.proposedPlan && (
                <div className="rounded-2xl border border-clay/30 bg-clay-100/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-clay-600">Proposed plan</p>
                  <h4 className="mt-1 font-display text-lg font-semibold text-ink">{result.proposedPlan.title}</h4>
                  <p className="mt-1 text-sm text-muted">{result.proposedPlan.route.join("  →  ")}</p>
                  {result.changeSummary && <p className="mt-2 text-sm text-ink/85">{result.changeSummary}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {targetLineage && (
                      <button
                        type="button"
                        onClick={() =>
                          onSaveProposed(result.proposedPlan!, result.changeSummary ?? "Console revision", targetLineage.lineageId)
                        }
                        className="btn btn-primary text-xs"
                      >
                        Apply as new version of “{targetLineage.activePlan.title}”
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onSaveProposed(result.proposedPlan!, result.changeSummary ?? "Console plan", null)
                      }
                      className="btn btn-clay text-xs"
                    >
                      Save as new plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-forest/10 px-5 py-4">
          <button type="button" onClick={run} disabled={!prompt.trim() || loading} className="btn btn-primary w-full disabled:opacity-40">
            {loading ? "Thinking…" : "Send to assistant"}
          </button>
        </div>
      </aside>
    </>
  );
}
