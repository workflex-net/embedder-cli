import { existsSync, readFileSync, appendFileSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { homedir } from "os";
import { Colors, INSTALL_DIR } from "./constants";
import { printMessage } from "./utils";

function addToPath(configFile: string, command: string): void {
  const content = existsSync(configFile)
    ? readFileSync(configFile, "utf-8")
    : "";

  if (content.split("\n").includes(command)) {
    printMessage(
      "info",
      `Command already exists in ${configFile}, skipping write.`
    );
    return;
  }

  try {
    appendFileSync(configFile, `\n# embedder\n${command}\n`);
    printMessage(
      "info",
      `${Colors.MUTED}Successfully added ${Colors.NC}embedder ${Colors.MUTED}to $PATH in ${Colors.NC}${configFile}`
    );
  } catch {
    printMessage(
      "warning",
      `Manually add the directory to ${configFile} (or similar):`
    );
    printMessage("info", `  ${command}`);
  }
}

function getConfigFiles(shell: string): string[] {
  const home = homedir();
  const xdgConfigHome = process.env.XDG_CONFIG_HOME ?? join(home, ".config");
  const zdotdir = process.env.ZDOTDIR ?? home;

  switch (shell) {
    case "fish":
      return [join(home, ".config", "fish", "config.fish")];
    case "zsh":
      return [
        join(zdotdir, ".zshrc"),
        join(zdotdir, ".zshenv"),
        join(xdgConfigHome, "zsh", ".zshrc"),
        join(xdgConfigHome, "zsh", ".zshenv"),
      ];
    case "bash":
      return [
        join(home, ".bashrc"),
        join(home, ".bash_profile"),
        join(home, ".profile"),
        join(xdgConfigHome, "bash", ".bashrc"),
        join(xdgConfigHome, "bash", ".bash_profile"),
      ];
    case "ash":
    case "sh":
      return [join(home, ".ashrc"), join(home, ".profile"), "/etc/profile"];
    default:
      return [
        join(home, ".bashrc"),
        join(home, ".bash_profile"),
        join(xdgConfigHome, "bash", ".bashrc"),
        join(xdgConfigHome, "bash", ".bash_profile"),
      ];
  }
}

export function configureShellPath(noModifyPath: boolean): void {
  const currentShell = basename(process.env.SHELL ?? "bash");

  if (noModifyPath) return;

  const configFiles = getConfigFiles(currentShell);

  // Find first existing config file
  let configFile = "";
  for (const file of configFiles) {
    if (existsSync(file)) {
      configFile = file;
      break;
    }
  }

  if (!configFile) {
    printMessage(
      "warning",
      `No config file found for ${currentShell}. You may need to manually add to PATH:`
    );
    printMessage("info", `  export PATH="${INSTALL_DIR}:$PATH"`);
    return;
  }

  // Check if INSTALL_DIR is already in PATH
  const pathDirs = (process.env.PATH ?? "").split(":");
  if (pathDirs.includes(INSTALL_DIR)) {
    return;
  }

  let command: string;
  switch (currentShell) {
    case "fish":
      command = `fish_add_path "${INSTALL_DIR}"`;
      break;
    default:
      command = `export PATH="${INSTALL_DIR}:$PATH"`;
      break;
  }

  addToPath(configFile, command);
}

export function updateCurrentPath(): void {
  const pathDirs = (process.env.PATH ?? "").split(":");
  if (!pathDirs.includes(INSTALL_DIR)) {
    process.env.PATH = `${INSTALL_DIR}:${process.env.PATH}`;
  }
}

export function configureGithubActions(): void {
  if (
    process.env.GITHUB_ACTIONS === "true" &&
    process.env.GITHUB_PATH
  ) {
    appendFileSync(process.env.GITHUB_PATH, `${INSTALL_DIR}\n`);
    printMessage("info", `Added ${INSTALL_DIR} to $GITHUB_PATH`);
  }
}
