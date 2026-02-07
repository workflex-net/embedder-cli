// /home/leo/work/embedder/src/types/todos.ts
// Todo types for task tracking, status management, and metadata.

export type TodoStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type TodoPriority = "critical" | "high" | "medium" | "low" | "none";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  metadata: TodoMetadata;
  subtasks: Todo[];
  parentId?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface TodoMetadata {
  assignee?: string;
  labels: string[];
  source: TodoSource;
  filePath?: string;
  lineNumber?: number;
  estimateMinutes?: number;
  dueDate?: number;
  notes?: string;
  links?: TodoLink[];
}

export type TodoSource =
  | "manual"
  | "code_comment"
  | "agent_generated"
  | "imported"
  | "issue_tracker";

export interface TodoLink {
  type: "issue" | "pr" | "url" | "file" | "todo";
  url: string;
  label?: string;
}

export interface TodoFilter {
  status?: TodoStatus[];
  priority?: TodoPriority[];
  labels?: string[];
  assignee?: string;
  source?: TodoSource;
  searchQuery?: string;
  createdAfter?: number;
  createdBefore?: number;
}

export type TodoSortField =
  | "priority"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "dueDate"
  | "title";

export type TodoSortDirection = "asc" | "desc";

export interface TodoSort {
  field: TodoSortField;
  direction: TodoSortDirection;
}

export interface TodoList {
  id: string;
  name: string;
  description?: string;
  todos: Todo[];
  filter?: TodoFilter;
  sort?: TodoSort;
  createdAt: number;
  updatedAt: number;
}

export interface TodoStats {
  total: number;
  byStatus: Record<TodoStatus, number>;
  byPriority: Record<TodoPriority, number>;
  overdue: number;
  completedToday: number;
}

export interface TodoEvent {
  type: "created" | "updated" | "deleted" | "status_changed" | "reordered";
  todoId: string;
  previousValue?: Partial<Todo>;
  newValue?: Partial<Todo>;
  timestamp: number;
}
