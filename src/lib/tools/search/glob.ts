// Original: src/lib/tools/search/glob.ts
// Extracted: tools_glob.js (module mZB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const globTool = createTool({
  metadata: {
    name: "glob",
    displayName: "Find Files",
    description: "Find files matching a glob pattern within a directory.",
    category: "search",
  },
  inputSchema: z.object({
    pattern: z.string().describe("Glob pattern to match files against"),
    path: z.string().optional().describe("Base directory path to search within"),
  }),
  execute: async (params, context) => {
    // TODO: Implement glob-based file finding
    throw new Error("Not implemented");
  },
});
