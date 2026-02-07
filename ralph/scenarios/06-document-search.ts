import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "06",
  name: "Document Search (Register Lookup)",
  phase: "rag-recall",
  prompt:
    "搜索 STM32G4 RCC 寄存器定义。找到 RCC_AHB2ENR 寄存器中使能 GPIOA 时钟的位。",
  requiresHardware: false,
  timeout: 180_000,
  allowedTools: ["Bash", "Read", "Glob", "Grep"],

  validate(result: ScenarioResult): ValidationResult {
    const allText = [
      ...result.toolCalls.map((tc) => tc.output),
      ...Object.values(result.artifacts),
    ]
      .join("\n")
      .toLowerCase();

    const checks = [
      {
        name: "finds_rcc_ahb2enr",
        pass:
          allText.includes("rcc_ahb2enr") || allText.includes("ahb2enr"),
        detail: "Must find RCC_AHB2ENR register",
      },
      {
        name: "identifies_gpioaen",
        pass:
          allText.includes("gpioaen") || allText.includes("gpioa_en"),
        detail: "Must identify GPIOAEN bit",
      },
      {
        name: "identifies_bit_0",
        pass:
          allText.includes("bit 0") ||
          allText.includes("bit0") ||
          allText.includes("[0]") ||
          allText.match(/bit\s*position.*0/) !== null,
        detail: "Must identify bit 0 for GPIOAEN",
      },
      {
        name: "register_offset",
        pass:
          allText.includes("0x4c") ||
          allText.includes("0x004c") ||
          allText.includes("offset 0x4c"),
        detail: "RCC_AHB2ENR register offset should be 0x4C",
      },
      {
        name: "uses_search_tools",
        pass: result.toolCalls.some(
          (tc) =>
            tc.toolName === "Grep" ||
            tc.toolName === "grep" ||
            tc.toolName === "Glob" ||
            tc.toolName === "glob" ||
            tc.toolName === "Read" ||
            tc.toolName === "readFile",
        ),
        detail: "Must use search/read tools to find documentation",
      },
    ];

    return {
      pass: checks.filter((c) => c.pass).length >= 3,
      checks,
    };
  },
};

export default scenario;
