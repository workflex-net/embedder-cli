import { join } from "path";

const ROOT = join(import.meta.dir, "..");

export const config = {
  /** Root of the embedder project */
  projectRoot: ROOT,

  /** Path to the real embedder binary */
  embedderBin: join(process.env.HOME ?? "/home/leo", ".embedder/bin/embedder"),

  /** Path to Claude Code executable */
  claudeCodePath: process.env.CLAUDE_CODE_PATH ?? "/home/leo/.npm-global/bin/claude",

  /** Executable runtime for Claude Code */
  claudeCodeExecutable: "node" as const,

  /** Extracted modules directory */
  extractedModules: join(ROOT, "extracted/modules"),

  /** Our rebuilt source directory */
  srcDir: join(ROOT, "src"),

  /** Results output directory */
  resultsDir: join(import.meta.dir, "results"),

  /** Default model for agent SDK queries */
  model: "claude-sonnet-4-20250514",

  /** Max turns per scenario runner */
  maxTurns: 25,

  /** Default scenario timeout in ms */
  defaultTimeout: 120_000,

  /** Hardware serial port */
  serialPort: "/dev/ttyACM0",

  /** Default baud rate */
  baudRate: 115200,

  /** ST-Link expected MCU */
  expectedMcu: "STM32G4",

  /** The 16 tools in the real embedder FZB set */
  embedderTools: [
    "readFile",
    "listDirectory",
    "grep",
    "glob",
    "todoRead",
    "documentSearch",
    "codeSearch",
    "webSearch",
    "webFetch",
    "submitPlan",
    "askQuestion",
    "writeFile",
    "editFile",
    "lsp",
    "serialReadHistory",
    "delegateSubagent",
  ] as const,

  /** Mapped tool names to Claude Agent SDK built-in tools */
  sdkToolMapping: {
    readFile: "Read",
    listDirectory: "Bash",
    grep: "Grep",
    glob: "Glob",
    writeFile: "Write",
    editFile: "Edit",
  } as const,
} as const;

export type Config = typeof config;
