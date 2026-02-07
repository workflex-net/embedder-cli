// Original: src/context/CommandsContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  execute: () => void;
}

interface CommandsContextValue {
  commands: Command[];
  findMatchingCommands: (query: string) => Command[];
  executeCommand: (commandId: string) => void;
}

const CommandsContext = createContext<CommandsContextValue | null>(null);

export function CommandsProvider({ children }: { children: React.ReactNode }) {
  const [commands, setCommands] = useState<Command[]>([]);

  const findMatchingCommands = useCallback(
    (query: string): Command[] => {
      const lower = query.toLowerCase();
      return commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(lower) ||
          (cmd.description?.toLowerCase().includes(lower) ?? false)
      );
    },
    [commands]
  );

  const executeCommand = useCallback(
    (commandId: string) => {
      const cmd = commands.find((c) => c.id === commandId);
      if (cmd) cmd.execute();
    },
    [commands]
  );

  const value = useMemo(
    () => ({ commands, findMatchingCommands, executeCommand }),
    [commands, findMatchingCommands, executeCommand]
  );

  return <CommandsContext.Provider value={value}>{children}</CommandsContext.Provider>;
}

export function useCommands() {
  const ctx = useContext(CommandsContext);
  if (!ctx) throw new Error("useCommands must be used within CommandsProvider");
  return ctx;
}
