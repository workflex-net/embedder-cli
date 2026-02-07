// Original: src/lib/tools/core/engine.ts
// Extracted: tools_engine.js (moduleId)

import { ToolDefinition } from "./createTool";
import { toolRegistry, registerTool as registryRegisterTool, getToolByName } from "./registry";

export class ToolEngine {
  private context: any;

  constructor(context?: any) {
    this.context = context || {};
  }

  registerTool(tool: ToolDefinition): void {
    registryRegisterTool(tool);
  }

  async executeTool(name: string, params: any): Promise<any> {
    const tool = getToolByName(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const validated = tool.inputSchema.parse(params);
    return tool.execute(validated, this.context);
  }

  getRegisteredTools(): string[] {
    return Object.keys(toolRegistry);
  }
}

export function registerTool(tool: ToolDefinition): void {
  registryRegisterTool(tool);
}

export async function executeTool(name: string, params: any, context?: any): Promise<any> {
  const engine = new ToolEngine(context);
  return engine.executeTool(name, params);
}
