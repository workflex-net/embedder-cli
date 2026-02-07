export type ScenarioPhase =
  | "hardware-identification"
  | "requirement-decomposition"
  | "rag-recall"
  | "code-implementation"
  | "flash-verification";

export interface ScenarioDefinition {
  id: string;
  name: string;
  phase: ScenarioPhase;
  prompt: string;
  requiresHardware: boolean;
  dependsOn?: string[];
  timeout: number;
  allowedTools: string[];
  validate: (result: ScenarioResult) => ValidationResult;
}

export interface ScenarioResult {
  scenarioId: string;
  source: "ours" | "theirs";
  success: boolean;
  duration: number;
  toolCalls: ToolCallRecord[];
  artifacts: Record<string, string>;
  serialOutput?: string;
  errors: string[];
}

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  timestamp: number;
}

export interface ComparisonResult {
  scenarioId: string;
  similarity: number;
  toolSetMatch: boolean;
  artifactDiffs: ArtifactDiff[];
  behaviorNotes: string[];
  pass: boolean;
}

export interface ArtifactDiff {
  path: string;
  type: "added" | "removed" | "modified" | "identical";
  oursContent?: string;
  theirsContent?: string;
  structuralDiffs?: StructuralDiff[];
}

export interface StructuralDiff {
  field: string;
  ours: string | undefined;
  theirs: string | undefined;
}

export interface ValidationResult {
  pass: boolean;
  checks: ValidationCheck[];
}

export interface ValidationCheck {
  name: string;
  pass: boolean;
  detail: string;
}

export interface RunResult {
  scenarioId: string;
  ours: ScenarioResult;
  theirs: ScenarioResult;
  comparison: ComparisonResult;
  validation: ValidationResult;
}

export interface SummaryReport {
  timestamp: string;
  totalScenarios: number;
  passed: number;
  failed: number;
  skipped: number;
  averageSimilarity: number;
  results: RunResult[];
}
