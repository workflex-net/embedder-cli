// Original: src/hooks/useNavigationKeys.ts
// Navigation key handling hook
import { useEffect } from "react";

export type NavigationKeyHandler = (key: string, event: KeyboardEvent) => void;

export function useNavigationKeys(handler: NavigationKeyHandler): void {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const { key } = event;
      const navigationKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
        "Tab",
        "Escape",
        "Enter",
      ];
      if (navigationKeys.includes(key)) {
        handler(key, event);
      }
    };

    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [handler]);
}
