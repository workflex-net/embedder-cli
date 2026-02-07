// Original: src/lib/tools/system/shell.ts
// Extracted: tools_shell.js (module Q1B)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const shellTool = createTool({
  metadata: {
    name: "shell",
    displayName: "Shell",
    description: "Execute a shell command in the system terminal.",
    category: "system",
    requiresConfirmation: true,
  },
  inputSchema: z.object({
    command: z.string().describe("Shell command to execute"),
    timeout: z.number().optional().describe("Timeout in milliseconds for the command"),
  }),
  execute: async (params, context) => {
    // TODO: Implement shell command execution with timeout and sandboxing
    throw new Error("Not implemented");
  },
});
