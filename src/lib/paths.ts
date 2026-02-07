// Path utilities

import * as path from "path";
import * as os from "os";

export function getDataDir(): string {
  const base =
    process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
  return path.join(base, "embedder");
}

export function getConfigDir(): string {
  const base =
    process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(base, "embedder");
}

export function getCacheDir(): string {
  const base =
    process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), ".cache");
  return path.join(base, "embedder");
}

/** Path builder utility (kL) */
export function kL(...segments: string[]): string {
  return path.resolve(...segments);
}

export default { getDataDir, getConfigDir, getCacheDir, kL };
