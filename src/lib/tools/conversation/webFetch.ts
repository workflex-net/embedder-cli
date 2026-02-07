// Original: src/lib/tools/conversation/webFetch.ts
// Extracted: tools_webFetch.js (module CZB)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const webFetchTool = createTool({
  metadata: {
    name: "webFetch",
    displayName: "Web Fetch",
    description: "Fetch content from a URL and return it in the specified format.",
    category: "network",
  },
  inputSchema: z.object({
    url: z.string().describe("URL to fetch content from"),
    format: z.enum(["text", "html", "markdown", "json"]).optional().describe("Format to return the content in"),
    timeout: z.number().optional().describe("Request timeout in milliseconds"),
  }),
  execute: async (params, context) => {
    // TODO: Implement web content fetching
    throw new Error("Not implemented");
  },
});
