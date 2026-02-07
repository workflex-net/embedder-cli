// Original: src/lib/tools/conversation/askQuestion.ts
// Extracted: tools_askQuestion.js (module ZKA)

import { z } from "zod";
import { createTool } from "../core/createTool";

export const askQuestionTool = createTool({
  metadata: {
    name: "askQuestion",
    displayName: "Ask Question",
    description: "Ask the user one or more clarifying questions.",
    category: "development",
  },
  inputSchema: z.object({
    questions: z.array(z.string()).describe("Array of questions to ask the user"),
  }),
  execute: async (params, context) => {
    // TODO: Implement user question prompting
    throw new Error("Not implemented");
  },
});
