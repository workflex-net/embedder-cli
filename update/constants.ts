import { homedir } from "os";
import { join } from "path";

export const APP = "embedder-cli";
export const DEFAULT_VERSION = "0.3.16";

export const INSTALL_DIR = join(homedir(), ".embedder", "bin");

export const GITHUB_REPO = "embedder-dev/embedder-cli";
export const GITHUB_RELEASES_BASE = `https://github.com/${GITHUB_REPO}/releases`;

// ANSI color codes
export const Colors = {
  MUTED: "\x1b[0;2m",
  BOLD: "\x1b[1m",
  RED: "\x1b[0;31m",
  GREEN: "\x1b[0;32m",
  ORANGE: "\x1b[38;5;214m",
  NC: "\x1b[0m", // No Color
} as const;

// Dependency versions
export const RIPGREP_VERSION = "14.1.1";
export const CLANGD_VERSION = "19.1.2";
export const RUST_ANALYZER_VERSION = "2024-12-23";

// Banner ASCII art
export const BANNER = `
 _____ __  __ ____  _____ ____  ____  _____ ____
| ____|  \\/  | __ )| ____|  _ \\|  _ \\| ____|  _ \\
|  _| | |\\/| |  _ \\|  _| | | | | | | |  _| | |_) |
| |___| |  | | |_) | |___| |_| | |_| | |___|  _ <
|_____|_|  |_|____/|_____|____/|____/|_____|_| \\_\\
`;
