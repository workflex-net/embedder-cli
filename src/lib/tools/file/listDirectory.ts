// Original: src/lib/tools/file/listDirectory.ts
// Extracted: tools_listDirectory.js (module fZB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const listDirectoryTool = createTool({
  metadata: {
    name: "listDirectory",
    displayName: "List Directory",
    description: "List the contents of a directory at the specified path.",
    category: "file",
  },
  inputSchema: z.object({
    path: z.string().describe("Absolute path to the directory to list"),
    depth: z.number().optional().describe("Maximum depth for recursive listing"),
  }),
  execute: async (params, context) => {
    // TODO: Implement directory listing with depth support
    throw new Error("Not implemented");
  },
});
