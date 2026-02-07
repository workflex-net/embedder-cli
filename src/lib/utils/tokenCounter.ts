// Token counting

const AVG_CHARS_PER_TOKEN = 4;
const CODE_CHARS_PER_TOKEN = 3.5;

/** Estimate token count for text (cx) */
export function cx(text: string): number {
  if (!text) return 0;
  // Use a simple heuristic: ~4 chars per token for English, ~3.5 for code
  const hasCodeIndicators = /[{}();=><]/.test(text);
  const ratio = hasCodeIndicators ? CODE_CHARS_PER_TOKEN : AVG_CHARS_PER_TOKEN;
  return Math.ceil(text.length / ratio);
}
export const estimateTokenCount = cx;

/** Count tokens across an array of messages (fx) */
export function fx(
  messages: Array<{ role: string; content: string }>,
): number {
  let total = 0;
  for (const msg of messages) {
    // Each message has ~4 tokens of overhead (role, delimiters)
    total += 4;
    total += cx(msg.content);
  }
  // Add 2 tokens for the conversation frame
  total += 2;
  return total;
}
export const countMessageTokens = fx;

export function isOverContextLimit(
  messages: Array<{ role: string; content: string }>,
  limit: number = 128_000,
): boolean {
  return fx(messages) > limit;
}

export default { estimateTokenCount, countMessageTokens, isOverContextLimit };
