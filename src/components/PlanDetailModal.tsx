// src/components/PlanDetailModal.tsx
"use client";

import { useState } from "react";
import type { Lineage } from "@/hooks/useWorkspace";
import type {
  ActivityFeedback,
  FeedbackStatus,
  Preference,
  RevisedPlanResult,
  TripPlan,
} from "@/lib/types";
import { callPlanAssistant } from "@/lib/api";
import { Modal } from "./Modal";
import { ActivityCard } from "./ActivityCard";
import { PlanVersionDrawer } from "./PlanVersionDrawer";
import { ScoreBar } from "./ScoreBadge";
import { ApplyAIChangesModal } from "./ApplyAIChangesModal";
import { SCORE_LABELS } from "@/lib/scoreMeta";

export function PlanDetailModal({
  open,
  lineage,
  feedback,
  preferences,
  favoritePlans,
  dateOptionId,
  onClose,
  onSetFeedbackStatus,
  onSetFeedbackNote,
  onToggleFavorite,
  onSelectVersion,
  onSaveRevision,
  onOpenConsole,
}: {
  open: boolean;
  lineage: Lineage | null;
  feedback: Record<string, ActivityFeedback>;
  preferences: Preference[];
  favoritePlans: TripPlan[];
  dateOptionId: string;
  onClose: () => void;
  onSetFeedbackStatus: (activityId: string, status: FeedbackStatus) => void;
  onSetFeedbackNote: (activityId: string, note: string) => void;
  onToggleFavorite: (lineageId: string) => void;
  onSelectVersion: (lineageId: string, versionId: string) => void;
  onSaveRevision: (lineageId: string, result: RevisedPlanResult) => void;
  onOpenConsole: (lineageId: string) => void;
}) {
  const [revising, setRevising] = useState(false);
  const [revision, setRevision] = useState<RevisedPlanResult | null>(null);
  const [showRevision, setShowRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lineage) return null;
  const plan = lineage.activePlan;

  const revise = async () => {
    if (revising) return;
    setRevising(true);
    setError(null);
    try {
      const res = await callPlanAssistant({
        type: "revise-plan",
        plan,
        feedback,
        preferences,
        favoritePlans,
        dateOptionId,
      });
      if (res.revision) {
        setRevision(res.revision);
        setShowRevision(true);
      } else {
        setError("The assistant didn’t return a revision.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revision failed.");
    } finally {
      setRevising(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={plan.title} subtitle={plan.route.join("  →  ")} widthClass="max-w-4xl">
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* Itinerary */}
          <div className="order-2 lg:order-1">
            <div className="space-y-5">
              {plan.days.map((day) => (
                <section key={day.id}>
                  <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-baseline gap-2 bg-cream-50/95 px-1 py-1">
                    <span className="font-display text-lg font-semibold text-clay">Day {day.dayNumber}</span>
                    <span className="font-display text-lg font-semibold text-ink">{day.title}</span>
                    <span className="ml-auto text-xs uppercase tracking-wide text-muted">{day.destination}</span>
                  </div>
                  <p className="mb-3 text-sm text-muted">{day.summary}</p>
                  <div className="space-y-3">
                    {day.activities.map((a) => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        feedback={feedback[a.id]}
                        onSetStatus={(s) => onSetFeedbackStatus(a.id, s)}
                        onSetNote={(n) => onSetFeedbackNote(a.id, n)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-0 lg:h-fit">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onToggleFavorite(lineage.lineageId)}
                className={`btn flex-1 ${lineage.isFavorite ? "btn-clay" : "btn-secondary"}`}
              >
                {lineage.isFavorite ? "★ Favorited" : "☆ Favorite"}
              </button>
            </div>
            <button type="button" onClick={revise} disabled={revising} className="btn btn-primary w-full disabled:opacity-50">
              {revising ? "Revising…" : "Revise with AI"}
            </button>
            <button type="button" onClick={() => onOpenConsole(lineage.lineageId)} className="btn btn-ghost w-full text-xs">
              Open in planning console
            </button>
            {error && <p className="text-sm text-clay">{error}</p>}

            <PlanVersionDrawer lineage={lineage} onSelectVersion={onSelectVersion} />

            <div className="rounded-2xl border border-forest/10 bg-white/60 p-4">
              <p className="eyebrow mb-3">Scores</p>
              <div className="space-y-2">
                {SCORE_LABELS.map((s) => (
                  <ScoreBar key={s.key} label={s.label} value={plan.scores[s.key]} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-forest/10 bg-white/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-forest">Why choose</p>
              <p className="mt-1 text-sm text-ink/85">{plan.whyChoose}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-clay">Why skip</p>
              <p className="mt-1 text-sm text-ink/85">{plan.whySkip}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-forest/10 bg-white/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Pros</p>
                <ul className="mt-1 space-y-1 text-xs text-ink/85">
                  {plan.pros.map((p, i) => (
                    <li key={i}>+ {p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-forest/10 bg-white/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Cons</p>
                <ul className="mt-1 space-y-1 text-xs text-ink/85">
                  {plan.cons.map((c, i) => (
                    <li key={i}>– {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </Modal>

      <ApplyAIChangesModal
        open={showRevision}
        result={revision}
        sourceTitle={plan.title}
        onClose={() => setShowRevision(false)}
        onSaveVersion={(r) => {
          onSaveRevision(lineage.lineageId, r);
          setShowRevision(false);
        }}
      />
    </>
  );
}
