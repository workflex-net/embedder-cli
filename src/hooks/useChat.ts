// Original: src/hooks/useChat.ts
// Extracted: lib_app.js
import { useState, useCallback, useRef } from "react";
import type { Message } from "../types/api";

export interface UseChatOptions {
  sessionId: string | null;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  stopStream: () => void;
  clearMessages: () => void;
  undoLastMessage: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // TODO: restore from lib_app.js
  }, [options.sessionId]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);
  const undoLastMessage = useCallback(() => {
    setMessages((prev) => prev.slice(0, -1));
  }, []);

  return { messages, isStreaming, sendMessage, stopStream, clearMessages, undoLastMessage };
}
