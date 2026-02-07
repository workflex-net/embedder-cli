import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "07",
  name: "GPIO Blink Driver Generation",
  phase: "code-implementation",
  prompt: `生成完整的 STM32G4 裸机 GPIO 闪烁驱动。PA5 LED, 1Hz。使用 CMSIS 寄存器访问（无 HAL）。包含 main.c, startup, linker script。`,
  requiresHardware: false,
  timeout: 180_000,
  allowedTools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep"],

  validate(result: ScenarioResult): ValidationResult {
    const mainC = findArtifact(result, "main.c");
    const linkerScript = findArtifact(result, ".ld");
    const startup = findArtifact(result, "startup");

    const mainContent = (mainC ?? "").toLowerCase();

    const checks = [
      {
        name: "main_c_created",
        pass: !!mainC,
        detail: "Must create main.c file",
      },
      {
        name: "rcc_gpioa_enable",
        pass:
          mainContent.includes("rcc->ahb2enr") ||
          mainContent.includes("rcc_ahb2enr_gpioaen"),
        detail: "main.c must enable GPIOA clock via RCC->AHB2ENR",
      },
      {
        name: "gpio_moder_config",
        pass:
          mainContent.includes("gpioa->moder") ||
          mainContent.includes("moder"),
        detail: "main.c must configure GPIOA->MODER for PA5 output",
      },
      {
        name: "toggle_logic",
        pass:
          mainContent.includes("odr") ||
          mainContent.includes("bsrr") ||
          mainContent.includes("toggle"),
        detail: "main.c must have toggle logic (ODR/BSRR)",
      },
      {
        name: "main_loop",
        pass: mainContent.includes("while") || mainContent.includes("for"),
        detail: "main.c must have while(1) main loop",
      },
      {
        name: "linker_script_created",
        pass: !!linkerScript,
        detail: "Must create linker script (.ld)",
      },
      {
        name: "flash_origin",
        pass: (linkerScript ?? "").includes("0x08000000"),
        detail: "Linker script must have Flash @ 0x08000000",
      },
      {
        name: "ram_origin",
        pass: (linkerScript ?? "").includes("0x20000000"),
        detail: "Linker script must have RAM @ 0x20000000",
      },
      {
        name: "startup_created",
        pass: !!startup,
        detail: "Must create startup file (vector table)",
      },
      {
        name: "vector_table",
        pass:
          (startup ?? "").toLowerCase().includes("vector") ||
          (startup ?? "").toLowerCase().includes("isr") ||
          (startup ?? "").toLowerCase().includes("reset_handler"),
        detail: "Startup must define vector table / Reset_Handler",
      },
    ];

    return {
      pass: checks.filter((c) => c.pass).length >= 7,
      checks,
    };
  },
};

function findArtifact(result: ScenarioResult, pattern: string): string | undefined {
  const lower = pattern.toLowerCase();
  for (const [path, content] of Object.entries(result.artifacts)) {
    if (path.toLowerCase().includes(lower)) {
      return content;
    }
  }
  return undefined;
}

export default scenario;
