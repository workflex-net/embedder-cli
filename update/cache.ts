import { existsSync, rmSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";
import { Colors } from "./constants";
import { printMessage } from "./utils";

export function clearCache(): void {
  let cacheDir: string;

  if (platform() === "darwin") {
    cacheDir = join(homedir(), "Library", "Caches", "embedder-cli");
  } else {
    // Linux: respect XDG_CACHE_HOME or default to ~/.cache
    const xdgCacheHome =
      process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache");
    cacheDir = join(xdgCacheHome, "embedder-cli");
  }

  if (existsSync(cacheDir)) {
    printMessage(
      "info",
      `${Colors.MUTED}Clearing cache at ${Colors.NC}${cacheDir}`
    );
    rmSync(cacheDir, { recursive: true, force: true });
    printMessage("success", "Cache cleared");
  }
}
