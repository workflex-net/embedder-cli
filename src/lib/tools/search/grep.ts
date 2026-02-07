// Original: src/lib/tools/search/grep.ts
// Extracted: tools_grep.js (module eZB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const grepTool = createTool({
  metadata: {
    name: "grep",
    displayName: "Search Files",
    description: "Search file contents using a regex pattern.",
    category: "search",
  },
  inputSchema: z.object({
    pattern: z.string().describe("Regex pattern to search for"),
    path: z.string().optional().describe("Base directory path to search within"),
    filePattern: z.string().optional().describe("Glob pattern to filter files to search"),
    caseSensitive: z.boolean().optional().describe("Whether the search should be case-sensitive"),
  }),
  execute: async (params, context) => {
    // TODO: Implement grep-based file content search
    throw new Error("Not implemented");
  },
});
