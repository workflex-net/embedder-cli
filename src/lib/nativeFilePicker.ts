// Native file picker

import { execSync } from "child_process";
import { getPlatform } from "./platform";

export function openFilePicker(options?: {
  title?: string;
  filters?: string[];
}): string | null {
  const platform = getPlatform();

  try {
    if (platform === "darwin") {
      const filterArg = options?.filters
        ? `-t ${options.filters.join(" ")}`
        : "";
      const result = execSync(
        `osascript -e 'POSIX path of (choose file ${filterArg})'`,
        { encoding: "utf-8" },
      );
      return result.trim();
    } else if (platform === "linux") {
      const result = execSync(
        `zenity --file-selection --title="${options?.title ?? "Select File"}" 2>/dev/null`,
        { encoding: "utf-8" },
      );
      return result.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function openDirectoryPicker(options?: {
  title?: string;
}): string | null {
  const platform = getPlatform();

  try {
    if (platform === "darwin") {
      const result = execSync(
        `osascript -e 'POSIX path of (choose folder)'`,
        { encoding: "utf-8" },
      );
      return result.trim();
    } else if (platform === "linux") {
      const result = execSync(
        `zenity --file-selection --directory --title="${options?.title ?? "Select Directory"}" 2>/dev/null`,
        { encoding: "utf-8" },
      );
      return result.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export default { openFilePicker, openDirectoryPicker };
