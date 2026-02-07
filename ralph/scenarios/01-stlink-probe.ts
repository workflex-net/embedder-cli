import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "01",
  name: "ST-Link Probe Detection",
  phase: "hardware-identification",
  prompt:
    "检测所有连接的调试探针。识别 MCU 型号、Flash 大小和 RAM 大小。",
  requiresHardware: true,
  timeout: 180_000,
  allowedTools: ["Bash", "Read"],

  validate(result: ScenarioResult): ValidationResult {
    const checks = [
      {
        name: "calls_st_probe",
        pass: result.toolCalls.some(
          (tc) =>
            tc.toolName === "Bash" &&
            (JSON.stringify(tc.input).includes("st-info") ||
              JSON.stringify(tc.input).includes("openocd")),
        ),
        detail: "Must invoke st-info --probe or openocd for probe detection",
      },
      {
        name: "detects_stm32g4",
        pass: result.toolCalls.some(
          (tc) =>
            tc.output.toLowerCase().includes("stm32g4") ||
            tc.output.toLowerCase().includes("stm32g431"),
        ),
        detail: "Must detect STM32G4 MCU family",
      },
      {
        name: "reports_flash_size",
        pass: result.toolCalls.some(
          (tc) =>
            tc.output.includes("128") || tc.output.toLowerCase().includes("flash"),
        ),
        detail: "Must report flash size",
      },
      {
        name: "reports_ram_size",
        pass: result.toolCalls.some(
          (tc) =>
            tc.output.includes("32") || tc.output.toLowerCase().includes("ram"),
        ),
        detail: "Must report RAM size",
      },
    ];

    return {
      pass: checks.every((c) => c.pass),
      checks,
    };
  },
};

export default scenario;
