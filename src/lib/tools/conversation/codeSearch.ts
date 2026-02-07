// Original: src/lib/tools/conversation/codeSearch.ts
// Extracted: tools_codeSearch.js (module eVB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const codeSearchTool = createTool({
  metadata: {
    name: "codeSearch",
    displayName: "Code Search",
    description: "Search for code using semantic search across the codebase.",
    category: "search",
  },
  inputSchema: z.object({
    query: z.string().describe("Natural language query to search for in the codebase"),
    tokensNum: z.number().optional().describe("Maximum number of tokens to return in results"),
  }),
  execute: async (params, context) => {
    // TODO: Implement semantic code search
    throw new Error("Not implemented");
  },
});
