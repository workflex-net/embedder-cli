// Original: src/lib/tools/hardware/serialSendCommand.ts
// Extracted: tools_serialSendCommand.js (moduleId)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const serialSendCommandTool = createTool({
  metadata: {
    name: "serial_send_command",
    displayName: "Serial Send Command",
    description: "Send a command string to a serial port.",
    category: "system",
    requiresConfirmation: true,
  },
  inputSchema: z.object({
    port: z.string().describe("Serial port path (e.g., /dev/ttyUSB0)"),
    command: z.string().describe("Command string to send to the serial port"),
    baud_rate: z.number().optional().describe("Baud rate for the serial connection (default: 115200)"),
  }),
  execute: async (params, context) => {
    // TODO: Implement serial command sending
    throw new Error("Not implemented");
  },
});
