import {
  query,
  type SDKMessage,
  type SDKAssistantMessage,
  type SDKResultMessage,
  type HookInput,
  type HookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { config } from "../ralph.config";
import { OutputCapture } from "./capture";
import type { ScenarioResult } from "./types";

/**
 * The EMBEDDER.md init template extracted from lib_app.js txB variable.
 * This is the real system prompt the production embedder uses.
 */
const REAL_SYSTEM_PROMPT = `You are an expert embedded systems engineer assistant called Embedder.
You help developers build firmware for microcontrollers. You have deep knowledge of:
- STM32, ESP32, nRF, RP2040 and other MCU families
- Bare-metal register-level programming
- CMSIS, HAL, and vendor SDKs
- Build systems (Make, CMake, PlatformIO)
- Debugging with OpenOCD, ST-Link, J-Link
- Serial communication and monitoring
- RTOS (FreeRTOS, Zephyr)

When working on a project, always check for an EMBEDDER.md file in the project root.
This file contains project-specific configuration including:
- Target MCU and board
- Toolchain and build commands
- Debug interface configuration
- Serial monitor settings

You have access to tools for reading/writing files, searching code, managing tasks,
searching documentation, and interacting with hardware (serial monitor, flash).

Always use the appropriate tools rather than just providing instructions.
When generating code, use CMSIS register-level access unless the project specifies HAL.
Ensure all generated code includes proper startup files, linker scripts, and Makefiles.`;

/**
 * Our reconstructed system prompt, built from src/ skeleton analysis.
 */
const OUR_SYSTEM_PROMPT = `You are an embedded systems engineering assistant.
You help developers write firmware for microcontrollers using bare-metal and SDK approaches.

Core capabilities:
- Hardware identification (ST-Link probe, serial port discovery)
- Project initialization (EMBEDDER.md creation)
- Task decomposition for firmware development
- Hardware catalog and documentation search
- Code generation (drivers, startup, linker scripts, Makefiles)
- Build, flash, and serial verification

When working on embedded projects:
1. Check for EMBEDDER.md in the project root for configuration
2. Use register-level CMSIS access unless HAL is specified
3. Generate complete build artifacts (main.c, startup, linker script, Makefile)
4. Use OpenOCD for flashing via ST-Link
5. Configure serial monitoring with correct port and baud rate

You have access to file read/write tools, search tools, and bash for compilation and flashing.`;

export type RunnerSource = "ours" | "theirs";

interface RunnerOptions {
  source: RunnerSource;
  prompt: string;
  cwd: string;
  allowedTools: string[];
  maxTurns?: number;
  timeout?: number;
}

/**
 * Run a single agent query and capture all tool calls and artifacts.
 */
export async function runAgent(options: RunnerOptions): Promise<ScenarioResult> {
  const { source, prompt, cwd, allowedTools, maxTurns, timeout } = options;
  const capture = new OutputCapture();
  capture.start();

  const systemPrompt = source === "theirs" ? REAL_SYSTEM_PROMPT : OUR_SYSTEM_PROMPT;

  const abortController = new AbortController();
  const stderrLines: string[] = [];
  let timedOut = false;

  // Clean env: remove nested Claude Code session markers
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;
  delete cleanEnv.CLAUDE_CODE_ENTRYPOINT;

  // We'll set the timer AFTER creating `q` so we can call q.close() directly
  // instead of abortController.abort() — the latter causes the SDK's internal
  // write/handleControlRequest to throw an unhandled "Operation aborted" error.
  let q: ReturnType<typeof query> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    q = query({
      prompt,
      options: {
        systemPrompt,
        cwd,
        model: config.model,
        maxTurns: maxTurns ?? config.maxTurns,
        allowedTools,
        abortController,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        executable: config.claudeCodeExecutable,
        pathToClaudeCodeExecutable: config.claudeCodePath,
        env: cleanEnv,
        stderr: (data: string) => {
          stderrLines.push(data);
        },
        hooks: {
          PostToolUse: [
            {
              hooks: [
                async (
                  input: HookInput,
                  _toolUseID: string | undefined,
                  hookOpts: { signal: AbortSignal },
                ): Promise<HookJSONOutput> => {
                  // If already aborted, bail out immediately
                  if (hookOpts.signal.aborted || timedOut) {
                    return { continue: true };
                  }
                  if (input.hook_event_name === "PostToolUse") {
                    capture.recordToolCall(
                      input.tool_name ?? "unknown",
                      (input.tool_input as Record<string, unknown>) ?? {},
                      typeof input.tool_response === "string"
                        ? input.tool_response
                        : JSON.stringify(input.tool_response ?? ""),
                    );
                  }
                  return { continue: true };
                },
              ],
            },
          ],
        },
      },
    });

    // Set up timeout AFTER q is created — use q.close() for graceful shutdown
    if (timeout) {
      timer = setTimeout(() => {
        timedOut = true;
        try { q?.close(); } catch { /* ignore */ }
        // Only abort as a last resort, after close
        setTimeout(() => {
          try { abortController.abort(); } catch { /* ignore */ }
        }, 2000);
      }, timeout);
    }

    try {
      for await (const message of q) {
        // Extract tool_use blocks from assistant messages as backup capture
        if (message.type === "assistant") {
          const assistantMsg = message as SDKAssistantMessage;
          const content = assistantMsg.message?.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === "tool_use") {
                // Record from assistant message if hook didn't fire
                const existing = capture.toolCalls.find(
                  (tc) =>
                    tc.toolName === block.name &&
                    JSON.stringify(tc.input) === JSON.stringify(block.input),
                );
                if (!existing) {
                  capture.recordToolCall(
                    block.name,
                    (block.input as Record<string, unknown>) ?? {},
                    "[from assistant message]",
                  );
                }
              }
            }
          }
        }

        if (message.type === "result") {
          const result = message as SDKResultMessage;
          if (result.subtype !== "success") {
            capture.recordError(
              `Agent ended with: ${result.subtype}${
                "errors" in result && result.errors?.length
                  ? ` — ${result.errors.join("; ")}`
                  : ""
              }`,
            );
          }
        }
      }
    } catch (iterErr) {
      // Handle abort/timeout errors from the message iterator
      const msg = iterErr instanceof Error ? iterErr.message : String(iterErr);
      const isAbort =
        msg.includes("abort") || msg.includes("Abort") || msg.includes("Operation aborted") || timedOut;
      if (isAbort) {
        capture.recordError(timedOut ? `Timed out after ${timeout}ms` : "Aborted");
      } else {
        capture.recordError(msg);
      }
      try { q?.close(); } catch { /* ignore */ }
    }

    return {
      scenarioId: "",
      source,
      success: capture.errors.length === 0,
      duration: capture.elapsed,
      toolCalls: [...capture.toolCalls],
      artifacts: { ...capture.artifacts },
      errors: [...capture.errors],
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    const isAbort =
      error.includes("abort") || error.includes("Abort") || error.includes("Operation aborted") || timedOut;
    capture.recordError(isAbort ? `Timed out after ${timeout}ms` : error);

    if (!isAbort && stderrLines.length > 0) {
      const stderrSummary = stderrLines.slice(-5).join("\n");
      capture.recordError(`stderr: ${stderrSummary}`);
    }

    return {
      scenarioId: "",
      source,
      success: false,
      duration: capture.elapsed,
      toolCalls: [...capture.toolCalls],
      artifacts: { ...capture.artifacts },
      errors: [...capture.errors],
    };
  } finally {
    if (timer) clearTimeout(timer);
    // Final cleanup: ensure the query is closed
    try { q?.close(); } catch { /* ignore */ }
  }
}

/**
 * Run both agents (ours + theirs) in parallel with the same prompt.
 */
export async function runDualAgents(
  prompt: string,
  cwd: { ours: string; theirs: string },
  allowedTools: string[],
  options?: { maxTurns?: number; timeout?: number },
): Promise<{ ours: ScenarioResult; theirs: ScenarioResult }> {
  const [oursSettled, theirsSettled] = await Promise.allSettled([
    runAgent({
      source: "ours",
      prompt,
      cwd: cwd.ours,
      allowedTools,
      maxTurns: options?.maxTurns,
      timeout: options?.timeout,
    }),
    runAgent({
      source: "theirs",
      prompt,
      cwd: cwd.theirs,
      allowedTools,
      maxTurns: options?.maxTurns,
      timeout: options?.timeout,
    }),
  ]);

  const makeFailed = (source: "ours" | "theirs", reason: unknown): ScenarioResult => ({
    scenarioId: "",
    source,
    success: false,
    duration: 0,
    toolCalls: [],
    artifacts: {},
    errors: [reason instanceof Error ? reason.message : String(reason)],
  });

  const ours = oursSettled.status === "fulfilled"
    ? oursSettled.value
    : makeFailed("ours", oursSettled.reason);
  const theirs = theirsSettled.status === "fulfilled"
    ? theirsSettled.value
    : makeFailed("theirs", theirsSettled.reason);

  return { ours, theirs };
}
