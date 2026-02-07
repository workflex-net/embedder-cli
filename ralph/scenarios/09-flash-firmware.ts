import type { ScenarioDefinition, ScenarioResult, ValidationResult } from "../lib/types";

const scenario: ScenarioDefinition = {
  id: "09",
  name: "Firmware Flash",
  phase: "flash-verification",
  prompt:
    "编译当前目录的固件项目，然后通过 ST-Link 烧录到 STM32G4。",
  requiresHardware: true,
  dependsOn: ["07", "08"],
  timeout: 180_000,
  allowedTools: ["Bash", "Read", "Glob"],

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
        name: "calls_make",
        pass:
          allInput.includes("make") && !allInput.includes("makefile"),
        detail: "Must invoke 'make' to compile",
      },
      {
        name: "calls_openocd_flash",
        pass:
          allInput.includes("openocd") &&
          (allInput.includes("program") || allInput.includes("flash")),
        detail: "Must invoke openocd to flash firmware",
      },
      {
        name: "includes_verify",
        pass:
          allInput.includes("verify") || allOutput.includes("verified"),
        detail: "Flash command should include verify step",
      },
      {
        name: "includes_reset",
        pass:
          allInput.includes("reset") || allOutput.includes("reset"),
        detail: "Flash command should include reset after flash",
      },
      {
        name: "build_succeeds",
        pass:
          !allOutput.includes("error:") ||
          allOutput.includes("programmed") ||
          allOutput.includes("verified"),
        detail: "Build and flash should succeed (no errors)",
      },
    ];

    return {
      pass: checks.filter((c) => c.pass).length >= 3,
      checks,
    };
  },
};

export default scenario;
