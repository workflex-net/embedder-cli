// Git operations

import { execSync } from "child_process";

export function isGitRepository(cwd?: string): boolean {
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

export function getGitDiff(cwd?: string, staged?: boolean): string {
  try {
    const args = staged ? "--cached" : "";
    return execSync(`git diff ${args}`, {
      cwd: cwd ?? process.cwd(),
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    }).trim();
  } catch {
    return "";
  }
}

export function getGitStatus(cwd?: string): string {
  try {
    return execSync("git status --porcelain", {
      cwd: cwd ?? process.cwd(),
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

export default { isGitRepository, getGitDiff, getGitStatus };
