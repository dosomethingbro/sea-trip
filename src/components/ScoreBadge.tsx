// src/components/ScoreBadge.tsx
import { scoreColor } from "@/lib/scoreMeta";

export function ScoreBadge({
  label,
  value,
  size = "sm",
}: {
  label: string;
  value: number;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-forest/10 bg-white/60 ${
        size === "md" ? "px-3 py-2" : "px-2 py-1.5"
      }`}
    >
      <span className={`font-display font-semibold leading-none ${scoreColor(value)} ${size === "md" ? "text-xl" : "text-base"}`}>
        {value}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest/10">
        <div
          className={`h-full rounded-full ${value >= 9 ? "bg-forest" : value >= 7 ? "bg-forest-500" : value >= 5 ? "bg-gold" : "bg-clay-400"}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-semibold text-forest">{value}</span>
    </div>
  );
}
