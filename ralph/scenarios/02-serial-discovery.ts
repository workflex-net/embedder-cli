import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "02",
  name: "Serial Port Discovery",
  phase: "hardware-identification",
  prompt:
    "枚举所有可用串口。找到连接 STM32G4 开发板的串口并检测波特率。",
  requiresHardware: true,
  timeout: 180_000,
  allowedTools: ["Bash", "Read"],

  validate(result: ScenarioResult): ValidationResult {
    const allOutput = result.toolCalls.map((tc) => tc.output).join("\n");
    const allInput = result.toolCalls
      .map((tc) => JSON.stringify(tc.input))
      .join("\n");

    const checks = [
      {
        name: "lists_serial_ports",
        pass:
          allInput.includes("/dev/tty") ||
          allInput.includes("ls /dev") ||
          allInput.includes("dmesg"),
        detail: "Must enumerate serial ports via /dev/tty* or dmesg",
      },
      {
        name: "finds_ttyACM",
        pass: allOutput.includes("ttyACM") || allInput.includes("ttyACM"),
        detail: "Must find /dev/ttyACM* ports",
      },
      {
        name: "detects_baudrate",
        pass:
          allOutput.includes("115200") || allInput.includes("115200"),
        detail: "Must detect or report 115200 baud rate",
      },
    ];

    return {
      pass: checks.every((c) => c.pass),
      checks,
    };
  },
};

export default scenario;
