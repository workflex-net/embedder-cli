// Original: src/lib/serial/textProcessing.ts
// Serial text processing utilities

/** Strip ANSI escape codes from a string */
export function stripAnsiCodes(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

/** Process serial output for display */
export function processSerialOutput(raw: Buffer | string): string {
  const text = typeof raw === "string" ? raw : raw.toString("utf-8");
  // Strip ANSI codes and normalize line endings
  const cleaned = stripAnsiCodes(text);
  return cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
