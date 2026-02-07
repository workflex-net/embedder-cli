// Original: src/context/AIContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface AIModel {
  id: string;
  name: string;
  provider: string;
}

interface AIContextValue {
  availableModels: AIModel[];
  selectedModel: AIModel | null;
  switchModel: (modelId: string) => void;
  getHeaders: () => Record<string, string>;
  registry: Map<string, AIModel>;
}

const AIContext = createContext<AIContextValue | null>(null);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [availableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [registry] = useState<Map<string, AIModel>>(new Map());

  const switchModel = useCallback((modelId: string) => {
    const model = availableModels.find((m) => m.id === modelId) ?? null;
    setSelectedModel(model);
  }, [availableModels]);

  const getHeaders = useCallback(() => {
    return selectedModel
      ? { "X-AI-Model": selectedModel.id, "X-AI-Provider": selectedModel.provider }
      : {};
  }, [selectedModel]);

  const value = useMemo(
    () => ({ availableModels, selectedModel, switchModel, getHeaders, registry }),
    [availableModels, selectedModel, switchModel, getHeaders, registry]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAI must be used within AIProvider");
  return ctx;
}
