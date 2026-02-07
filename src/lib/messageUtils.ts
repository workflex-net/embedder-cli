// Message utilities

export interface ApiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface ToolGroupMessage {
  type: "tool_group";
  toolName: string;
  status: "pending" | "running" | "complete" | "error";
  result?: string;
}

/** Convert internal messages to API format (x6B) */
export function x6B(
  messages: Array<{ role: string; content: string; [key: string]: unknown }>,
): ApiMessage[] {
  return messages.map((msg) => ({
    role: msg.role as ApiMessage["role"],
    content: msg.content,
    ...(msg.toolCallId ? { toolCallId: msg.toolCallId as string } : {}),
    ...(msg.name ? { name: msg.name as string } : {}),
  }));
}
export const convertToApiMessages = x6B;

export function createToolGroupMessage(
  toolName: string,
  status: ToolGroupMessage["status"] = "pending",
): ToolGroupMessage {
  return { type: "tool_group", toolName, status };
}

export function updateToolResult(
  message: ToolGroupMessage,
  result: string,
): ToolGroupMessage {
  return { ...message, status: "complete", result };
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

export default {
  convertToApiMessages,
  createToolGroupMessage,
  updateToolResult,
  estimateTokens,
};
