// Original: src/lib/tools/conversation/webSearch.ts
// Extracted: tools_webSearch.js (module wZB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const webSearchTool = createTool({
  metadata: {
    name: "webSearch",
    displayName: "Web Search",
    description: "Search the web for information using a query string.",
    category: "search",
  },
  inputSchema: z.object({
    query: z.string().describe("Search query string"),
    numResults: z.number().optional().describe("Number of results to return"),
    livecrawl: z.enum(["always", "fallback", "never"]).optional().describe("Live crawling behavior"),
    type: z.enum(["general", "news", "academic"]).optional().describe("Type of search to perform"),
  }),
  execute: async (params, context) => {
    // TODO: Implement web search
    throw new Error("Not implemented");
  },
});
