"use client";

import Link from "next/link";

interface Props {
  title: string;
  subtitle: string;
  travelers: string[];
  stats: { total: number; swappable: number; aiAdded: number };
  onReset: () => void;
}

export function CroatiaHeader({
  title,
  subtitle,
  travelers,
  stats,
  onReset,
}: Props) {
  return (
    <header className="relative overflow-hidden bg-adriatic text-cream">
      <div className="absolute inset-0 opacity-15">
        <div className="absolute right-[-4rem] top-[-4rem] h-64 w-64 rounded-full bg-gold" />
        <div className="absolute bottom-[-5rem] left-[-3rem] h-56 w-56 rounded-full bg-clay" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 py-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-100">
            Trip itinerary
          </p>
          <Link
            href="/"
            className="rounded-full border border-cream/25 px-3 py-1 text-xs font-medium text-cream/85 hover:border-cream/60 hover:text-cream"
          >
            ← SE Asia planner
          </Link>
        </div>

        <h1 className="mt-3 font-display text-5xl font-bold italic leading-none text-cream md:text-6xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-pretty text-sm text-adriatic-100">
          {subtitle}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {travelers.map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cream"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Stat value={stats.total} label="Activities" />
          <Stat value={stats.swappable} label="Swappable" />
          <Stat value={stats.aiAdded} label="AI added" />
          <button
            type="button"
            onClick={onReset}
            className="ml-auto rounded-full border border-cream/25 px-3 py-1 text-xs font-medium text-cream/80 hover:border-cream/60 hover:text-cream"
          >
            Reset itinerary
          </button>
        </div>
      </div>
    </header>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-2xl font-bold text-cream">{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-adriatic-100">
        {label}
      </span>
    </div>
  );
}
