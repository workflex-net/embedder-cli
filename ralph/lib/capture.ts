import type { ToolCallRecord } from "./types";

/**
 * Captures tool calls and file artifacts produced during an agent run.
 */
export class OutputCapture {
  readonly toolCalls: ToolCallRecord[] = [];
  readonly artifacts: Record<string, string> = {};
  readonly errors: string[] = [];
  private startTime: number = 0;

  start(): void {
    this.startTime = Date.now();
  }

  get elapsed(): number {
    return Date.now() - this.startTime;
  }

  recordToolCall(toolName: string, input: Record<string, unknown>, output: string): void {
    this.toolCalls.push({
      toolName,
      input,
      output,
      timestamp: Date.now(),
    });

    // Capture file artifacts from Write/Edit tools
    if (toolName === "Write" || toolName === "writeFile") {
      const path = (input.file_path ?? input.path ?? "") as string;
      const content = (input.content ?? "") as string;
      if (path) {
        this.artifacts[path] = content;
      }
    }

    if (toolName === "Edit" || toolName === "editFile") {
      const path = (input.file_path ?? input.path ?? "") as string;
      if (path && output) {
        // For edits, store the result (we may not have the full file)
        this.artifacts[path] = output;
      }
    }
  }

  recordError(error: string): void {
    this.errors.push(error);
  }

  /** Get the set of unique tool names called */
  get toolSet(): Set<string> {
    return new Set(this.toolCalls.map((tc) => tc.toolName));
  }

  /** Get tool call sequence as ordered list of names */
  get toolSequence(): string[] {
    return this.toolCalls.map((tc) => tc.toolName);
  }

  reset(): void {
    this.toolCalls.length = 0;
    this.errors.length = 0;
    for (const key of Object.keys(this.artifacts)) {
      delete this.artifacts[key];
    }
    this.startTime = Date.now();
  }
}

/**
 * Read all files in a directory tree into a flat record.
 */
export async function captureWorkspaceFiles(dir: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const glob = new Bun.Glob("**/*");

  for await (const path of glob.scan({ cwd: dir, onlyFiles: true })) {
    try {
      const content = await Bun.file(`${dir}/${path}`).text();
      result[path] = content;
    } catch {
      // skip unreadable files
    }
  }

  return result;
}
