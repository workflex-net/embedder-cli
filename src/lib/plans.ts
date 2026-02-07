// Plan file management

import * as fs from "fs";
import * as path from "path";
import { getDataDir } from "./paths";

/** Get plan directory (MZB) */
export function MZB(): string {
  return path.join(getDataDir(), "plans");
}
export const getPlanDir = MZB;

/** Ensure plan directory exists (HZB) */
export function HZB(): string {
  const dir = MZB();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
export const ensurePlanDir = HZB;

/** Get plan file path (aU) */
export function aU(planId: string): string {
  return path.join(MZB(), `${planId}.json`);
}
export const getPlanFilePath = aU;

export default { getPlanFilePath, getPlanDir, ensurePlanDir };
