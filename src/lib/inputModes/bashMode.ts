// Original: src/lib/inputModes/bashMode.ts
// Bash input mode definition

export interface InputMode {
  name: string;
  prefix: string;
  placeholder: string;
  transform?: (input: string) => string;
  validate?: (input: string) => boolean;
}

export const bashMode: InputMode = {
  name: "bash",
  prefix: "$ ",
  placeholder: "Enter a bash command...",
  transform: (input: string) => input.trim(),
  validate: (input: string) => input.trim().length > 0,
};
