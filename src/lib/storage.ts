// Local storage - JSON file persistence

import * as fs from "fs";
import * as path from "path";
import { getDataDir } from "./paths";

/** Storage path builder (kL) */
export function kL(filename: string): string {
  return path.join(getDataDir(), filename);
}

/** Read JSON from storage (SLA) */
export function SLA<T = unknown>(filename: string, fallback?: T): T | undefined {
  const filepath = kL(filename);
  try {
    const data = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

/** Write JSON to storage (xLA) */
export function xLA<T = unknown>(filename: string, data: T): void {
  const filepath = kL(filename);
  const dir = path.dirname(filepath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

/** Delete from storage (JLA) */
export function JLA(filename: string): boolean {
  const filepath = kL(filename);
  try {
    fs.unlinkSync(filepath);
    return true;
  } catch {
    return false;
  }
}

export default { SLA, xLA, JLA, kL };
