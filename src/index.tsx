// Original: src/index.tsx
// Main entry point for embedder CLI v3
import React from "react";
import { createRoot } from "@opentui/react";
import { Main } from "./pages/Main";
// TODO: wrap with all context providers
const root = createRoot();
root.render(<Main />);
