// Context message building

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ContextOptions {
  projectPath?: string;
  includeGitContext?: boolean;
  includeFileStructure?: boolean;
  customInstructions?: string;
}

export function buildSystemPrompt(options?: ContextOptions): string {
  const parts: string[] = [
    "You are an embedded systems programming assistant.",
  ];

  if (options?.customInstructions) {
    parts.push(options.customInstructions);
  }

  if (options?.includeGitContext) {
    parts.push("The project is tracked with git.");
  }

  return parts.join("\n\n");
}

export function buildContextMessages(options?: ContextOptions): Message[] {
  const messages: Message[] = [];

  messages.push({
    role: "system",
    content: buildSystemPrompt(options),
  });

  return messages;
}

export default { buildContextMessages, buildSystemPrompt };
