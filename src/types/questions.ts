// /home/leo/work/embedder/src/types/questions.ts
// Question types for interactive prompts, user queries, and response handling.

export type QuestionType =
  | "text"
  | "confirm"
  | "select"
  | "multiselect"
  | "number"
  | "password"
  | "file"
  | "directory";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: QuestionPrompt;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  defaultValue?: QuestionValue;
  required: boolean;
  dependsOn?: QuestionDependency;
}

export interface QuestionPrompt {
  text: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}

export interface QuestionOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

export interface QuestionValidation {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: QuestionValue) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export type QuestionValue = string | number | boolean | string[];

export interface QuestionResponse {
  questionId: string;
  value: QuestionValue;
  answeredAt: number;
  skipped: boolean;
}

export interface QuestionDependency {
  questionId: string;
  condition: "equals" | "not_equals" | "contains" | "truthy";
  value?: QuestionValue;
}

export interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  sequential: boolean;
}

export interface QuestionSetResult {
  setId: string;
  responses: QuestionResponse[];
  completedAt: number;
  aborted: boolean;
}
