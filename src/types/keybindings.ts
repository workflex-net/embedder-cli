// /home/leo/work/embedder/src/types/keybindings.ts
// Keybinding types for mapping key combinations to actions across different modes.

export type KeybindingMode =
  | "global"
  | "normal"
  | "insert"
  | "command"
  | "search"
  | "serial"
  | "catalog"
  | "dialog";

export interface KeyBinding {
  id: string;
  keys: KeyCombo;
  action: string;
  mode: KeybindingMode;
  description: string;
  when?: KeybindingCondition;
  priority: number;
  builtin: boolean;
}

export interface KeyCombo {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export type KeybindingCondition =
  | { type: "mode"; mode: KeybindingMode }
  | { type: "view"; view: string }
  | { type: "focus"; element: string }
  | { type: "and"; conditions: KeybindingCondition[] }
  | { type: "or"; conditions: KeybindingCondition[] }
  | { type: "not"; condition: KeybindingCondition };

export interface KeyMap {
  mode: KeybindingMode;
  bindings: KeyBinding[];
}

export interface KeybindingConfig {
  maps: KeyMap[];
  defaults: KeyMap[];
  userOverrides: KeyBindingOverride[];
}

export interface KeyBindingOverride {
  id: string;
  keys?: KeyCombo;
  action?: string;
  disabled?: boolean;
}

export interface KeybindingResolver {
  resolve: (combo: KeyCombo, mode: KeybindingMode) => ResolvedBinding | null;
  getBindingsForMode: (mode: KeybindingMode) => KeyBinding[];
  getBindingsForAction: (action: string) => KeyBinding[];
}

export interface ResolvedBinding {
  binding: KeyBinding;
  action: string;
  conflictsWith?: KeyBinding[];
}

export type KeyDisplayFormat = "short" | "long" | "symbol";

export interface KeyLabel {
  combo: KeyCombo;
  display: string;
  format: KeyDisplayFormat;
}
