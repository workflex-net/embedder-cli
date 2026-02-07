import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "04",
  name: "Task Decomposition",
  phase: "requirement-decomposition",
  prompt:
    "在 STM32G4 上使用裸机寄存器操作实现 PA5 LED 1Hz 闪烁。分解为子任务列表。",
  requiresHardware: false,
  timeout: 180_000,
  allowedTools: ["Bash", "Read", "Write"],

  validate(result: ScenarioResult): ValidationResult {
    // Collect all text output from tool calls and artifacts
    const allText = [
      ...result.toolCalls.map((tc) => tc.output),
      ...Object.values(result.artifacts),
    ]
      .join("\n")
      .toLowerCase();

    const checks = [
      {
        name: "produces_task_list",
        pass:
          result.toolCalls.some((tc) => tc.toolName === "Write") ||
          allText.includes("task") ||
          allText.includes("step") ||
          allText.includes("todo"),
        detail: "Must produce a task/step list",
      },
      {
        name: "covers_rcc_clock",
        pass:
          allText.includes("rcc") ||
          allText.includes("clock") ||
          allText.includes("时钟"),
        detail: "Must cover RCC clock configuration",
      },
      {
        name: "covers_gpio_enable",
        pass:
          allText.includes("gpio") ||
          allText.includes("gpioa"),
        detail: "Must cover GPIO enable/configuration",
      },
      {
        name: "covers_pa5_output",
        pass:
          allText.includes("pa5") ||
          allText.includes("pin 5") ||
          allText.includes("moder"),
        detail: "Must cover PA5 output mode configuration",
      },
      {
        name: "covers_delay",
        pass:
          allText.includes("delay") ||
          allText.includes("timer") ||
          allText.includes("定时") ||
          allText.includes("延时") ||
          allText.includes("systick"),
        detail: "Must cover delay/timer mechanism",
      },
      {
        name: "covers_main_loop",
        pass:
          allText.includes("loop") ||
          allText.includes("while") ||
          allText.includes("主循环") ||
          allText.includes("toggle"),
        detail: "Must cover main loop / toggle logic",
      },
      {
        name: "task_count_reasonable",
        pass: (() => {
          // Count numbered items or bullet points
          const numberedItems = allText.match(/(?:^|\n)\s*\d+[\.\)]/g)?.length ?? 0;
          const bulletItems = allText.match(/(?:^|\n)\s*[-*•]/g)?.length ?? 0;
          const total = Math.max(numberedItems, bulletItems);
          return total >= 4 && total <= 15;
        })(),
        detail: "Should produce 4-15 subtasks",
      },
    ];

    return {
      pass: checks.filter((c) => c.pass).length >= 5,
      checks,
    };
  },
};

export default scenario;
