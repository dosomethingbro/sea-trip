// src/components/WorkspaceApp.tsx
"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import type {
  AnalyzeFavoritesResult,
  RevisedPlanResult,
  TripPlan,
} from "@/lib/types";
import { callPlanAssistant } from "@/lib/api";
import { TripHeader } from "@/components/TripHeader";
import { PlanLibrary } from "@/components/PlanLibrary";
import { PlanComparisonMatrix } from "@/components/PlanComparisonMatrix";
import { HybridBuilder } from "@/components/HybridBuilder";
import { PreferencePanel } from "@/components/PreferencePanel";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { LLMPlanningConsole } from "@/components/LLMPlanningConsole";
import { AnalyzeFavoritesModal } from "@/components/AnalyzeFavoritesModal";
import { ProfileBar, type ProfileBarInfo } from "@/components/ProfileBar";

type Tab = "library" | "compare" | "hybrid" | "preferences";

const TABS: { id: Tab; label: string }[] = [
  { id: "library", label: "Plan Library" },
  { id: "compare", label: "Compare" },
  { id: "hybrid", label: "Build Hybrid" },
  { id: "preferences", label: "Preferences" },
];

export function WorkspaceApp({ profile }: { profile: ProfileBarInfo }) {
  const ws = useWorkspace();
  const [tab, setTab] = useState<Tab>("library");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [openLineageId, setOpenLineageId] = useState<string | null>(null);

  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleTargetId, setConsoleTargetId] = useState<string | null>(null);

  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeFavoritesResult | null>(null);

  const favoritePlans = useMemo(
    () => ws.favoriteLineages.map((l) => l.activePlan),
    [ws.favoriteLineages]
  );

  const openLineage = ws.lineages.find((l) => l.lineageId === openLineageId) ?? null;
  const consoleTarget = ws.lineages.find((l) => l.lineageId === consoleTargetId) ?? null;
  const compareLineages = compareIds
    .map((id) => ws.lineages.find((l) => l.lineageId === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev; // cap at 4
      return [...prev, id];
    });
  };

  const analyzeFavorites = async () => {
    if (favoritePlans.length === 0) return;
    setAnalyzeOpen(true);
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    try {
      const res = await callPlanAssistant({
        type: "analyze-favorites",
        favoritePlans,
        preferences: ws.preferences,
        feedback: ws.feedback,
        dateOptionId: ws.activeDateOption.id,
      });
      setAnalyzeResult(res.analyze ?? null);
    } catch {
      setAnalyzeResult(null);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const saveRevision = (lineageId: string, result: RevisedPlanResult) => {
    ws.saveVersion(lineageId, result.plan, "ai-revision", result.explanation.slice(0, 140));
  };

  const saveConsoleProposed = (plan: TripPlan, changeSummary: string, targetLineageId: string | null) => {
    if (targetLineageId) {
      ws.saveVersion(targetLineageId, plan, "ai-revision", changeSummary);
    } else {
      const newId = ws.createLineage(plan, "custom", changeSummary);
      setConsoleOpen(false);
      setTab("library");
      setOpenLineageId(newId);
    }
  };

  const openConsole = (lineageId: string | null) => {
    setConsoleTargetId(lineageId);
    setConsoleOpen(true);
  };

  if (!ws.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        <span className="animate-pulse font-display text-lg">Loading your workspace…</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <ProfileBar profile={profile} />

      <TripHeader
        activeDateOptionId={ws.activeDateOption.id}
        onSelectDateOption={ws.setDateOption}
        onReset={ws.resetWorkspace}
      />

      {/* Tab bar */}
      <div className="sticky top-0 z-30 border-b border-forest/10 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-5 py-2 thin-scroll">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? "bg-forest text-cream" : "text-muted hover:bg-forest/5 hover:text-forest"
              }`}
            >
              {t.label}
              {t.id === "compare" && compareIds.length > 0 && (
                <span className="ml-1.5 rounded-full bg-clay px-1.5 py-0.5 text-[10px] text-cream">{compareIds.length}</span>
              )}
            </button>
          ))}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={analyzeFavorites}
              disabled={favoritePlans.length === 0}
              className="btn btn-secondary text-xs disabled:opacity-40"
              title={favoritePlans.length === 0 ? "Favorite some plans first" : "Analyze favorites"}
            >
              Analyze favorites{favoritePlans.length > 0 ? ` (${favoritePlans.length})` : ""}
            </button>
            <button type="button" onClick={() => openConsole(openLineageId)} className="btn btn-clay text-xs">
              AI Console
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {tab === "library" && (
          <PlanLibrary
            lineages={ws.lineages}
            compareIds={compareIds}
            onToggleFavorite={ws.toggleFavorite}
            onToggleCompare={toggleCompare}
            onOpen={(id) => setOpenLineageId(id)}
          />
        )}

        {tab === "compare" && (
          <PlanComparisonMatrix
            lineages={compareLineages}
            onClear={() => setCompareIds([])}
            onOpen={(id) => setOpenLineageId(id)}
          />
        )}

        {tab === "hybrid" && (
          <HybridBuilder
            lineages={ws.lineages}
            onPreview={ws.buildHybridPlan}
            onBuild={(selection) => {
              const plan = ws.buildHybridPlan(selection);
              if (!plan) return;
              const newId = ws.createLineage(plan, "hybrid", "Hand-built from selected days");
              setTab("library");
              setOpenLineageId(newId);
            }}
          />
        )}

        {tab === "preferences" && (
          <PreferencePanel
            preferences={ws.preferences}
            onAdd={ws.addPreference}
            onUpdate={ws.updatePreference}
            onRemove={ws.removePreference}
          />
        )}
      </div>

      <PlanDetailModal
        open={Boolean(openLineage)}
        lineage={openLineage}
        feedback={ws.feedback}
        preferences={ws.preferences}
        favoritePlans={favoritePlans}
        dateOptionId={ws.activeDateOption.id}
        onClose={() => setOpenLineageId(null)}
        onSetFeedbackStatus={(id, s) => ws.setFeedback(id, s)}
        onSetFeedbackNote={(id, n) => ws.setFeedback(id, ws.feedback[id]?.status ?? null, n)}
        onToggleFavorite={ws.toggleFavorite}
        onSelectVersion={ws.setActiveVersion}
        onSaveRevision={saveRevision}
        onOpenConsole={(id) => openConsole(id)}
      />

      <LLMPlanningConsole
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        targetLineage={consoleTarget}
        favoritePlans={favoritePlans}
        preferences={ws.preferences}
        feedback={ws.feedback}
        dateOptionId={ws.activeDateOption.id}
        onSaveProposed={saveConsoleProposed}
      />

      <AnalyzeFavoritesModal
        open={analyzeOpen}
        result={analyzeResult}
        loading={analyzeLoading}
        onClose={() => setAnalyzeOpen(false)}
      />
    </main>
  );
}
