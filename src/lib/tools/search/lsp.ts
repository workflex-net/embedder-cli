// Original: src/lib/tools/search/lsp.ts
// Extracted: tools_lsp.js (module B6B)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const lspTool = createTool({
  metadata: {
    name: "lsp",
    displayName: "LSP",
    description: "Perform Language Server Protocol operations such as go-to-definition, find references, and hover.",
    category: "search",
  },
  inputSchema: z.object({
    operation: z.enum(["definition", "references", "hover", "diagnostics", "completion"]).describe("LSP operation to perform"),
    path: z.string().describe("Absolute path to the file"),
    line: z.number().describe("Line number (0-indexed)"),
    character: z.number().describe("Character offset (0-indexed)"),
  }),
  execute: async (params, context) => {
    // TODO: Implement LSP protocol operations
    throw new Error("Not implemented");
  },
});
