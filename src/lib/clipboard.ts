// Clipboard access

import { execSync } from "child_process";
import { getPlatform } from "./platform";

export function copyToClipboard(text: string): boolean {
  try {
    const platform = getPlatform();
    if (platform === "darwin") {
      execSync("pbcopy", { input: text });
    } else if (platform === "linux") {
      execSync("xclip -selection clipboard", { input: text });
    } else if (platform === "win32") {
      execSync("clip", { input: text });
    }
    return true;
  } catch {
    return false;
  }
}

export function readFromClipboard(): string | null {
  try {
    const platform = getPlatform();
    if (platform === "darwin") {
      return execSync("pbpaste", { encoding: "utf-8" });
    } else if (platform === "linux") {
      return execSync("xclip -selection clipboard -o", { encoding: "utf-8" });
    } else if (platform === "win32") {
      return execSync("powershell Get-Clipboard", { encoding: "utf-8" });
    }
    return null;
  } catch {
    return null;
  }
}

export default { copyToClipboard, readFromClipboard };
