// File mention parsing

import * as path from "path";
import * as fs from "fs";

export interface FileMention {
  raw: string;
  resolved: string;
  line?: number;
}

export function resolveFilePath(mention: string, cwd?: string): string {
  const base = cwd ?? process.cwd();
  const cleaned = mention.replace(/^@/, "").split(":")[0];
  return path.resolve(base, cleaned);
}

export function parseFileMentions(text: string, cwd?: string): FileMention[] {
  const mentions: FileMention[] = [];
  // Match @path/to/file or @path/to/file:line patterns
  const regex = /@([\w./_-]+(?::\d+)?)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[1];
    const [filePart, linePart] = raw.split(":");
    const resolved = resolveFilePath(filePart, cwd);

    if (fs.existsSync(resolved)) {
      mentions.push({
        raw: match[0],
        resolved,
        line: linePart ? parseInt(linePart, 10) : undefined,
      });
    }
  }

  return mentions;
}

export default { parseFileMentions, resolveFilePath };
