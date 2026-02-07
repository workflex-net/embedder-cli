import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "03",
  name: "EMBEDDER.md Project Initialization",
  phase: "requirement-decomposition",
  prompt: `为 STM32G4 裸机项目创建 EMBEDDER.md。MCU: STM32G431KB, 工具链: arm-none-eabi-gcc, 调试接口: ST-Link, 串口: /dev/ttyACM0, 波特率: 115200, 项目名: blink-test`,
  requiresHardware: false,
  timeout: 120_000,
  allowedTools: ["Bash", "Read", "Write", "Glob", "Grep"],

  validate(result: ScenarioResult): ValidationResult {
    // Find EMBEDDER.md in artifacts
    const embedderMd = findArtifact(result, "EMBEDDER.md");
    const content = embedderMd?.toLowerCase() ?? "";

    const checks = [
      {
        name: "file_created",
        pass: !!embedderMd,
        detail: "Must create EMBEDDER.md file",
      },
      {
        name: "has_overview_section",
        pass: content.includes("<overview>"),
        detail: "Must contain <OVERVIEW> section",
      },
      {
        name: "has_commands_section",
        pass: content.includes("<commands>"),
        detail: "Must contain <COMMANDS> section",
      },
      {
        name: "target_mcu",
        pass:
          content.includes("stm32g4") || content.includes("stm32g431"),
        detail: "Target MCU must be STM32G4/STM32G431KB",
      },
      {
        name: "debug_interface",
        pass: content.includes("st-link") || content.includes("stlink"),
        detail: "Debug Interface must reference ST-Link",
      },
      {
        name: "flash_command_openocd",
        pass:
          content.includes("openocd") &&
          (content.includes("stm32g4") || content.includes("stm32g4x")),
        detail: "flash_command must reference openocd + stm32g4x.cfg",
      },
      {
        name: "serial_port",
        pass: content.includes("/dev/ttyacm0"),
        detail: "Must include serial port /dev/ttyACM0",
      },
      {
        name: "baud_rate",
        pass: content.includes("115200"),
        detail: "Must include baud rate 115200",
      },
      {
        name: "toolchain",
        pass: content.includes("arm-none-eabi"),
        detail: "Must reference arm-none-eabi toolchain",
      },
    ];

    return {
      pass: checks.every((c) => c.pass),
      checks,
    };
  },
};

function findArtifact(result: ScenarioResult, filename: string): string | undefined {
  for (const [path, content] of Object.entries(result.artifacts)) {
    if (path.endsWith(filename) || path.includes(filename)) {
      return content;
    }
  }
  return undefined;
}

export default scenario;
