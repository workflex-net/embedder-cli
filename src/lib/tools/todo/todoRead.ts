// Original: src/lib/tools/todo/todoRead.ts
// Extracted: tools_todoRead.js (module K6B)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const todoReadTool = createTool({
  metadata: {
    name: "todoRead",
    displayName: "Todo Read",
    description: "Read the current list of todos for this session.",
    category: "development",
  },
  inputSchema: z.object({}),
  execute: async (params, context) => {
    // TODO: Implement todo reading from state
    throw new Error("Not implemented");
  },
});
