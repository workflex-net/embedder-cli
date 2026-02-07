// Command definitions

export interface Command {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  handler: (args: string[]) => Promise<void> | void;
}

/** Create command definitions (mxB) */
export function mxB(commands?: Partial<Command>[]): Command[] {
  const builtins: Command[] = [
    {
      name: "help",
      aliases: ["h", "?"],
      description: "Show available commands",
      usage: "/help [command]",
      handler: () => {},
    },
    {
      name: "clear",
      aliases: ["cls"],
      description: "Clear the conversation",
      usage: "/clear",
      handler: () => {},
    },
    {
      name: "exit",
      aliases: ["quit", "q"],
      description: "Exit the application",
      usage: "/exit",
      handler: () => {},
    },
  ];

  if (commands) {
    for (const cmd of commands) {
      builtins.push({
        name: cmd.name ?? "unnamed",
        aliases: cmd.aliases ?? [],
        description: cmd.description ?? "",
        usage: cmd.usage ?? "",
        handler: cmd.handler ?? (() => {}),
      });
    }
  }

  return builtins;
}
export const createCommandDefinitions = mxB;

export type { Command as CommandType };

export default { createCommandDefinitions };
