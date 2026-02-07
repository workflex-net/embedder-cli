// /home/leo/work/embedder/src/types/cli.ts
// CLI types for application state management, commands, and status tracking.

export type AppStatus =
  | "initializing"
  | "ready"
  | "busy"
  | "waiting_for_input"
  | "running_command"
  | "error"
  | "shutting_down";

export interface AppState {
  status: AppStatus;
  activeView: ViewName;
  projectRoot: string;
  configPath: string;
  startedAt: number;
  lastActivityAt: number;
  flags: AppFlags;
  errors: AppError[];
}

export type ViewName =
  | "chat"
  | "editor"
  | "serial"
  | "catalog"
  | "settings"
  | "help"
  | "todos";

export interface AppFlags {
  verbose: boolean;
  debug: boolean;
  offline: boolean;
  noColor: boolean;
  jsonOutput: boolean;
}

export interface AppError {
  code: string;
  message: string;
  timestamp: number;
  recoverable: boolean;
  context?: Record<string, unknown>;
}

export interface Command {
  name: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
  timestamp: number;
}

export interface CommandDefinition {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  arguments: ArgumentDefinition[];
  flags: FlagDefinition[];
  handler: (cmd: Command) => Promise<CommandResult>;
  hidden?: boolean;
}

export interface ArgumentDefinition {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  validate?: (value: string) => boolean;
}

export interface FlagDefinition {
  name: string;
  short?: string;
  description: string;
  type: "string" | "boolean" | "number";
  defaultValue?: string | boolean | number;
  required?: boolean;
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode: number;
}

export interface CliConfig {
  prompt: string;
  historySize: number;
  autoComplete: boolean;
  theme: "dark" | "light" | "system";
  editor: string;
}
