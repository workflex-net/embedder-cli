// Original: src/lib/tools/core/modeUtils.ts
// Extracted: tools_modeUtils.js (moduleId)

import * as path from "path";
import * as fs from "fs";

export type Mode = "plan" | "act";

const PLAN_MODE_ALLOWED_TOOLS = new Set([
  "readFile",
  "listDirectory",
  "glob",
  "grep",
  "lsp",
  "askQuestion",
  "codeSearch",
  "documentSearch",
  "webFetch",
  "webSearch",
  "todoRead",
  "submitPlan",
]);

export function isToolAllowedInMode(toolName: string, mode: Mode): boolean {
  if (mode === "act") {
    return true;
  }
  return PLAN_MODE_ALLOWED_TOOLS.has(toolName);
}

export function getPlanFilePath(projectRoot: string): string {
  return path.join(projectRoot, ".embedder", "plans", "current-plan.md");
}

export async function ensurePlanDir(projectRoot: string): Promise<string> {
  const planDir = path.join(projectRoot, ".embedder", "plans");
  await fs.promises.mkdir(planDir, { recursive: true });
  return planDir;
}
