// src/lib/aiProvider.ts
//
// Server-only. Central place that resolves the language model used across the
// app. We use the user's OWN Anthropic API key (ANTHROPIC_API_KEY) via the
// native @ai-sdk/anthropic provider, so calls go straight to Claude rather than
// through a gateway. The key lives only in process.env and never reaches the
// browser.

import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

// Default to the latest Claude Sonnet (strong tool-use + structured output at a
// sensible cost). Overridable via env without code changes.
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6";

/** True when a usable Anthropic key is configured. */
export function hasClaudeKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Resolve the Claude model. Throws if no key is configured so callers can fall
 * back to the deterministic engine instead of making a doomed network call.
 */
export function claudeModel(modelId?: string): LanguageModel {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const anthropic = createAnthropic({ apiKey });
  return anthropic(modelId ?? process.env.CLAUDE_MODEL ?? DEFAULT_CLAUDE_MODEL);
}
