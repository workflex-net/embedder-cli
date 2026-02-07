// Original: src/context/SerialContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface SerialPort {
  id: string;
  name: string;
  path: string;
}

interface SerialContextValue {
  ports: SerialPort[];
  selectedPort: SerialPort | null;
  baudRate: number;
  connect: (portId: string, baudRate?: number) => Promise<void>;
  disconnect: () => Promise<void>;
}

const SerialContext = createContext<SerialContextValue | null>(null);

export function SerialProvider({ children }: { children: React.ReactNode }) {
  const [ports] = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<SerialPort | null>(null);
  const [baudRate, setBaudRate] = useState(9600);

  const connect = useCallback(
    async (portId: string, rate?: number) => {
      const port = ports.find((p) => p.id === portId) ?? null;
      setSelectedPort(port);
      if (rate) setBaudRate(rate);
    },
    [ports]
  );

  const disconnect = useCallback(async () => {
    setSelectedPort(null);
  }, []);

  const value = useMemo(
    () => ({ ports, selectedPort, baudRate, connect, disconnect }),
    [ports, selectedPort, baudRate, connect, disconnect]
  );

  return <SerialContext.Provider value={value}>{children}</SerialContext.Provider>;
}

export function useSerial() {
  const ctx = useContext(SerialContext);
  if (!ctx) throw new Error("useSerial must be used within SerialProvider");
  return ctx;
}
