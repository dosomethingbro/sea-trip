// src/components/FilterChips.tsx
"use client";

export interface ChipOption {
  value: string;
  label: string;
}

export function FilterChips({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: ChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(opt.value)}
            className={`chip ${active ? "chip-active" : "chip-idle"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
