import { z } from "zod";

export const SourceDocumentIdsSchema = z.object({
  agent_package_id: z.string(),
  design_system_id: z.string(),
  engineering_plan_id: z.string(),
});
export type SourceDocumentIds = z.infer<typeof SourceDocumentIdsSchema>;

export const WorkspaceFileSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  hash: z.string().optional(),
});
export type WorkspaceFile = z.infer<typeof WorkspaceFileSchema>;

export const FileChangeSchema = z.object({
  path: z.string(),
  operation: z.enum(["create", "modify", "delete"]),
  previous_hash: z.string().optional(),
  new_hash: z.string().optional(),
  previous_size: z.number().optional(),
  new_size: z.number().optional(),
  reason: z.string(),
  engineering_task_id: z.string(),
});
export type FileChange = z.infer<typeof FileChangeSchema>;

export const ExecutionErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
});
export type ExecutionError = z.infer<typeof ExecutionErrorSchema>;

export const ValidationResultSchema = z.object({
  check: z.string(),
  status: z.enum(["passed", "failed"]),
  command: z.string().optional(),
  exit_code: z.number().optional(),
  stdout_summary: z.string().optional(),
  stderr_summary: z.string().optional(),
  duration: z.number().optional(),
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const HumanInterventionSchema = z.object({
  reason: z.string(),
  affected_task: z.string(),
  affected_files: z.array(z.string()),
  evidence: z.string(),
  options: z.array(z.string()),
  recommended_next_action: z.string(),
});
export type HumanIntervention = z.infer<typeof HumanInterventionSchema>;

export const AgentDecisionSchema = z.object({
  decision: z.string(),
  rationale: z.string(),
});
export type AgentDecision = z.infer<typeof AgentDecisionSchema>;

export const ExecutionSummarySchema = z.object({
  tasks_completed: z.number(),
  tasks_failed: z.number(),
  files_changed: z.number(),
  duration: z.number(),
});
export type ExecutionSummary = z.infer<typeof ExecutionSummarySchema>;

export const CodingAgentSessionSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  user_id: z.string(),
  status: z.enum(["created", "preparing", "ready", "running", "paused", "completed", "failed", "cancelled", "blocked"]),
  workspace_id: z.string().optional().nullable(),
  source_document_ids: SourceDocumentIdsSchema,
  current_task_id: z.string().optional().nullable(),
  started_at: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  error: ExecutionErrorSchema.optional().nullable(),
  summary: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CodingAgentSession = z.infer<typeof CodingAgentSessionSchema>;

export const CodingAgentTaskSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  engineering_task_id: z.string(),
  title: z.string(),
  phase: z.string(),
  status: z.enum(["pending", "ready", "running", "validating", "completed", "failed", "blocked", "cancelled"]),
  dependencies: z.array(z.string()).default([]),
  attempt: z.number().default(0),
  files_expected: z.array(z.string()).default([]),
  files_changed: z.array(FileChangeSchema).default([]),
  validation_status: z.array(ValidationResultSchema).optional().nullable(),
  error: ExecutionErrorSchema.optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CodingAgentTask = z.infer<typeof CodingAgentTaskSchema>;

export const CodingAgentStepSchema = z.object({
  path: z.string(),
  operation: z.enum(["create", "modify", "delete"]),
  content: z.string().optional(),
  reason: z.string(),
  task_id: z.string(),
});
export type CodingAgentStep = z.infer<typeof CodingAgentStepSchema>;
