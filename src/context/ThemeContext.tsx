// Original: src/context/ThemeContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface ThemeContextValue {
  themeName: string;
  availableThemes: string[];
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<string>("default");
  const [availableThemes] = useState<string[]>(["default", "light", "dark", "solarized"]);

  const setTheme = useCallback(
    (name: string) => {
      if (availableThemes.includes(name)) {
        setThemeName(name);
      }
    },
    [availableThemes]
  );

  const value = useMemo(
    () => ({ themeName, availableThemes, setTheme }),
    [themeName, availableThemes, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
