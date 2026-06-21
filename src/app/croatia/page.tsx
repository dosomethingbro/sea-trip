"use client";

import { useState } from "react";
import { useCroatia } from "@/hooks/useCroatia";
import { CroatiaHeader } from "@/components/croatia/CroatiaHeader";
import { DayCard } from "@/components/croatia/DayCard";
import { RecommendDrawer } from "@/components/croatia/RecommendDrawer";
import type { CroatiaActivity, CroatiaDay } from "@/lib/croatia/types";

type DrawerState =
  | { mode: "discover"; day: CroatiaDay; replacing: null }
  | { mode: "swap"; day: CroatiaDay; replacing: CroatiaActivity }
  | null;

export default function CroatiaPage() {
  const croatia = useCroatia();
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const dayById = (id: string) =>
    croatia.dayBundles.find((b) => b.day.id === id)?.day ?? null;

  const openDiscover = (day: CroatiaDay) =>
    setDrawer({ mode: "discover", day, replacing: null });

  const openSwap = (activity: CroatiaActivity) => {
    const day = dayById(activity.dayId);
    if (day) setDrawer({ mode: "swap", day, replacing: activity });
  };

  if (!croatia.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        <span className="animate-pulse font-display text-lg">
          Loading your Croatia trip…
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <CroatiaHeader
        title={croatia.trip.title}
        subtitle={croatia.trip.subtitle}
        travelers={croatia.trip.travelers}
        stats={croatia.tripStats}
        onReset={croatia.resetTrip}
      />

      <section className="mx-auto max-w-4xl px-5 py-8">
        <div className="md:border-l md:border-dashed md:border-adriatic/25 md:pl-8">
          <div className="space-y-6">
            {croatia.dayBundles.map(({ day, activities }) => (
              <DayCard
                key={day.id}
                day={day}
                activities={activities}
                onSwap={openSwap}
                onRemove={croatia.removeActivity}
                onDiscover={openDiscover}
              />
            ))}
          </div>
        </div>
      </section>

      <RecommendDrawer
        open={drawer !== null}
        mode={drawer?.mode ?? "discover"}
        day={drawer?.day ?? null}
        replacing={drawer?.replacing ?? null}
        onClose={() => setDrawer(null)}
        onAdd={(s, source) => {
          if (drawer) croatia.addSuggestion(drawer.day.id, drawer.day.location, s, source);
        }}
        onReplace={(oldId, s, source) => {
          if (drawer) croatia.swapActivity(oldId, drawer.day.id, drawer.day.location, s, source);
        }}
      />
    </main>
  );
}
