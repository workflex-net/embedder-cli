import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { runDualAgents } from "./agent";
import { captureWorkspaceFiles } from "./capture";
import { compareResults } from "./comparator";
import type {
  ScenarioDefinition,
  ScenarioResult,
  RunResult,
  ValidationResult,
} from "./types";
import { config } from "../ralph.config";

/**
 * Execute a single scenario: setup workspaces, run both agents, compare, validate.
 */
export async function executeScenario(
  scenario: ScenarioDefinition,
  opts?: { continueOnFailure?: boolean },
): Promise<RunResult> {
  // Create isolated temp workspaces
  const oursDir = await mkdtemp(join(tmpdir(), `ralph-ours-${scenario.id}-`));
  const theirsDir = await mkdtemp(join(tmpdir(), `ralph-theirs-${scenario.id}-`));

  console.log(`[${scenario.id}] ${scenario.name}`);
  console.log(`  Phase: ${scenario.phase}`);
  console.log(`  Workspace (ours):   ${oursDir}`);
  console.log(`  Workspace (theirs): ${theirsDir}`);

  try {
    // Run both agents in parallel
    console.log(`  Running dual agents...`);
    const { ours, theirs } = await runDualAgents(
      scenario.prompt,
      { ours: oursDir, theirs: theirsDir },
      scenario.allowedTools,
      { maxTurns: config.maxTurns, timeout: scenario.timeout },
    );

    // Set scenario IDs
    ours.scenarioId = scenario.id;
    theirs.scenarioId = scenario.id;

    // Capture any files written to the workspace (not just from Write tool)
    const oursFiles = await captureWorkspaceFiles(oursDir);
    const theirsFiles = await captureWorkspaceFiles(theirsDir);

    // Merge workspace files into artifacts
    Object.assign(ours.artifacts, oursFiles);
    Object.assign(theirs.artifacts, theirsFiles);

    // Structural comparison
    console.log(`  Comparing results...`);
    const comparison = compareResults(ours, theirs);

    // Validation
    console.log(`  Validating...`);
    const validation = scenario.validate(ours);

    const result: RunResult = {
      scenarioId: scenario.id,
      ours,
      theirs,
      comparison,
      validation,
    };

    const status = comparison.pass && validation.pass ? "PASS" : "FAIL";
    console.log(`  Result: ${status} (similarity: ${(comparison.similarity * 100).toFixed(1)}%)`);

    if (!comparison.pass || !validation.pass) {
      if (comparison.behaviorNotes.length > 0) {
        console.log(`  Behavior notes:`);
        for (const note of comparison.behaviorNotes) {
          console.log(`    - ${note}`);
        }
      }
      if (!validation.pass) {
        const failed = validation.checks.filter((c) => !c.pass);
        console.log(`  Failed checks:`);
        for (const check of failed) {
          console.log(`    - ${check.name}: ${check.detail}`);
        }
      }
    }

    return result;
  } finally {
    // Cleanup temp directories
    try {
      await rm(oursDir, { recursive: true, force: true });
      await rm(theirsDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }
}

/**
 * Execute multiple scenarios in dependency order.
 */
export async function executeScenarios(
  scenarios: ScenarioDefinition[],
  opts?: {
    continueOnFailure?: boolean;
    skipHardware?: boolean;
  },
): Promise<RunResult[]> {
  const results: RunResult[] = [];
  const completed = new Set<string>();
  const failed = new Set<string>();

  // Filter scenarios based on hardware availability
  const filtered = opts?.skipHardware
    ? scenarios.filter((s) => !s.requiresHardware)
    : scenarios;

  for (const scenario of filtered) {
    // Check dependencies
    if (scenario.dependsOn) {
      const unmet = scenario.dependsOn.filter(
        (dep) => !completed.has(dep) || failed.has(dep),
      );
      if (unmet.length > 0) {
        console.log(
          `[${scenario.id}] SKIP: unmet dependencies: ${unmet.join(", ")}`,
        );
        continue;
      }
    }

    try {
      const result = await executeScenario(scenario, opts);
      results.push(result);

      if (result.comparison.pass && result.validation.pass) {
        completed.add(scenario.id);
      } else {
        failed.add(scenario.id);
        if (!opts?.continueOnFailure) {
          console.log(`\nStopping: scenario ${scenario.id} failed.`);
          break;
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`[${scenario.id}] ERROR: ${error}`);

      // Create a synthetic failed result so the loop can track it
      const emptyResult: ScenarioResult = {
        scenarioId: scenario.id,
        source: "ours",
        success: false,
        duration: 0,
        toolCalls: [],
        artifacts: {},
        errors: [error],
      };
      results.push({
        scenarioId: scenario.id,
        ours: emptyResult,
        theirs: { ...emptyResult, source: "theirs" },
        comparison: {
          scenarioId: scenario.id,
          similarity: 0,
          toolSetMatch: false,
          artifactDiffs: [],
          behaviorNotes: [`Scenario crashed: ${error}`],
          pass: false,
        },
        validation: {
          pass: false,
          checks: [{ name: "execution", pass: false, detail: error }],
        },
      });

      failed.add(scenario.id);
      if (!opts?.continueOnFailure) {
        break;
      }
    }

    console.log(""); // blank line between scenarios
  }

  return results;
}
