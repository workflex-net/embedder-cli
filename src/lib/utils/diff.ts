// Diff generation

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

/** Normalize line endings (Do) */
export function Do(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
export const normalizeLineEndings = Do;

/** Generate a unified diff (c4) */
export function c4(
  original: string,
  modified: string,
  filename?: string,
): string {
  const origLines = Do(original).split("\n");
  const modLines = Do(modified).split("\n");
  const header = filename
    ? `--- a/${filename}\n+++ b/${filename}\n`
    : "--- a\n+++ b\n";

  const diffLines: string[] = [header];
  const maxLen = Math.max(origLines.length, modLines.length);

  for (let i = 0; i < maxLen; i++) {
    const origLine = origLines[i];
    const modLine = modLines[i];

    if (origLine === modLine) {
      diffLines.push(` ${origLine ?? ""}`);
    } else {
      if (origLine !== undefined) {
        diffLines.push(`-${origLine}`);
      }
      if (modLine !== undefined) {
        diffLines.push(`+${modLine}`);
      }
    }
  }

  return diffLines.join("\n");
}
export const generateDiff = c4;

/** Apply an edit to text (jKA) */
export function jKA(
  original: string,
  startLine: number,
  endLine: number,
  replacement: string,
): string {
  const lines = Do(original).split("\n");
  const before = lines.slice(0, startLine);
  const after = lines.slice(endLine);
  const replacementLines = Do(replacement).split("\n");
  return [...before, ...replacementLines, ...after].join("\n");
}
export const applyEdit = jKA;

export default { generateDiff, applyEdit, normalizeLineEndings };
