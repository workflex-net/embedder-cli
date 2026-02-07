import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "05",
  name: "Hardware Catalog Query",
  phase: "rag-recall",
  prompt:
    "查询 STM32G4 芯片信息。列出支持的外设和 GPIO Port A 的引脚映射。",
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
        name: "identifies_cortex_m4",
        pass:
          allText.includes("cortex-m4") ||
          allText.includes("cortex m4") ||
          allText.includes("arm cortex"),
        detail: "Must identify Cortex-M4F core",
      },
      {
        name: "lists_gpio",
        pass: allText.includes("gpio"),
        detail: "Must list GPIO peripheral",
      },
      {
        name: "lists_usart",
        pass:
          allText.includes("usart") || allText.includes("uart"),
        detail: "Must list USART/UART peripheral",
      },
      {
        name: "lists_spi",
        pass: allText.includes("spi"),
        detail: "Must list SPI peripheral",
      },
      {
        name: "lists_i2c",
        pass: allText.includes("i2c"),
        detail: "Must list I2C peripheral",
      },
      {
        name: "lists_timer",
        pass:
          allText.includes("tim") || allText.includes("timer"),
        detail: "Must list Timer peripheral",
      },
      {
        name: "lists_adc",
        pass: allText.includes("adc"),
        detail: "Must list ADC peripheral",
      },
      {
        name: "identifies_pa5",
        pass:
          allText.includes("pa5") ||
          allText.includes("pa 5") ||
          allText.includes("pin 5"),
        detail: "Must identify PA5 in pin mapping",
      },
    ];

    return {
      pass: checks.filter((c) => c.pass).length >= 5,
      checks,
    };
  },
};

export default scenario;
