// Original: src/context/BillingContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo } from "react";

interface Subscription {
  plan: string;
  status: string;
  renewsAt: Date | null;
}

interface Usage {
  tokensUsed: number;
  tokensLimit: number;
  requestsUsed: number;
  requestsLimit: number;
}

interface BillingContextValue {
  billingStatus: string;
  subscription: Subscription | null;
  usage: Usage | null;
}

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [billingStatus] = useState<string>("inactive");
  const [subscription] = useState<Subscription | null>(null);
  const [usage] = useState<Usage | null>(null);

  const value = useMemo(
    () => ({ billingStatus, subscription, usage }),
    [billingStatus, subscription, usage]
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}
