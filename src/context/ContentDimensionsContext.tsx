// Original: src/context/ContentDimensionsContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo } from "react";

interface ContentDimensionsContextValue {
  width: number;
  height: number;
  contentWidth: number;
  sidebarWidth: number;
}

const ContentDimensionsContext = createContext<ContentDimensionsContextValue | null>(null);

export function ContentDimensionsProvider({ children }: { children: React.ReactNode }) {
  const [width] = useState(1280);
  const [height] = useState(720);
  const [contentWidth] = useState(1024);
  const [sidebarWidth] = useState(256);

  const value = useMemo(
    () => ({ width, height, contentWidth, sidebarWidth }),
    [width, height, contentWidth, sidebarWidth]
  );

  return (
    <ContentDimensionsContext.Provider value={value}>{children}</ContentDimensionsContext.Provider>
  );
}

export function useContentDimensions() {
  const ctx = useContext(ContentDimensionsContext);
  if (!ctx)
    throw new Error("useContentDimensions must be used within ContentDimensionsProvider");
  return ctx;
}
