// Original: src/lib/inputModes/index.ts
// Re-exports for input modes
export { bashMode } from "./bashMode";
export { serialMode } from "./serialMode";
export type { InputMode } from "./bashMode";

import { bashMode } from "./bashMode";
import { serialMode } from "./serialMode";

export const availableModes = [bashMode, serialMode];
