// Original: src/lib/tools/system/safeCommands.ts
// Extracted: tools_safeCommands.js (moduleId)

export const safeCommandSet = new Set<string>([
  "ls",
  "cat",
  "head",
  "tail",
  "wc",
  "echo",
  "pwd",
  "whoami",
  "date",
  "which",
  "type",
  "file",
  "stat",
  "du",
  "df",
  "free",
  "uname",
  "env",
  "printenv",
  "git status",
  "git log",
  "git diff",
  "git branch",
  "git show",
  "git remote",
  "npm list",
  "npm outdated",
  "npm view",
  "node --version",
  "npm --version",
  "python --version",
  "pip list",
  "cargo --version",
  "rustc --version",
  "go version",
  "java --version",
]);

export function isSafeCommand(command: string): boolean {
  const trimmed = command.trim();

  for (const safe of safeCommandSet) {
    if (trimmed === safe || trimmed.startsWith(safe + " ")) {
      return true;
    }
  }

  return false;
}
