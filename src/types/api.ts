// /home/leo/work/embedder/src/types/api.ts
// API types for message handling, tool calls, sessions, and conversations.

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  isError: boolean;
  exitCode?: number;
  duration?: number;
}

export interface Session {
  id: string;
  createdAt: number;
  updatedAt: number;
  conversations: Conversation[];
  activeConversationId: string | null;
  metadata?: SessionMetadata;
}

export interface SessionMetadata {
  title?: string;
  tags?: string[];
  projectRoot?: string;
}

export interface Conversation {
  id: string;
  sessionId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model?: string;
  tokenUsage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ApiRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  timeout?: number;
}

export interface ApiResponse {
  id: string;
  message: Message;
  usage: TokenUsage;
  stopReason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  latencyMs: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
}
