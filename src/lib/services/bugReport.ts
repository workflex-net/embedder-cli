// Original: src/lib/services/bugReport.ts
// Bug reporting service

export interface DiagnosticInfo {
  platform: string;
  version: string;
  nodeVersion: string;
  memory: { used: number; total: number };
  uptime: number;
  recentErrors: string[];
}

export interface BugReport {
  title: string;
  description: string;
  diagnostics: DiagnosticInfo;
  timestamp: number;
}

/**
 * Collect diagnostic information for bug reports.
 * Aliased as NxB in minified bundle.
 */
export async function collectDiagnostics(): Promise<DiagnosticInfo> {
  const mem = process.memoryUsage();
  return {
    platform: process.platform,
    version: "0.0.0", // TODO: restore from package.json
    nodeVersion: process.version,
    memory: { used: mem.heapUsed, total: mem.heapTotal },
    uptime: process.uptime(),
    recentErrors: [],
  };
}

/** Alias used in minified bundle */
export const NxB = collectDiagnostics;

/**
 * Submit a bug report.
 * Aliased as TxB in minified bundle.
 */
export async function submitBugReport(title: string, description: string): Promise<void> {
  const diagnostics = await collectDiagnostics();
  const report: BugReport = {
    title,
    description,
    diagnostics,
    timestamp: Date.now(),
  };
  // TODO: restore - send bug report to backend
  console.error("Bug report submitted:", report.title);
}

/** Alias used in minified bundle */
export const TxB = submitBugReport;
