// Environment detection

import { execSync } from "child_process";

/** Check if current directory is a git repository (NO) */
export function NO(cwd?: string): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: cwd ?? process.cwd(),
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}
export const isGitRepository = NO;

/** Get terminal emulator name (SFB) */
export function SFB(): string {
  return (
    process.env.TERM_PROGRAM ??
    process.env.TERMINAL ??
    process.env.TERM ??
    "unknown"
  );
}
export const getTerminalName = SFB;

export function getPlatformInfo(): Record<string, string> {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    terminal: SFB(),
    shell: process.env.SHELL ?? "unknown",
  };
}

export default { isGitRepository, getTerminalName, getPlatformInfo };
