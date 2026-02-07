// Original: src/lib/tools/core/createTool.ts
// Extracted: tools_createTool.js (moduleId)

import { z } from "zod";

export interface ToolMetadata {
  name: string;
  displayName: string;
  description: string;
  category: string;
  requiresConfirmation?: boolean;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  metadata: ToolMetadata;
  inputSchema: z.ZodObject<any>;
  execute: (params: TInput, context: any) => Promise<TOutput>;
}

export function createTool<TInput, TOutput>(definition: {
  metadata: ToolMetadata;
  inputSchema: z.ZodObject<any>;
  execute: (params: TInput, context: any) => Promise<TOutput>;
}): ToolDefinition<TInput, TOutput> {
  return {
    metadata: definition.metadata,
    inputSchema: definition.inputSchema,
    execute: definition.execute,
  };
}
