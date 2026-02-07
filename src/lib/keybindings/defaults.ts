// Original: src/lib/keybindings/defaults.ts
// Default keybinding definitions

export interface Keybinding {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: string;
  description: string;
}

export const defaultKeybindings: Keybinding[] = [
  { key: "Enter", action: "submit", description: "Submit message" },
  { key: "Enter", shift: true, action: "newline", description: "Insert newline" },
  { key: "c", ctrl: true, action: "cancel", description: "Cancel/stop streaming" },
  { key: "l", ctrl: true, action: "clear", description: "Clear screen" },
  { key: "z", ctrl: true, action: "undo", description: "Undo last message" },
  { key: "ArrowUp", action: "historyPrev", description: "Previous history entry" },
  { key: "ArrowDown", action: "historyNext", description: "Next history entry" },
  { key: "Tab", action: "autocomplete", description: "Trigger autocomplete" },
  { key: "Escape", action: "dismiss", description: "Dismiss/cancel" },
  { key: "/", ctrl: true, action: "help", description: "Show help" },
  { key: "k", ctrl: true, action: "clearChat", description: "Clear chat history" },
  { key: "s", ctrl: true, action: "save", description: "Save conversation" },
];

export const emacsKeyMap: Keybinding[] = [
  { key: "a", ctrl: true, action: "lineStart", description: "Move to line start" },
  { key: "e", ctrl: true, action: "lineEnd", description: "Move to line end" },
  { key: "f", ctrl: true, action: "charForward", description: "Move forward one character" },
  { key: "b", ctrl: true, action: "charBackward", description: "Move backward one character" },
  { key: "d", ctrl: true, action: "deleteForward", description: "Delete forward" },
  { key: "k", ctrl: true, action: "killLine", description: "Kill to end of line" },
  { key: "y", ctrl: true, action: "yank", description: "Yank (paste)" },
  { key: "p", ctrl: true, action: "lineUp", description: "Move up one line" },
  { key: "n", ctrl: true, action: "lineDown", description: "Move down one line" },
];

export const vimKeyMap: Keybinding[] = [
  { key: "Escape", action: "normalMode", description: "Enter normal mode" },
  { key: "i", action: "insertMode", description: "Enter insert mode" },
  { key: "h", action: "charBackward", description: "Move left" },
  { key: "j", action: "lineDown", description: "Move down" },
  { key: "k", action: "lineUp", description: "Move up" },
  { key: "l", action: "charForward", description: "Move right" },
  { key: "w", action: "wordForward", description: "Move forward one word" },
  { key: "b", action: "wordBackward", description: "Move backward one word" },
  { key: "0", action: "lineStart", description: "Move to line start" },
  { key: "$", action: "lineEnd", description: "Move to line end" },
  { key: "d", action: "delete", description: "Delete" },
  { key: "y", action: "yank", description: "Yank (copy)" },
  { key: "p", action: "paste", description: "Paste" },
];
