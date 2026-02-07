// Original: src/lib/tools/agent/delegateSubagent.ts
// Extracted: tools_delegateSubagent.js (module tVB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const delegateSubagentTool = createTool({
  metadata: {
    name: "delegateSubagent",
    displayName: "Delegate to Subagent",
    description: "Delegate a task to a specialized subagent for parallel or focused execution.",
    category: "system",
  },
  inputSchema: z.object({
    agent_type: z.enum(["code", "research", "review", "test", "refactor"]).describe("Type of subagent to delegate to"),
    task_description: z.string().describe("Description of the task to delegate"),
    context: z.string().optional().describe("Additional context to provide to the subagent"),
  }),
  execute: async (params, context) => {
    // TODO: Implement subagent delegation
    throw new Error("Not implemented");
  },
});
