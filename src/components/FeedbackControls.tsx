// src/components/FeedbackControls.tsx
"use client";

import { useState } from "react";
import type { ActivityFeedback, FeedbackStatus } from "@/lib/types";

const OPTIONS: { status: Exclude<FeedbackStatus, null>; label: string; activeClass: string; hint: string }[] = [
  { status: "love", label: "Love", activeClass: "bg-clay text-cream border-clay", hint: "Prioritize heavily" },
  { status: "keep", label: "Keep", activeClass: "bg-forest text-cream border-forest", hint: "Definitely include" },
  { status: "defer", label: "Defer", activeClass: "bg-gold text-ink border-gold", hint: "Backup / flex" },
  { status: "drop", label: "Drop", activeClass: "bg-muted text-cream border-muted", hint: "Remove from plan" },
];

export function FeedbackControls({
  feedback,
  onSetStatus,
  onSetNote,
}: {
  feedback?: ActivityFeedback;
  onSetStatus: (status: FeedbackStatus) => void;
  onSetNote: (note: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(Boolean(feedback?.note));
  const [draft, setDraft] = useState(feedback?.note ?? "");

  return (
    <div className="mt-3 border-t border-forest/10 pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {OPTIONS.map((opt) => {
          const active = feedback?.status === opt.status;
          return (
            <button
              key={opt.status}
              type="button"
              title={opt.hint}
              aria-pressed={active}
              onClick={() => onSetStatus(opt.status)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                active ? opt.activeClass : "border-forest/15 bg-white/60 text-muted hover:border-forest/40 hover:text-forest"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
            feedback?.note ? "border-gold bg-gold-100 text-ink" : "border-forest/15 bg-white/60 text-muted hover:text-forest"
          }`}
        >
          {feedback?.note ? "Note ✓" : "Note"}
        </button>
      </div>

      {noteOpen && (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onSetNote(draft)}
            rows={2}
            placeholder="What do you want to remember about this? (saved on blur)"
            className="w-full resize-none rounded-xl border border-forest/15 bg-white/80 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest/40"
          />
        </div>
      )}
    </div>
  );
}
