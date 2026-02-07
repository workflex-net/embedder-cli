// Original: src/lib/inputModes/serialMode.ts
// Serial input mode definition
import type { InputMode } from "./bashMode";

export const serialMode: InputMode = {
  name: "serial",
  prefix: ">> ",
  placeholder: "Send to serial port...",
  transform: (input: string) => input + "\r\n",
  validate: (input: string) => input.length > 0,
};
