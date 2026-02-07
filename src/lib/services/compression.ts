// Original: src/lib/services/compression.ts
// Conversation compression for long conversations
import type { Message } from "../../types/api";

/**
 * Determine if a conversation should be compressed.
 */
export function shouldCompress(messages: Message[], maxTokenEstimate = 100000): boolean {
  const estimatedTokens = messages.reduce((sum, m) => sum + (m.content?.length ?? 0) / 4, 0);
  return estimatedTokens > maxTokenEstimate;
}

/**
 * Compress a conversation by summarizing older messages.
 * Aliased as vN in minified bundle.
 */
export async function compressConversation(messages: Message[]): Promise<Message[]> {
  // TODO: restore from lib_app.js - use LLM to summarize older messages
  return messages;
}

/** Alias used in minified bundle */
export const vN = compressConversation;

/**
 * Generate a short summary of a conversation.
 * Aliased as W6B in minified bundle.
 */
export async function generateShortSummary(messages: Message[]): Promise<string> {
  // TODO: restore from lib_app.js
  if (messages.length === 0) return "";
  return messages[0]?.content?.slice(0, 100) ?? "";
}

/** Alias used in minified bundle */
export const W6B = generateShortSummary;
