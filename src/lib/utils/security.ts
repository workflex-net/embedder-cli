// Security checks

import * as path from "path";

/** Check if a path is inside the project directory (xx) */
export function xx(filePath: string, projectRoot: string): boolean {
  const resolved = path.resolve(filePath);
  const root = path.resolve(projectRoot);
  return resolved.startsWith(root + path.sep) || resolved === root;
}
export const isPathInsideProject = xx;

export function sanitizePath(input: string): string {
  // Remove null bytes
  let cleaned = input.replace(/\0/g, "");
  // Collapse multiple slashes
  cleaned = cleaned.replace(/\/+/g, "/");
  // Resolve .. and . components but keep relative if input was relative
  if (path.isAbsolute(cleaned)) {
    return path.resolve(cleaned);
  }
  // For relative paths, normalize but ensure no traversal above root
  const normalized = path.normalize(cleaned);
  if (normalized.startsWith("..")) {
    throw new Error(`Path traversal detected: ${input}`);
  }
  return normalized;
}

export default { isPathInsideProject, sanitizePath };
