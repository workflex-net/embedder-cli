// Key symbol mapping

export interface KeySymbolMap {
  ctrl: string;
  alt: string;
  shift: string;
  meta: string;
  enter: string;
  escape: string;
  tab: string;
  backspace: string;
  delete: string;
  up: string;
  down: string;
  left: string;
  right: string;
}

/** Modifier key symbol resolver (nM) */
export function nM(isMac: boolean = process.platform === "darwin"): KeySymbolMap {
  if (isMac) {
    return {
      ctrl: "\u2303",
      alt: "\u2325",
      shift: "\u21E7",
      meta: "\u2318",
      enter: "\u21A9",
      escape: "\u238B",
      tab: "\u21E5",
      backspace: "\u232B",
      delete: "\u2326",
      up: "\u2191",
      down: "\u2193",
      left: "\u2190",
      right: "\u2192",
    };
  }

  return {
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
    meta: "Super",
    enter: "Enter",
    escape: "Esc",
    tab: "Tab",
    backspace: "Backspace",
    delete: "Delete",
    up: "Up",
    down: "Down",
    left: "Left",
    right: "Right",
  };
}

export const keySymbols = nM();

export default { nM, keySymbols };
