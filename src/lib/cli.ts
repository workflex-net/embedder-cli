// CLI entry point

import { OC, loadConfig } from "./config";
import { getPlatformInfo, isGitRepository } from "./environment";
import { getCatalog } from "./catalog";
import { commonBaudRates } from "./serial/baudDetection";
import { ToolEngine } from "./tools/core/engine";
import { toolRegistry } from "./tools/core/registry";

export interface ParsedArgs {
  command?: string;
  flags: Record<string, string | boolean>;
  positional: string[];
}

export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  let command: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      flags[key] = val ?? true;
    } else if (arg.startsWith("-")) {
      flags[arg.slice(1)] = true;
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  return { command, flags, positional };
}

export async function startCli(): Promise<void> {
  const args = parseArgs();

  // Load config
  loadConfig({ version: "0.3.16" });

  switch (args.command) {
    case "probe":
      await cmdProbe();
      break;
    case "info":
      await cmdInfo();
      break;
    case "catalog":
      cmdCatalog();
      break;
    case "tools":
      await cmdTools();
      break;
    case "version":
      console.log(`embedder-cli v${OC.version}`);
      break;
    case "help":
    case undefined:
      printUsage();
      break;
    default:
      console.error(`Unknown command: ${args.command}`);
      printUsage();
      process.exit(1);
  }
}

/** Probe connected hardware (ST-Link + serial ports) */
async function cmdProbe(): Promise<void> {
  const { $ } = await import("bun" as string);

  console.log("=== Hardware Probe ===\n");

  // ST-Link
  console.log("[ST-Link]");
  try {
    const stinfo = await $`st-info --probe 2>&1`.text();
    if (stinfo.includes("Found") && !stinfo.includes("Found 0")) {
      console.log("  Status: detected");
      const chipMatch = stinfo.match(/chip[- ]?id:\s*(0x[\da-fA-F]+)/i);
      const flashMatch = stinfo.match(/flash:\s*(\d+)/i);
      const ramMatch = stinfo.match(/sram:\s*(\d+)/i);
      if (chipMatch) console.log(`  Chip ID: ${chipMatch[1]}`);
      if (flashMatch) console.log(`  Flash: ${Math.round(parseInt(flashMatch[1]) / 1024)}K`);
      if (ramMatch) console.log(`  SRAM: ${Math.round(parseInt(ramMatch[1]) / 1024)}K`);
    } else {
      console.log("  Status: not found");
    }
    console.log(`  Raw:\n${stinfo.trim().split("\n").map((l: string) => `    ${l}`).join("\n")}`);
  } catch {
    console.log("  Status: st-info not installed (apt install stlink-tools)");
  }

  // Serial ports
  console.log("\n[Serial Ports]");
  let foundPorts = false;
  for (const pattern of ["/dev/ttyACM*", "/dev/ttyUSB*"]) {
    try {
      const result = await $`ls ${pattern} 2>/dev/null`.text();
      for (const port of result.trim().split("\n").filter(Boolean)) {
        console.log(`  ${port.trim()}`);
        foundPorts = true;
      }
    } catch { /* no match */ }
  }
  if (!foundPorts) {
    console.log("  No serial ports found");
  }

  // Toolchain
  console.log("\n[Toolchain]");
  for (const [name, cmd] of [
    ["arm-none-eabi-gcc", "arm-none-eabi-gcc --version"],
    ["openocd", "openocd --version"],
    ["st-flash", "st-flash --version"],
  ] as const) {
    try {
      const ver = await $`${{ raw: cmd }} 2>&1`.text();
      const firstLine = ver.trim().split("\n")[0];
      console.log(`  ${name}: ${firstLine}`);
    } catch {
      console.log(`  ${name}: not found`);
    }
  }
}

/** Show environment info */
async function cmdInfo(): Promise<void> {
  console.log("=== Embedder CLI Info ===\n");
  console.log(`Version: ${OC.version}`);
  console.log(`API: ${OC.apiUrl}`);
  console.log(`Debug: ${OC.debug}`);
  console.log();

  const platform = getPlatformInfo();
  console.log("[Platform]");
  for (const [k, v] of Object.entries(platform)) {
    console.log(`  ${k}: ${v}`);
  }

  console.log(`\n[Git]`);
  console.log(`  Is git repo: ${isGitRepository()}`);

  console.log(`\n[Serial]`);
  console.log(`  Baud rates: ${commonBaudRates.join(", ")}`);
}

/** Show hardware catalog */
function cmdCatalog(): void {
  const catalog = getCatalog();
  console.log("=== Hardware Catalog ===\n");
  console.log(`Chips: ${catalog.chips.length}`);
  console.log(`Boards: ${catalog.boards.length}`);
  console.log(`Peripherals: ${catalog.peripherals.length}`);

  if (catalog.chips.length === 0) {
    console.log("\n(catalog is empty — stub not yet populated from extracted modules)");
  }
}

/** List registered tools */
async function cmdTools(): Promise<void> {
  // Import all tool modules to trigger registration
  const toolModules = await Promise.allSettled([
    import("./tools/file/readFile"),
    import("./tools/file/writeFile"),
    import("./tools/file/editFile"),
    import("./tools/file/listDirectory"),
    import("./tools/search/grep"),
    import("./tools/search/glob"),
    import("./tools/search/lsp"),
    import("./tools/system/shell"),
    import("./tools/conversation/askQuestion"),
    import("./tools/conversation/codeSearch"),
    import("./tools/conversation/documentSearch"),
    import("./tools/conversation/webSearch"),
    import("./tools/conversation/webFetch"),
    import("./tools/hardware/serialMonitor"),
    import("./tools/hardware/serialReadHistory"),
    import("./tools/hardware/serialSendCommand"),
    import("./tools/agent/delegateSubagent"),
    import("./tools/todo/todoRead"),
    import("./tools/todo/todoWrite"),
    import("./tools/mode/submitPlan"),
  ]);

  // Tools use createTool() but don't auto-register — register them now
  const engine = new ToolEngine();
  for (const result of toolModules) {
    if (result.status === "fulfilled") {
      const mod = result.value as Record<string, unknown>;
      for (const exp of Object.values(mod)) {
        if (exp && typeof exp === "object" && "metadata" in exp && "execute" in exp) {
          engine.registerTool(exp as any);
        }
      }
    }
  }

  const tools = engine.getRegisteredTools();
  console.log(`=== Registered Tools (${tools.length}) ===\n`);

  for (const name of tools.sort()) {
    const tool = toolRegistry[name];
    const status = isImplemented(tool) ? "OK" : "STUB";
    console.log(`  [${status.padEnd(4)}] ${name.padEnd(22)} ${tool.metadata.category}  ${tool.metadata.description}`);
  }

  const implemented = tools.filter((n) => isImplemented(toolRegistry[n])).length;
  console.log(`\nImplemented: ${implemented}/${tools.length}`);
}

function isImplemented(tool: any): boolean {
  // Try to detect if execute is a stub that just throws "Not implemented"
  const src = tool.execute.toString();
  return !src.includes("Not implemented") && !src.includes("throw new Error");
}

function printUsage(): void {
  console.log(`embedder-cli v${OC.version} (reverse-engineered skeleton)

Usage: bun run src/main.ts <command>

Commands:
  probe      Detect connected hardware (ST-Link, serial ports, toolchain)
  info       Show environment and platform info
  catalog    Show hardware catalog contents
  tools      List all registered tools and implementation status
  version    Print version
  help       Show this help`);
}

export default startCli;
