import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "08",
  name: "Build System Setup",
  phase: "code-implementation",
  prompt: `为 STM32G431KB 创建 Makefile。arm-none-eabi-gcc 交叉编译, 128K flash, 32K RAM。包含 build/flash/clean 目标。`,
  requiresHardware: false,
  timeout: 120_000,
  allowedTools: ["Bash", "Read", "Write", "Edit", "Glob"],

  validate(result: ScenarioResult): ValidationResult {
    const makefile = findArtifact(result, "Makefile") ?? findArtifact(result, "makefile");
    const content = (makefile ?? "").toLowerCase();

    const checks = [
      {
        name: "makefile_created",
        pass: !!makefile,
        detail: "Must create Makefile",
      },
      {
        name: "cross_compiler",
        pass: content.includes("arm-none-eabi-gcc"),
        detail: "Must use arm-none-eabi-gcc cross compiler",
      },
      {
        name: "cortex_m4_flag",
        pass: content.includes("-mcpu=cortex-m4"),
        detail: "Must include -mcpu=cortex-m4 flag",
      },
      {
        name: "thumb_flag",
        pass: content.includes("-mthumb"),
        detail: "Must include -mthumb flag",
      },
      {
        name: "fpu_flags",
        pass:
          content.includes("-mfloat-abi=hard") &&
          content.includes("-mfpu=fpv4-sp-d16"),
        detail: "Must include hard float FPU flags (-mfloat-abi=hard -mfpu=fpv4-sp-d16)",
      },
      {
        name: "build_target",
        pass:
          content.includes("build") || content.includes("all"),
        detail: "Must have build/all target",
      },
      {
        name: "flash_target",
        pass: content.includes("flash"),
        detail: "Must have flash target",
      },
      {
        name: "clean_target",
        pass: content.includes("clean"),
        detail: "Must have clean target",
      },
      {
        name: "flash_uses_openocd",
        pass:
          content.includes("openocd") &&
          content.includes("stlink") &&
          (content.includes("stm32g4") || content.includes("stm32g4x")),
        detail: "Flash target must use openocd with stlink + stm32g4x.cfg",
      },
      {
        name: "memory_layout",
        pass:
          content.includes("128k") ||
          content.includes("128 k") ||
          content.includes("0x08000000"),
        detail: "Must reference 128K flash memory",
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
    if (path.toLowerCase().includes(lower) || path.toLowerCase().endsWith(lower)) {
      return content;
    }
  }
  return undefined;
}

export default scenario;
