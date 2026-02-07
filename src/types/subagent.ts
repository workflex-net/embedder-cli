// /home/leo/work/embedder/src/types/subagent.ts
// Subagent types for delegated task execution, configuration, and result handling.

export type SubagentType =
  | "code_review"
  | "code_generation"
  | "documentation"
  | "testing"
  | "debugging"
  | "refactoring"
  | "hardware_analysis"
  | "build"
  | "flash"
  | "custom";

export type SubagentStatus =
  | "idle"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

export interface SubagentConfig {
  type: SubagentType;
  name: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout: number;
  retryCount: number;
  systemPrompt?: string;
  tools: SubagentToolPermission[];
  workingDirectory?: string;
  environment?: Record<string, string>;
  constraints?: SubagentConstraints;
}

export interface SubagentConstraints {
  maxFileEdits?: number;
  maxCommands?: number;
  allowedPaths?: string[];
  deniedPaths?: string[];
  allowedCommands?: string[];
  deniedCommands?: string[];
  readOnly?: boolean;
}

export interface SubagentToolPermission {
  name: string;
  allowed: boolean;
  restrictions?: Record<string, unknown>;
}

export interface SubagentTask {
  id: string;
  agentConfig: SubagentConfig;
  prompt: string;
  context: SubagentContext;
  parentTaskId?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  status: SubagentStatus;
}

export interface SubagentContext {
  files: string[];
  relevantCode?: string[];
  projectInfo?: Record<string, unknown>;
  previousResults?: SubagentResult[];
}

export interface SubagentResult {
  taskId: string;
  type: SubagentType;
  status: "success" | "partial" | "failure";
  output: string;
  artifacts: SubagentArtifact[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
  };
  duration: number;
  error?: SubagentError;
}

export interface SubagentArtifact {
  type: "file_edit" | "file_create" | "file_delete" | "command_output" | "analysis" | "suggestion";
  path?: string;
  content: string;
  description: string;
}

export interface SubagentError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

export interface SubagentRegistry {
  agents: Map<string, SubagentConfig>;
  running: Map<string, SubagentTask>;
  maxConcurrent: number;
}
