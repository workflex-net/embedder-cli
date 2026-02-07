// Original: src/lib/tools/mode/prompts.ts
// Extracted: tools_prompts.js (moduleId)

export const planModePrompt = `You are in PLAN mode. In this mode you should:
- Analyze the user's request thoroughly
- Gather information using read-only tools
- Create a detailed plan of action
- Submit the plan for user approval before execution
- Do NOT make any changes to files or run destructive commands`;

export const actModePrompt = `You are in ACT mode. In this mode you should:
- Execute the approved plan step by step
- Make file changes and run commands as needed
- Report progress as you complete each step
- Ask for clarification if the plan is ambiguous`;

export function getSystemPrompt(mode: "plan" | "act"): string {
  switch (mode) {
    case "plan":
      return planModePrompt;
    case "act":
      return actModePrompt;
    default:
      return actModePrompt;
  }
}
