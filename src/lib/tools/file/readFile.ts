// Original: src/lib/tools/file/readFile.ts
// Extracted: tools_readFile.js (module hZB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const readFileTool = createTool({
  metadata: {
    name: "readFile",
    displayName: "Read File",
    description: "Read the contents of a file at the specified path, with optional offset and limit for partial reads.",
    category: "file",
  },
  inputSchema: z.object({
    path: z.string().describe("Absolute path to the file to read"),
    offset: z.number().optional().describe("Line offset to start reading from"),
    limit: z.number().optional().describe("Maximum number of lines to read"),
  }),
  execute: async (params, context) => {
    // TODO: Implement file reading with offset/limit support
    throw new Error("Not implemented");
  },
});
