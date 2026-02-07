// Conversation persistence

import * as fs from "fs";
import * as path from "path";
import { getDataDir } from "./paths";

export interface ConversationMessage {
  role: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}

function getConversationsDir(): string {
  return path.join(getDataDir(), "conversations");
}

/** Save conversation (rUA) */
export function rUA(conversation: Conversation): void {
  const dir = getConversationsDir();
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `${conversation.id}.json`);
  fs.writeFileSync(filepath, JSON.stringify(conversation, null, 2), "utf-8");
}
export const saveConversation = rUA;

/** Load conversation (q7) */
export function q7(id: string): Conversation | null {
  const filepath = path.join(getConversationsDir(), `${id}.json`);
  try {
    const data = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(data) as Conversation;
  } catch {
    return null;
  }
}
export const loadConversation = q7;

/** List conversations (W7) */
export function W7(): Conversation[] {
  const dir = getConversationsDir();
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    return files
      .map((f) => {
        try {
          return JSON.parse(
            fs.readFileSync(path.join(dir, f), "utf-8"),
          ) as Conversation;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Conversation[];
  } catch {
    return [];
  }
}
export const listConversations = W7;

/** Get conversation messages (EfB) */
export function EfB(id: string): ConversationMessage[] {
  const conv = q7(id);
  return conv?.messages ?? [];
}
export const getConversationMessages = EfB;

export default { saveConversation, loadConversation, listConversations, getConversationMessages };
