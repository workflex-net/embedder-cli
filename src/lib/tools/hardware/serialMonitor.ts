// Original: src/lib/tools/hardware/serialMonitor.ts
// Extracted: tools_serialMonitor.js (moduleId)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const serialMonitorTool = createTool({
  metadata: {
    name: "serial_monitor",
    displayName: "Serial Monitor",
    description: "Start monitoring a serial port, capturing output until a stop string is received or timeout occurs.",
    category: "system",
    requiresConfirmation: true,
  },
  inputSchema: z.object({
    port: z.string().optional().describe("Serial port path (e.g., /dev/ttyUSB0). Auto-detected if omitted."),
    baud_rate: z.number().optional().describe("Baud rate for the serial connection (default: 115200)"),
    stop_string: z.string().optional().describe("String that triggers the monitor to stop"),
    timeout: z.number().optional().describe("Timeout in milliseconds before stopping"),
  }),
  execute: async (params, context) => {
    // TODO: Implement serial port monitoring
    throw new Error("Not implemented");
  },
});
