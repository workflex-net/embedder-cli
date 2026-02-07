#!/usr/bin/env bun

import { parseArgs } from "util";
import type { ScenarioDefinition, RunResult } from "./lib/types";
import { executeScenarios } from "./lib/harness";
import { saveResults } from "./lib/reporter";
import { checkHardwareReady } from "./lib/hardware";
import { config } from "./ralph.config";

// Import all scenarios
import scenario01 from "./scenarios/01-stlink-probe";
import scenario02 from "./scenarios/02-serial-discovery";
import scenario03 from "./scenarios/03-embedder-md-init";
import scenario04 from "./scenarios/04-task-decomposition";
import scenario05 from "./scenarios/05-catalog-query";
import scenario06 from "./scenarios/06-document-search";
import scenario07 from "./scenarios/07-gpio-driver-gen";
import scenario08 from "./scenarios/08-build-system";
import scenario09 from "./scenarios/09-flash-firmware";
import scenario10 from "./scenarios/10-serial-verify";

const ALL_SCENARIOS: ScenarioDefinition[] = [
  scenario01,
  scenario02,
  scenario03,
  scenario04,
  scenario05,
  scenario06,
  scenario07,
  scenario08,
  scenario09,
  scenario10,
];

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      scenario: { type: "string", short: "s" },
      phase: { type: "string", short: "p" },
      "no-hardware": { type: "boolean" },
      "continue-on-failure": { type: "boolean", short: "c" },
      "dry-run": { type: "boolean" },
      "max-iterations": { type: "string", short: "i", default: "10" },
      "single-pass": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  console.log("=== Ralph Loop — Embedder CLI Alignment Verification ===\n");

  // Filter scenarios
  let scenarios = [...ALL_SCENARIOS];

  if (values.scenario) {
    const id = values.scenario.padStart(2, "0");
    scenarios = scenarios.filter((s) => s.id === id);
    if (scenarios.length === 0) {
      console.error(`Scenario ${id} not found`);
      process.exit(1);
    }
  }

  if (values.phase) {
    scenarios = scenarios.filter((s) => s.phase === values.phase);
    if (scenarios.length === 0) {
      console.error(`No scenarios match phase: ${values.phase}`);
      process.exit(1);
    }
  }

  const skipHardware = values["no-hardware"] ?? false;
  const continueOnFailure = values["continue-on-failure"] ?? true; // default true in loop mode
  const maxIterations = parseInt(values["max-iterations"] ?? "10", 10);
  const singlePass = values["single-pass"] ?? false;

  // Print run configuration
  console.log(`Model: ${config.model}`);
  console.log(`Max turns per scenario: ${config.maxTurns}`);
  console.log(`Skip hardware: ${skipHardware}`);
  console.log(`Mode: ${singlePass ? "single pass" : `loop (max ${maxIterations} iterations)`}`);

  // Check hardware if needed
  const needsHardware = scenarios.some((s) => s.requiresHardware) && !skipHardware;
  if (needsHardware) {
    console.log("\nChecking hardware...");
    const hw = await checkHardwareReady();
    console.log(hw.details);
    if (!hw.stlink) {
      console.log("\nWARNING: ST-Link not detected. Hardware scenarios may fail.");
    }
  }

  // Apply hardware filter
  const activeScenarios = skipHardware
    ? scenarios.filter((s) => !s.requiresHardware)
    : scenarios;

  console.log(`\nScenarios to run: ${activeScenarios.length}\n`);

  // Dry run mode
  if (values["dry-run"]) {
    console.log("DRY RUN — listing scenarios:\n");
    for (const s of scenarios) {
      if (skipHardware && s.requiresHardware) {
        console.log(`  [SKIP] ${s.id}: ${s.name} (requires hardware)`);
      } else {
        console.log(`  [RUN]  ${s.id}: ${s.name} (${s.phase})`);
      }
    }
    process.exit(0);
  }

  if (singlePass) {
    // Single pass mode — run once, report, exit
    const results = await executeScenarios(activeScenarios, {
      continueOnFailure,
      skipHardware,
    });

    if (results.length > 0) {
      await saveResults(results);
    }
    printSummary(results);
    const failed = results.filter((r) => !r.comparison.pass || !r.validation.pass).length;
    process.exit(failed > 0 ? 1 : 0);
  }

  // === LOOP MODE ===
  const passedScenarioIds = new Set<string>();
  let allResults: RunResult[] = [];
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    const remaining = activeScenarios.filter((s) => !passedScenarioIds.has(s.id));

    if (remaining.length === 0) {
      console.log("\n✓ All scenarios passed!");
      break;
    }

    console.log(
      `\n${"=".repeat(60)}\n` +
        `ITERATION ${iteration}/${maxIterations} — ${remaining.length} scenario(s) remaining\n` +
        `${"=".repeat(60)}\n`,
    );

    const results = await executeScenarios(remaining, {
      continueOnFailure: true,
      skipHardware,
    });

    // Track which passed this round
    const newPassed: string[] = [];
    const newFailed: string[] = [];

    for (const result of results) {
      if (result.comparison.pass && result.validation.pass) {
        passedScenarioIds.add(result.scenarioId);
        newPassed.push(result.scenarioId);
      } else {
        newFailed.push(result.scenarioId);
      }
    }

    allResults = [
      // Keep latest result per scenario
      ...allResults.filter(
        (r) => !results.some((nr) => nr.scenarioId === r.scenarioId),
      ),
      ...results,
    ];

    // Save intermediate results
    if (results.length > 0) {
      await saveResults(allResults);
    }

    // Print iteration summary
    console.log(`\n--- Iteration ${iteration} Summary ---`);
    console.log(`  Newly passed: ${newPassed.length > 0 ? newPassed.join(", ") : "none"}`);
    console.log(`  Still failing: ${newFailed.length > 0 ? newFailed.join(", ") : "none"}`);
    console.log(
      `  Overall: ${passedScenarioIds.size}/${activeScenarios.length} passed`,
    );

    if (newFailed.length === 0) {
      console.log("\n✓ All scenarios passed!");
      break;
    }

    // Print diagnostic info for failures
    console.log("\n--- Failure Analysis ---");
    for (const result of results) {
      if (result.comparison.pass && result.validation.pass) continue;

      console.log(`\n  [${result.scenarioId}] ${getScenarioName(result.scenarioId)}`);
      console.log(`    Similarity: ${(result.comparison.similarity * 100).toFixed(1)}%`);
      console.log(`    Tool calls (ours): ${result.ours.toolCalls.length}`);
      console.log(`    Tool calls (theirs): ${result.theirs.toolCalls.length}`);

      if (result.ours.errors.length > 0) {
        console.log(`    Errors (ours): ${result.ours.errors.slice(0, 3).join("; ")}`);
      }
      if (result.theirs.errors.length > 0) {
        console.log(`    Errors (theirs): ${result.theirs.errors.slice(0, 3).join("; ")}`);
      }

      const failedChecks = result.validation.checks.filter((c) => !c.pass);
      if (failedChecks.length > 0) {
        console.log(`    Failed checks:`);
        for (const check of failedChecks.slice(0, 5)) {
          console.log(`      - ${check.name}: ${check.detail}`);
        }
      }

      if (result.comparison.behaviorNotes.length > 0) {
        console.log(`    Notes:`);
        for (const note of result.comparison.behaviorNotes) {
          console.log(`      - ${note}`);
        }
      }
    }

    // Check if we're making progress
    if (iteration >= 2) {
      const prevPassCount = passedScenarioIds.size - newPassed.length;
      if (newPassed.length === 0 && prevPassCount === passedScenarioIds.size) {
        console.log(
          `\nWARNING: No progress in last iteration. Consider reviewing the diff files in results/latest/`,
        );
      }
    }

    if (iteration < maxIterations) {
      console.log(`\nRetrying failed scenarios in next iteration...`);
    }
  }

  // Final summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("FINAL RESULTS");
  console.log(`${"=".repeat(60)}\n`);
  printSummary(allResults);

  const totalFailed = activeScenarios.length - passedScenarioIds.size;
  if (totalFailed > 0) {
    console.log(
      `\n${totalFailed} scenario(s) still failing after ${iteration} iteration(s).`,
    );
    console.log(
      `Review: ralph/results/latest/scenario-XX/diff.json for alignment gaps.`,
    );
  }

  process.exit(totalFailed > 0 ? 1 : 0);
}

function printSummary(results: RunResult[]) {
  console.log("=== Summary ===\n");
  const passed = results.filter(
    (r) => r.comparison.pass && r.validation.pass,
  ).length;
  const failed = results.length - passed;

  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (results.length > 0) {
    const avgSim =
      results.reduce((sum, r) => sum + r.comparison.similarity, 0) /
      results.length;
    console.log(`Average similarity: ${(avgSim * 100).toFixed(1)}%`);
  }

  // Table
  console.log(
    "\n| # | Scenario | Similarity | Ours Tools | Theirs Tools | Status |",
  );
  console.log(
    "|---|----------|-----------|------------|--------------|--------|",
  );
  for (const r of results) {
    const status =
      r.comparison.pass && r.validation.pass ? "PASS" : "FAIL";
    const sim = (r.comparison.similarity * 100).toFixed(1) + "%";
    console.log(
      `| ${r.scenarioId} | ${getScenarioName(r.scenarioId).padEnd(20)} | ${sim.padStart(6)} | ${String(r.ours.toolCalls.length).padStart(10)} | ${String(r.theirs.toolCalls.length).padStart(12)} | ${status.padStart(6)} |`,
    );
  }
}

function getScenarioName(id: string): string {
  const names: Record<string, string> = {
    "01": "ST-Link Probe",
    "02": "Serial Discovery",
    "03": "EMBEDDER.md Init",
    "04": "Task Decomposition",
    "05": "Catalog Query",
    "06": "Document Search",
    "07": "GPIO Driver Gen",
    "08": "Build System",
    "09": "Flash Firmware",
    "10": "Serial Verify",
  };
  return names[id] ?? `Scenario ${id}`;
}

function printHelp() {
  console.log(`
Ralph Loop — Embedder CLI Alignment Verification

Usage: bun run runner.ts [options]

Options:
  -s, --scenario <id>       Run a specific scenario (01-10)
  -p, --phase <phase>       Run scenarios for a specific phase
  --no-hardware             Skip scenarios requiring hardware
  -c, --continue-on-failure Continue after failures (default: true in loop mode)
  -i, --max-iterations <n>  Maximum loop iterations (default: 10)
  --single-pass             Run once without looping
  --dry-run                 List scenarios without running
  -h, --help                Show this help

Phases:
  hardware-identification   Scenarios 01-02
  requirement-decomposition Scenarios 03-04
  rag-recall                Scenarios 05-06
  code-implementation       Scenarios 07-08
  flash-verification        Scenarios 09-10

Examples:
  bun run runner.ts --no-hardware          # Loop until all software scenarios pass
  bun run runner.ts --max-iterations 5     # Loop max 5 times
  bun run runner.ts --single-pass          # Run once (old behavior)
  bun run runner.ts --scenario 03          # Loop on scenario 03 until it passes
  bun run runner.ts --dry-run              # Preview what would run
`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
