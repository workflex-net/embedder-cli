// /home/leo/work/embedder/src/types/input.ts
// Input types for keyboard/mouse event handling and input mode management.

export type InputMode =
  | "normal"
  | "insert"
  | "command"
  | "search"
  | "select"
  | "prompt";

export interface InputState {
  mode: InputMode;
  buffer: string;
  cursorPosition: number;
  selectionStart: number | null;
  selectionEnd: number | null;
  history: string[];
  historyIndex: number;
  isComposing: boolean;
}

export interface KeyEvent {
  key: string;
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  raw: string;
  sequence: string;
  timestamp: number;
}

export interface MouseEvent {
  type: "click" | "scroll" | "drag" | "release";
  x: number;
  y: number;
  button: "left" | "right" | "middle" | "none";
  scrollDelta?: number;
  timestamp: number;
}

export interface InputHandler {
  mode: InputMode;
  handleKey: (event: KeyEvent) => InputAction;
  handleMouse?: (event: MouseEvent) => InputAction;
}

export type InputAction =
  | { type: "insert"; text: string }
  | { type: "delete"; direction: "forward" | "backward"; count: number }
  | { type: "move"; direction: CursorDirection; count: number }
  | { type: "select"; direction: CursorDirection; count: number }
  | { type: "submit"; value: string }
  | { type: "cancel" }
  | { type: "mode_change"; mode: InputMode }
  | { type: "history"; direction: "up" | "down" }
  | { type: "complete"; partial: string }
  | { type: "noop" };

export type CursorDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "home"
  | "end"
  | "word_left"
  | "word_right"
  | "page_up"
  | "page_down";

export interface CompletionItem {
  label: string;
  detail?: string;
  insertText: string;
  kind: "command" | "file" | "directory" | "keyword" | "snippet";
  sortPriority: number;
}

export interface CompletionState {
  items: CompletionItem[];
  selectedIndex: number;
  visible: boolean;
  prefix: string;
}
