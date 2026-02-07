// Original: src/lib/tools/core/registry.ts
// Extracted: tools_registry.js (moduleId)

import { ToolDefinition } from "./createTool";

export const toolRegistry: Record<string, ToolDefinition> = {};

export function registerTool(tool: ToolDefinition): void {
  toolRegistry[tool.metadata.name] = tool;
}

export function getAvailableTools(): ToolDefinition[] {
  return Object.values(toolRegistry);
}

export function getToolByName(name: string): ToolDefinition | undefined {
  return toolRegistry[name];
}
