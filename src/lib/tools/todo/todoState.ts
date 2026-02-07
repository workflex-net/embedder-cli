// Original: src/lib/tools/todo/todoState.ts
// Extracted: tools_todoState.js (moduleId)

import { Todo, TodoStatus } from "./todoTypes";

export { TodoStatus };

let currentTodos: Todo[] = [];
let sessionId: string = generateSessionId();

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodos(): Todo[] {
  return [...currentTodos];
}

export function setTodos(todos: Todo[]): void {
  currentTodos = [...todos];
}

export function getSessionId(): string {
  return sessionId;
}

export function resetSession(): void {
  currentTodos = [];
  sessionId = generateSessionId();
}
