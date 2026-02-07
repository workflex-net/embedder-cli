// Original: src/lib/tools/hardware/serialReadHistory.ts
// Extracted: tools_serialReadHistory.js (moduleId)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const serialReadHistoryTool = createTool({
  metadata: {
    name: "serial_read_history",
    displayName: "Serial Read History",
    description: "Read the history of serial port output captured by the serial monitor.",
    category: "system",
  },
  inputSchema: z.object({
    port: z.string().optional().describe("Serial port path to read history from"),
    only_new: z.boolean().optional().describe("Only return new output since last read"),
    last_n_lines: z.number().optional().describe("Number of most recent lines to return"),
  }),
  execute: async (params, context) => {
    // TODO: Implement serial history reading
    throw new Error("Not implemented");
  },
});
