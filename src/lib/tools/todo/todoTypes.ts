// Original: src/lib/tools/todo/todoTypes.ts
// Extracted: tools_todoTypes.js (moduleId)

export enum TodoStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export interface TodoMetadata {
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  priority?: "low" | "medium" | "high";
  tags?: string[];
}

export interface Todo {
  id: string;
  content: string;
  status: TodoStatus;
  metadata: TodoMetadata;
}
