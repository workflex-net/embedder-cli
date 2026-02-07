// Original: src/hooks/useRewind.ts
// Rewind/undo hook for conversation history
import { useState, useCallback, useEffect } from "react";
import type { Message } from "../types/api";

export interface Snapshot {
  id: string;
  timestamp: number;
  messages: Message[];
}

export interface UseRewindOptions {
  messages: Message[];
}

export interface UseRewindReturn {
  snapshots: Snapshot[];
  rewindTo: (snapshotId: string) => Message[];
  canRewind: boolean;
}

export function useRewind({ messages }: UseRewindOptions): UseRewindReturn {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    if (messages.length > 0) {
      const snapshot: Snapshot = {
        id: `snap-${Date.now()}`,
        timestamp: Date.now(),
        messages: [...messages],
      };
      setSnapshots((prev) => [...prev, snapshot]);
    }
  }, [messages.length]);

  const rewindTo = useCallback(
    (snapshotId: string): Message[] => {
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      return snapshot ? [...snapshot.messages] : [];
    },
    [snapshots],
  );

  return { snapshots, rewindTo, canRewind: snapshots.length > 1 };
}
