import { $ } from "bun";

export interface ProbeInfo {
  found: boolean;
  mcu?: string;
  flashSize?: string;
  ramSize?: string;
  raw: string;
}

export interface SerialPortInfo {
  path: string;
  description?: string;
}

/**
 * Detect ST-Link probes using st-info.
 */
export async function detectStLink(): Promise<ProbeInfo> {
  try {
    const result = await $`st-info --probe 2>&1`.text();
    const found = result.includes("Found") && !result.includes("Found 0");
    const mcuMatch = result.match(/chip[- ]?id:\s*(0x[\da-fA-F]+)/i);
    const flashMatch = result.match(/flash:\s*(\d+)/i);
    const ramMatch = result.match(/sram:\s*(\d+)/i);

    return {
      found,
      mcu: mcuMatch?.[1],
      flashSize: flashMatch ? `${parseInt(flashMatch[1]) / 1024}K` : undefined,
      ramSize: ramMatch ? `${parseInt(ramMatch[1]) / 1024}K` : undefined,
      raw: result,
    };
  } catch (e) {
    return { found: false, raw: String(e) };
  }
}

/**
 * Enumerate serial ports matching common STM32 patterns.
 */
export async function enumerateSerialPorts(): Promise<SerialPortInfo[]> {
  const ports: SerialPortInfo[] = [];

  try {
    // Check /dev/ttyACM* (CDC ACM devices, common for ST-Link)
    const acmResult = await $`ls /dev/ttyACM* 2>/dev/null`.text();
    for (const line of acmResult.trim().split("\n").filter(Boolean)) {
      ports.push({ path: line.trim(), description: "CDC ACM (ST-Link)" });
    }
  } catch {
    // no ACM devices
  }

  try {
    // Check /dev/ttyUSB* (USB-Serial adapters)
    const usbResult = await $`ls /dev/ttyUSB* 2>/dev/null`.text();
    for (const line of usbResult.trim().split("\n").filter(Boolean)) {
      ports.push({ path: line.trim(), description: "USB-Serial" });
    }
  } catch {
    // no USB devices
  }

  return ports;
}

/**
 * Check if hardware prerequisites are met for a scenario.
 */
export async function checkHardwareReady(): Promise<{
  stlink: boolean;
  serial: boolean;
  details: string;
}> {
  const probe = await detectStLink();
  const ports = await enumerateSerialPorts();

  return {
    stlink: probe.found,
    serial: ports.length > 0,
    details: [
      `ST-Link: ${probe.found ? "detected" : "not found"}`,
      `Serial ports: ${ports.length > 0 ? ports.map((p) => p.path).join(", ") : "none"}`,
    ].join("\n"),
  };
}
