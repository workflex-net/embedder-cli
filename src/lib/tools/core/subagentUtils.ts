// Original: src/lib/tools/core/subagentUtils.ts
// Extracted: tools_subagentUtils.js (moduleId)

export enum SubagentType {
  Code = "code",
  Research = "research",
  Review = "review",
  Test = "test",
  Refactor = "refactor",
}

export interface SubagentConfig {
  type: SubagentType;
  maxTokens: number;
  allowedTools: string[];
  systemPrompt: string;
}

const SUBAGENT_CONFIGS: Record<SubagentType, SubagentConfig> = {
  [SubagentType.Code]: {
    type: SubagentType.Code,
    maxTokens: 16384,
    allowedTools: ["readFile", "writeFile", "editFile", "listDirectory", "glob", "grep", "shell"],
    systemPrompt: "You are a coding subagent. Focus on implementing code changes accurately.",
  },
  [SubagentType.Research]: {
    type: SubagentType.Research,
    maxTokens: 8192,
    allowedTools: ["readFile", "listDirectory", "glob", "grep", "codeSearch", "documentSearch", "webFetch", "webSearch"],
    systemPrompt: "You are a research subagent. Focus on gathering and analyzing information.",
  },
  [SubagentType.Review]: {
    type: SubagentType.Review,
    maxTokens: 8192,
    allowedTools: ["readFile", "listDirectory", "glob", "grep", "lsp"],
    systemPrompt: "You are a code review subagent. Focus on reviewing code for correctness and quality.",
  },
  [SubagentType.Test]: {
    type: SubagentType.Test,
    maxTokens: 8192,
    allowedTools: ["readFile", "writeFile", "editFile", "listDirectory", "glob", "grep", "shell"],
    systemPrompt: "You are a testing subagent. Focus on writing and running tests.",
  },
  [SubagentType.Refactor]: {
    type: SubagentType.Refactor,
    maxTokens: 16384,
    allowedTools: ["readFile", "writeFile", "editFile", "listDirectory", "glob", "grep", "lsp"],
    systemPrompt: "You are a refactoring subagent. Focus on improving code structure without changing behavior.",
  },
};

export function getSubagentConfig(type: SubagentType): SubagentConfig {
  const config = SUBAGENT_CONFIGS[type];
  if (!config) {
    throw new Error(`Unknown subagent type: ${type}`);
  }
  return config;
}
