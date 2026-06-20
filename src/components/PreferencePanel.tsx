// src/components/PreferencePanel.tsx
"use client";

import { useState } from "react";
import type { Person, PreferenceCategory, Preference } from "@/lib/types";

const PEOPLE: { value: Person; label: string }[] = [
  { value: "lucas", label: "Lucas" },
  { value: "girlfriend", label: "Girlfriend" },
  { value: "both", label: "Both" },
];

const CATEGORIES: PreferenceCategory[] = [
  "food",
  "history",
  "nature",
  "markets",
  "logistics",
  "relaxation",
  "lodging",
  "pace",
  "culture",
];

const PERSON_STYLE: Record<Person, string> = {
  lucas: "bg-forest-100 text-forest",
  girlfriend: "bg-clay-100 text-clay-600",
  both: "bg-gold-100 text-ink",
};

export function PreferencePanel({
  preferences,
  onAdd,
  onUpdate,
  onRemove,
}: {
  preferences: Preference[];
  onAdd: (pref: Omit<Preference, "id">) => void;
  onUpdate: (id: string, patch: Partial<Preference>) => void;
  onRemove: (id: string) => void;
}) {
  const [person, setPerson] = useState<Person>("both");
  const [category, setCategory] = useState<PreferenceCategory>("food");
  const [text, setText] = useState("");
  const [weight, setWeight] = useState(3);

  const grouped: Record<Person, Preference[]> = { lucas: [], girlfriend: [], both: [] };
  preferences.forEach((p) => grouped[p.person].push(p));

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({ person, category, text: trimmed, weight });
    setText("");
    setWeight(3);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="card h-fit p-5">
        <h3 className="font-display text-lg font-semibold text-ink">Add a preference</h3>
        <p className="mt-1 text-sm text-muted">These feed the AI when it analyzes favorites or revises a plan.</p>

        <label className="eyebrow mt-4 block">Who</label>
        <div className="mt-1.5 flex gap-2">
          {PEOPLE.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPerson(p.value)}
              className={`chip ${person === p.value ? "chip-active" : "chip-idle"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="eyebrow mt-4 block">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PreferenceCategory)}
          className="mt-1.5 w-full rounded-xl border border-forest/15 bg-white/80 px-3 py-2 text-sm capitalize text-ink outline-none focus:border-forest/40"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>

        <label className="eyebrow mt-4 block">Preference</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. Loves wandering old neighborhoods on foot with street food stops"
          className="mt-1.5 w-full resize-none rounded-xl border border-forest/15 bg-white/80 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest/40"
        />

        <label className="eyebrow mt-4 block">Weight · {weight}</label>
        <input
          type="range"
          min={1}
          max={5}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="mt-1.5 w-full accent-clay"
        />
        <div className="flex justify-between text-[11px] text-muted">
          <span>Nice to have</span>
          <span>Dealbreaker</span>
        </div>

        <button type="button" onClick={submit} disabled={!text.trim()} className="btn btn-primary mt-4 w-full disabled:opacity-40">
          Add preference
        </button>
      </div>

      <div className="space-y-5">
        {PEOPLE.map((p) => (
          <div key={p.value} className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${PERSON_STYLE[p.value]}`}>
                {p.label}
              </span>
              <span className="text-sm text-muted">{grouped[p.value].length} preferences</span>
            </div>
            {grouped[p.value].length === 0 ? (
              <p className="text-sm italic text-muted">Nothing yet.</p>
            ) : (
              <ul className="space-y-2">
                {grouped[p.value].map((pref) => (
                  <li key={pref.id} className="rounded-xl border border-forest/10 bg-white/60 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="rounded-full bg-forest/5 px-2 py-0.5 text-[11px] font-semibold capitalize text-forest-600">
                          {pref.category}
                        </span>
                        <p className="mt-1.5 text-sm text-ink/90">{pref.text}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(pref.id)}
                        className="shrink-0 text-xs font-semibold text-muted hover:text-clay"
                        aria-label="Remove preference"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wide text-muted">Weight</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={pref.weight}
                        onChange={(e) => onUpdate(pref.id, { weight: Number(e.target.value) })}
                        className="h-1 flex-1 accent-clay"
                      />
                      <span className="w-4 text-right text-xs font-semibold text-forest">{pref.weight}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
