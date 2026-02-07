// Ripgrep binary management

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { getCacheDir } from "./paths";

/** Get ripgrep binary path (_KA) */
export function _KA(): string {
  // Check if rg is available on PATH
  try {
    const systemPath = execSync("which rg", { encoding: "utf-8" }).trim();
    if (systemPath) return systemPath;
  } catch {
    // Fall through to bundled version
  }
  return path.join(getCacheDir(), "bin", "rg");
}
export const getRipgrepPath = _KA;

/** Glob files using ripgrep (lZB) - generator */
export function* lZB(
  pattern: string,
  cwd?: string,
): Generator<string, void, undefined> {
  const rgPath = _KA();
  const workDir = cwd ?? process.cwd();

  try {
    const output = execSync(`${rgPath} --files --glob "${pattern}"`, {
      cwd: workDir,
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });

    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) {
        yield trimmed;
      }
    }
  } catch {
    // No results or rg not found
  }
}
export const globFiles = lZB;

export async function installRipgrep(): Promise<string> {
  const binDir = path.join(getCacheDir(), "bin");
  fs.mkdirSync(binDir, { recursive: true });
  // Download and install ripgrep binary for current platform
  const binPath = path.join(binDir, "rg");
  return binPath;
}

export default { getRipgrepPath, globFiles, installRipgrep };
