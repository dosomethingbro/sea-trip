// src/lib/aiClient.ts
//
// Server-only. Central resolver for the language model used across the app.
//
// Priority:
//   1. ANTHROPIC_API_KEY present -> Claude (direct Anthropic provider, the
//      user's own key). This is the native LLM for synthesis + the console.
//   2. Otherwise -> Vercel AI Gateway model string (zero-config fallback).
//
// The model id is overridable via PLAN_ASSISTANT_MODEL so we can bump versions
// without code changes.

import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

// Latest Claude Sonnet available to this account (verified against the
// Anthropic models endpoint). Overridable via env.
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6";
const DEFAULT_GATEWAY_MODEL = "openai/gpt-5.4-mini";

/** True when Claude is configured as the active provider. */
export function usingClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** The model passed to generateText/streamText. */
export function getModel(): LanguageModel {
  if (usingClaude()) {
    return anthropic(process.env.PLAN_ASSISTANT_MODEL ?? DEFAULT_CLAUDE_MODEL);
  }
  // Gateway fallback — AI SDK accepts a bare model string here.
  return (process.env.PLAN_ASSISTANT_MODEL ?? DEFAULT_GATEWAY_MODEL) as unknown as LanguageModel;
}

/** Human-readable provider label for UI/debug surfaces. */
export function providerLabel(): string {
  return usingClaude()
    ? `Claude (${process.env.PLAN_ASSISTANT_MODEL ?? DEFAULT_CLAUDE_MODEL})`
    : "Vercel AI Gateway";
}
