import { mkdir, writeFile, symlink, unlink, readlink } from "fs/promises";
import { join } from "path";
import { config } from "../ralph.config";
import type { RunResult, SummaryReport, ComparisonResult } from "./types";

/**
 * Save all results to the results/ directory and generate a summary report.
 */
export async function saveResults(results: RunResult[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(config.resultsDir, timestamp);

  // Create run directory
  await mkdir(runDir, { recursive: true });

  // Save individual scenario results
  for (const result of results) {
    const scenarioDir = join(runDir, `scenario-${result.scenarioId}`);
    await mkdir(scenarioDir, { recursive: true });

    // Save raw results
    await writeFile(
      join(scenarioDir, "ours.json"),
      JSON.stringify(result.ours, null, 2),
    );
    await writeFile(
      join(scenarioDir, "theirs.json"),
      JSON.stringify(result.theirs, null, 2),
    );
    await writeFile(
      join(scenarioDir, "diff.json"),
      JSON.stringify(result.comparison, null, 2),
    );
    await writeFile(
      join(scenarioDir, "validation.json"),
      JSON.stringify(result.validation, null, 2),
    );
  }

  // Generate summary
  const summary = generateSummary(results, timestamp);
  await writeFile(join(runDir, "summary.json"), JSON.stringify(summary, null, 2));

  // Generate markdown report
  const markdown = generateMarkdownReport(summary);
  await writeFile(join(runDir, "summary.md"), markdown);

  // Update "latest" symlink
  const latestLink = join(config.resultsDir, "latest");
  try {
    await unlink(latestLink);
  } catch {
    // didn't exist
  }
  try {
    await symlink(timestamp, latestLink);
  } catch {
    // symlink failed, not critical
  }

  console.log(`\nResults saved to: ${runDir}`);
  console.log(`Summary: ${join(runDir, "summary.md")}`);

  return runDir;
}

function generateSummary(results: RunResult[], timestamp: string): SummaryReport {
  const passed = results.filter(
    (r) => r.comparison.pass && r.validation.pass,
  ).length;
  const failed = results.filter(
    (r) => !r.comparison.pass || !r.validation.pass,
  ).length;

  const similarities = results.map((r) => r.comparison.similarity);
  const avgSimilarity =
    similarities.length > 0
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length
      : 0;

  return {
    timestamp,
    totalScenarios: results.length,
    passed,
    failed,
    skipped: 0,
    averageSimilarity: avgSimilarity,
    results,
  };
}

function generateMarkdownReport(summary: SummaryReport): string {
  const lines: string[] = [];

  lines.push("# Ralph Loop — Alignment Report");
  lines.push("");
  lines.push(`**Date**: ${summary.timestamp}`);
  lines.push(`**Total**: ${summary.totalScenarios} scenarios`);
  lines.push(`**Passed**: ${summary.passed}`);
  lines.push(`**Failed**: ${summary.failed}`);
  lines.push(`**Average Similarity**: ${(summary.averageSimilarity * 100).toFixed(1)}%`);
  lines.push("");

  lines.push("## Results");
  lines.push("");
  lines.push("| # | Scenario | Phase | Similarity | Tool Match | Validation | Status |");
  lines.push("|---|----------|-------|-----------|------------|------------|--------|");

  for (const result of summary.results) {
    const status = result.comparison.pass && result.validation.pass ? "PASS" : "FAIL";
    const sim = (result.comparison.similarity * 100).toFixed(1) + "%";
    const toolMatch = result.comparison.toolSetMatch ? "yes" : "NO";
    const valPass = result.validation.pass ? "yes" : "NO";
    const phase = getPhaseFromId(result.scenarioId);

    lines.push(
      `| ${result.scenarioId} | ${getScenarioName(result.scenarioId)} | ${phase} | ${sim} | ${toolMatch} | ${valPass} | **${status}** |`,
    );
  }

  lines.push("");

  // Detail sections for failures
  const failures = summary.results.filter(
    (r) => !r.comparison.pass || !r.validation.pass,
  );

  if (failures.length > 0) {
    lines.push("## Failures Detail");
    lines.push("");

    for (const result of failures) {
      lines.push(`### Scenario ${result.scenarioId}: ${getScenarioName(result.scenarioId)}`);
      lines.push("");

      if (result.comparison.behaviorNotes.length > 0) {
        lines.push("**Behavior Notes**:");
        for (const note of result.comparison.behaviorNotes) {
          lines.push(`- ${note}`);
        }
        lines.push("");
      }

      if (result.comparison.artifactDiffs.length > 0) {
        const nonIdentical = result.comparison.artifactDiffs.filter(
          (d) => d.type !== "identical",
        );
        if (nonIdentical.length > 0) {
          lines.push("**Artifact Diffs**:");
          for (const diff of nonIdentical) {
            lines.push(`- \`${diff.path}\`: ${diff.type}`);
            if (diff.structuralDiffs) {
              for (const sd of diff.structuralDiffs) {
                lines.push(`  - ${sd.field}: ours=\`${sd.ours}\` theirs=\`${sd.theirs}\``);
              }
            }
          }
          lines.push("");
        }
      }

      const failedChecks = result.validation.checks.filter((c) => !c.pass);
      if (failedChecks.length > 0) {
        lines.push("**Failed Validation Checks**:");
        for (const check of failedChecks) {
          lines.push(`- ${check.name}: ${check.detail}`);
        }
        lines.push("");
      }
    }
  }

  lines.push("---");
  lines.push("*Generated by Ralph Loop*");

  return lines.join("\n");
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

function getPhaseFromId(id: string): string {
  const num = parseInt(id);
  if (num <= 2) return "hardware-id";
  if (num <= 4) return "req-decomp";
  if (num <= 6) return "rag-recall";
  if (num <= 8) return "code-impl";
  return "flash-verify";
}
