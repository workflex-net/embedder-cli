import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "10",
  name: "Serial Monitor Verification",
  phase: "flash-verification",
  prompt:
    "在 /dev/ttyACM0 上以 115200 波特率启动串口监控。观察 10 秒输出并报告。",
  requiresHardware: true,
  dependsOn: ["09"],
  timeout: 180_000,
  allowedTools: ["Bash", "Read"],

  validate(result: ScenarioResult): ValidationResult {
    const allInput = result.toolCalls
      .map((tc) => JSON.stringify(tc.input))
      .join("\n")
      .toLowerCase();
    const allOutput = result.toolCalls
      .map((tc) => tc.output)
      .join("\n")
      .toLowerCase();

    const checks = [
      {
        name: "correct_port",
        pass: allInput.includes("/dev/ttyacm0"),
        detail: "Must use /dev/ttyACM0 port",
      },
      {
        name: "correct_baud",
        pass: allInput.includes("115200"),
        detail: "Must use 115200 baud rate",
      },
      {
        name: "uses_serial_tool",
        pass:
          allInput.includes("cat /dev/tty") ||
          allInput.includes("screen") ||
          allInput.includes("minicom") ||
          allInput.includes("picocom") ||
          allInput.includes("tio") ||
          allInput.includes("stty"),
        detail: "Must use a serial monitor tool (cat, screen, minicom, picocom, tio)",
      },
      {
        name: "has_timeout",
        pass:
          allInput.includes("timeout") ||
          allInput.includes("sleep") ||
          allInput.includes("10"),
        detail: "Must include a timeout mechanism",
      },
      {
        name: "captures_output",
        pass: result.toolCalls.length > 0,
        detail: "Must capture serial output",
      },
    ];

    return {
      pass: checks.filter((c) => c.pass).length >= 3,
      checks,
    };
  },
};

export default scenario;
