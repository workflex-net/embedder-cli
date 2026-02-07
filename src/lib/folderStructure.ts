// Folder structure scanning

import * as fs from "fs";
import * as path from "path";

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileEntry[];
  size?: number;
}

/** Scan folder structure (KfB) */
export function KfB(
  dir: string,
  options?: { maxDepth?: number; ignore?: string[] },
): FileEntry[] {
  const maxDepth = options?.maxDepth ?? 5;
  const ignore = new Set(options?.ignore ?? ["node_modules", ".git", ".cache"]);

  function scan(currentDir: string, depth: number): FileEntry[] {
    if (depth > maxDepth) return [];

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((e) => !ignore.has(e.name))
      .map((entry) => {
        const fullPath = path.join(currentDir, entry.name);
        const fileEntry: FileEntry = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? "directory" : "file",
        };

        if (entry.isDirectory()) {
          fileEntry.children = scan(fullPath, depth + 1);
        } else {
          try {
            fileEntry.size = fs.statSync(fullPath).size;
          } catch {
            fileEntry.size = 0;
          }
        }

        return fileEntry;
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }

  return scan(dir, 0);
}
export const scanFolderStructure = KfB;

export default { scanFolderStructure };
