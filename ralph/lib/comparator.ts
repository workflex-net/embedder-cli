import type {
  ScenarioResult,
  ComparisonResult,
  ArtifactDiff,
  StructuralDiff,
} from "./types";

/**
 * Compare two scenario results and produce a structured diff.
 */
export function compareResults(
  ours: ScenarioResult,
  theirs: ScenarioResult,
): ComparisonResult {
  const toolSetMatch = compareToolSets(ours, theirs);
  const artifactDiffs = compareArtifacts(ours.artifacts, theirs.artifacts);
  const behaviorNotes = analyzeBehavior(ours, theirs);

  const similarity = computeSimilarity(toolSetMatch, artifactDiffs, ours, theirs);

  return {
    scenarioId: ours.scenarioId,
    similarity,
    toolSetMatch,
    artifactDiffs,
    behaviorNotes,
    pass: similarity >= 0.7 && toolSetMatch,
  };
}

/**
 * Compare the sets of tools used by both runners.
 */
function compareToolSets(ours: ScenarioResult, theirs: ScenarioResult): boolean {
  const oursSet = new Set(ours.toolCalls.map((tc) => normalizeToolName(tc.toolName)));
  const theirsSet = new Set(theirs.toolCalls.map((tc) => normalizeToolName(tc.toolName)));

  // Check if the same core tools were used (ignoring Read which is very common)
  const oursCore = filterCoreTools(oursSet);
  const theirsCore = filterCoreTools(theirsSet);

  if (oursCore.size !== theirsCore.size) return false;
  for (const tool of oursCore) {
    if (!theirsCore.has(tool)) return false;
  }
  return true;
}

/**
 * Normalize tool names across SDK built-in and embedder tool names.
 */
function normalizeToolName(name: string): string {
  const mapping: Record<string, string> = {
    readFile: "Read",
    Read: "Read",
    writeFile: "Write",
    Write: "Write",
    editFile: "Edit",
    Edit: "Edit",
    listDirectory: "Bash",
    Bash: "Bash",
    grep: "Grep",
    Grep: "Grep",
    glob: "Glob",
    Glob: "Glob",
  };
  return mapping[name] ?? name;
}

/**
 * Filter to only structurally significant tools (not just Read/Grep).
 */
function filterCoreTools(tools: Set<string>): Set<string> {
  const core = new Set<string>();
  for (const tool of tools) {
    // Keep Write, Edit, Bash as core action tools
    if (["Write", "Edit", "Bash"].includes(tool)) {
      core.add(tool);
    }
  }
  return core;
}

/**
 * Compare file artifacts produced by both runners.
 */
function compareArtifacts(
  ours: Record<string, string>,
  theirs: Record<string, string>,
): ArtifactDiff[] {
  const diffs: ArtifactDiff[] = [];
  const allPaths = new Set([...Object.keys(ours), ...Object.keys(theirs)]);

  for (const path of allPaths) {
    const oursContent = ours[path];
    const theirsContent = theirs[path];

    if (!oursContent && theirsContent) {
      diffs.push({ path, type: "removed", theirsContent });
    } else if (oursContent && !theirsContent) {
      diffs.push({ path, type: "added", oursContent });
    } else if (oursContent && theirsContent) {
      if (oursContent === theirsContent) {
        diffs.push({ path, type: "identical" });
      } else {
        const structuralDiffs = computeStructuralDiffs(path, oursContent, theirsContent);
        diffs.push({
          path,
          type: "modified",
          oursContent,
          theirsContent,
          structuralDiffs,
        });
      }
    }
  }

  return diffs;
}

/**
 * Compute structural diffs based on file type.
 */
function computeStructuralDiffs(
  path: string,
  ours: string,
  theirs: string,
): StructuralDiff[] {
  const ext = path.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "md":
      return diffEmbedderMd(ours, theirs);
    case "c":
    case "h":
      return diffCSource(ours, theirs);
    case "makefile":
    case "mk":
      return diffMakefile(ours, theirs);
    default:
      if (path.toLowerCase().includes("makefile")) {
        return diffMakefile(ours, theirs);
      }
      return diffGeneric(ours, theirs);
  }
}

/**
 * Parse EMBEDDER.md into key-value pairs and compare.
 */
function diffEmbedderMd(ours: string, theirs: string): StructuralDiff[] {
  const parseKV = (content: string): Record<string, string> => {
    const kv: Record<string, string> = {};
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_ ]*?)\s*=\s*(.+)$/);
      if (match) {
        kv[match[1].trim()] = match[2].trim();
      }
    }
    return kv;
  };

  const oursKV = parseKV(ours);
  const theirsKV = parseKV(theirs);
  const allKeys = new Set([...Object.keys(oursKV), ...Object.keys(theirsKV)]);
  const diffs: StructuralDiff[] = [];

  for (const key of allKeys) {
    if (oursKV[key] !== theirsKV[key]) {
      diffs.push({ field: key, ours: oursKV[key], theirs: theirsKV[key] });
    }
  }

  // Check for section presence
  const sections = ["<OVERVIEW>", "<COMMANDS>", "</OVERVIEW>", "</COMMANDS>"];
  for (const section of sections) {
    const oursHas = ours.includes(section);
    const theirsHas = theirs.includes(section);
    if (oursHas !== theirsHas) {
      diffs.push({
        field: `section:${section}`,
        ours: oursHas ? "present" : "absent",
        theirs: theirsHas ? "present" : "absent",
      });
    }
  }

  return diffs;
}

/**
 * Compare C source files structurally (functions, includes, registers).
 */
function diffCSource(ours: string, theirs: string): StructuralDiff[] {
  const diffs: StructuralDiff[] = [];

  // Compare #include directives
  const extractIncludes = (s: string) =>
    [...s.matchAll(/#include\s*[<"]([^>"]+)[>"]/g)].map((m) => m[1]).sort();
  const oursIncludes = extractIncludes(ours);
  const theirsIncludes = extractIncludes(theirs);
  if (JSON.stringify(oursIncludes) !== JSON.stringify(theirsIncludes)) {
    diffs.push({
      field: "includes",
      ours: oursIncludes.join(", "),
      theirs: theirsIncludes.join(", "),
    });
  }

  // Compare function signatures
  const extractFunctions = (s: string) =>
    [...s.matchAll(/^\s*(?:void|int|uint\w+|char|static\s+\w+)\s+(\w+)\s*\(/gm)]
      .map((m) => m[1])
      .sort();
  const oursFns = extractFunctions(ours);
  const theirsFns = extractFunctions(theirs);
  if (JSON.stringify(oursFns) !== JSON.stringify(theirsFns)) {
    diffs.push({
      field: "functions",
      ours: oursFns.join(", "),
      theirs: theirsFns.join(", "),
    });
  }

  // Compare register references (RCC, GPIO, etc.)
  const extractRegisters = (s: string) =>
    [...new Set(s.match(/\b(RCC|GPIO[A-H]|TIM\d+|USART\d+|SPI\d+|I2C\d+)\b->\b\w+/g) ?? [])].sort();
  const oursRegs = extractRegisters(ours);
  const theirsRegs = extractRegisters(theirs);
  if (JSON.stringify(oursRegs) !== JSON.stringify(theirsRegs)) {
    diffs.push({
      field: "register_accesses",
      ours: oursRegs.join(", "),
      theirs: theirsRegs.join(", "),
    });
  }

  return diffs;
}

/**
 * Compare Makefiles structurally (targets, flags, memory layout).
 */
function diffMakefile(ours: string, theirs: string): StructuralDiff[] {
  const diffs: StructuralDiff[] = [];

  // Compare targets
  const extractTargets = (s: string) =>
    [...s.matchAll(/^(\w[\w-]*):/gm)].map((m) => m[1]).sort();
  const oursTargets = extractTargets(ours);
  const theirsTargets = extractTargets(theirs);
  if (JSON.stringify(oursTargets) !== JSON.stringify(theirsTargets)) {
    diffs.push({
      field: "targets",
      ours: oursTargets.join(", "),
      theirs: theirsTargets.join(", "),
    });
  }

  // Compare compiler flags
  const extractFlags = (s: string) => {
    const flags: string[] = [];
    const matches = s.match(/-m\w+[\w=-]*/g);
    if (matches) flags.push(...matches);
    return [...new Set(flags)].sort();
  };
  const oursFlags = extractFlags(ours);
  const theirsFlags = extractFlags(theirs);
  if (JSON.stringify(oursFlags) !== JSON.stringify(theirsFlags)) {
    diffs.push({
      field: "compiler_flags",
      ours: oursFlags.join(" "),
      theirs: theirsFlags.join(" "),
    });
  }

  // Compare memory layout
  const extractMemory = (s: string) => {
    const flash = s.match(/FLASH.*ORIGIN\s*=\s*(0x[\dA-Fa-f]+).*LENGTH\s*=\s*(\w+)/);
    const ram = s.match(/RAM.*ORIGIN\s*=\s*(0x[\dA-Fa-f]+).*LENGTH\s*=\s*(\w+)/);
    return {
      flash: flash ? `${flash[1]} ${flash[2]}` : undefined,
      ram: ram ? `${ram[1]} ${ram[2]}` : undefined,
    };
  };
  const oursMem = extractMemory(ours);
  const theirsMem = extractMemory(theirs);
  if (oursMem.flash !== theirsMem.flash) {
    diffs.push({ field: "flash_layout", ours: oursMem.flash, theirs: theirsMem.flash });
  }
  if (oursMem.ram !== theirsMem.ram) {
    diffs.push({ field: "ram_layout", ours: oursMem.ram, theirs: theirsMem.ram });
  }

  return diffs;
}

/**
 * Generic line-count diff for unknown file types.
 */
function diffGeneric(ours: string, theirs: string): StructuralDiff[] {
  const oursLines = ours.split("\n").length;
  const theirsLines = theirs.split("\n").length;
  const diffs: StructuralDiff[] = [];

  if (Math.abs(oursLines - theirsLines) > oursLines * 0.3) {
    diffs.push({
      field: "line_count",
      ours: String(oursLines),
      theirs: String(theirsLines),
    });
  }

  return diffs;
}

/**
 * Analyze behavioral differences between the two runs.
 */
function analyzeBehavior(ours: ScenarioResult, theirs: ScenarioResult): string[] {
  const notes: string[] = [];

  // Tool count disparity
  const ratio = ours.toolCalls.length / Math.max(theirs.toolCalls.length, 1);
  if (ratio > 2 || ratio < 0.5) {
    notes.push(
      `Tool call count disparity: ours=${ours.toolCalls.length}, theirs=${theirs.toolCalls.length}`,
    );
  }

  // Different first tools
  const oursFirst = ours.toolCalls[0]?.toolName;
  const theirsFirst = theirs.toolCalls[0]?.toolName;
  if (oursFirst && theirsFirst && normalizeToolName(oursFirst) !== normalizeToolName(theirsFirst)) {
    notes.push(`Different first tool: ours=${oursFirst}, theirs=${theirsFirst}`);
  }

  // Error disparity
  if (ours.errors.length !== theirs.errors.length) {
    notes.push(
      `Error count mismatch: ours=${ours.errors.length}, theirs=${theirs.errors.length}`,
    );
  }

  // Duration disparity
  if (ours.duration > 0 && theirs.duration > 0) {
    const durationRatio = ours.duration / theirs.duration;
    if (durationRatio > 3 || durationRatio < 0.33) {
      notes.push(
        `Duration disparity: ours=${(ours.duration / 1000).toFixed(1)}s, theirs=${(theirs.duration / 1000).toFixed(1)}s`,
      );
    }
  }

  return notes;
}

/**
 * Compute overall similarity score (0.0 - 1.0).
 */
function computeSimilarity(
  toolSetMatch: boolean,
  artifactDiffs: ArtifactDiff[],
  ours: ScenarioResult,
  theirs: ScenarioResult,
): number {
  let score = 0;
  let weights = 0;

  // Tool set match (weight: 0.3)
  score += toolSetMatch ? 0.3 : 0;
  weights += 0.3;

  // Artifact similarity (weight: 0.4)
  if (artifactDiffs.length > 0) {
    const identical = artifactDiffs.filter((d) => d.type === "identical").length;
    const modified = artifactDiffs.filter((d) => d.type === "modified").length;
    const artifactScore = (identical + modified * 0.5) / artifactDiffs.length;
    score += artifactScore * 0.4;
  } else {
    // Both produced no artifacts — if both succeeded, that's fine
    if (ours.success && theirs.success) score += 0.4;
  }
  weights += 0.4;

  // Both succeeded (weight: 0.2)
  if (ours.success === theirs.success) score += 0.2;
  weights += 0.2;

  // Tool sequence similarity (weight: 0.1)
  const seqSim = sequenceSimilarity(
    ours.toolCalls.map((tc) => normalizeToolName(tc.toolName)),
    theirs.toolCalls.map((tc) => normalizeToolName(tc.toolName)),
  );
  score += seqSim * 0.1;
  weights += 0.1;

  return score / weights;
}

/**
 * Compute sequence similarity using longest common subsequence.
 */
function sequenceSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return (2 * dp[m][n]) / (m + n);
}
