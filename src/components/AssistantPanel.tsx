"use client";

// Native in-app Claude assistant. Docks at the bottom-right of the workspace.
// It talks to /api/assistant (server-gated by session), and after each turn it
// revalidates the shared "workspace" SWR key so any decisions Claude logged for
// the logged-in partner appear immediately in the rest of the UI.

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSWRConfig } from "swr";

const SUGGESTIONS = [
  "Compare my favorited plans for overlap with Tobi.",
  "I love the street-food day in Hanoi — log it.",
  "Build a new plan from everything we've favorited so far.",
];

function toolLabel(name: string, output: unknown): string | null {
  const o = (output ?? {}) as Record<string, unknown>;
  if (o.ok === false) return `Could not log: ${String(o.error ?? "unknown error")}`;
  switch (name) {
    case "setActivityFeedback":
      return `Logged activity decision: ${String(o.status)}`;
    case "setDestinationDecision":
      return `Logged destination decision: ${String(o.status)}`;
    case "toggleFavorite":
      return o.favorite ? "Added plan to favorites" : "Removed plan from favorites";
    case "createTravelPlan":
      return `Created new plan: "${String(o.title)}" (${String(o.days)} days) — added to your library`;
    default:
      return "Updated workspace";
  }
}

export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { mutate } = useSWRConfig();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
    // After each assistant turn, refresh the workspace so logged decisions show.
    onFinish: () => {
      void mutate("workspace");
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    void sendMessage({ text: value });
    setInput("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary fixed bottom-5 right-5 z-40 shadow-lg"
        aria-label="Open Claude assistant"
      >
        Ask Claude
      </button>
    );
  }

  return (
    <section
      className="card fixed bottom-5 right-5 z-40 flex h-[32rem] w-[min(26rem,calc(100vw-2.5rem))] flex-col overflow-hidden p-0 shadow-2xl"
      aria-label="Claude assistant"
    >
      <header className="flex items-center justify-between border-b border-black/10 bg-forest px-4 py-3 text-cream">
        <div>
          <p className="text-sm font-semibold">Claude</p>
          <p className="text-[11px] opacity-80">Logs decisions for the signed-in partner</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-cream/80 hover:bg-white/10"
          aria-label="Close assistant"
        >
          Close
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-clay">
              Ask me to compare plans, weigh tradeoffs, or record a Love/Keep/Defer/Drop on an
              activity or a Love/Like/Maybe/Skip on a destination.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="chip text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            {m.parts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <p
                    key={i}
                    className={
                      m.role === "user"
                        ? "ml-auto inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-forest px-3 py-2 text-left text-cream"
                        : "inline-block max-w-[90%] whitespace-pre-wrap rounded-2xl bg-black/[0.04] px-3 py-2 text-ink"
                    }
                  >
                    {part.text}
                  </p>
                );
              }
              // Tool activity (static tool parts are typed `tool-<name>`).
              if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                const name =
                  part.type === "dynamic-tool"
                    ? (part as { toolName?: string }).toolName ?? "tool"
                    : part.type.slice("tool-".length);
                const state = (part as { state?: string }).state;
                if (state === "output-available") {
                  const label = toolLabel(name, (part as { output?: unknown }).output);
                  return label ? (
                    <p key={i} className="mt-1 inline-block rounded-full bg-clay/15 px-3 py-1 text-xs text-clay">
                      {label}
                    </p>
                  ) : null;
                }
                if (state === "input-streaming" || state === "input-available") {
                  return (
                    <p key={i} className="mt-1 text-xs italic text-clay/70">
                      Updating workspace…
                    </p>
                  );
                }
              }
              return null;
            })}
          </div>
        ))}

        {busy && <p className="text-xs italic text-clay/70">Claude is thinking…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-black/10 px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Claude or log a decision…"
          className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-forest"
          aria-label="Message Claude"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary text-sm disabled:opacity-40">
          Send
        </button>
      </form>
    </section>
  );
}
