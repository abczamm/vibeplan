import { z } from "zod";

export const discoveryStateSchema = z.object({
  idea: z.string(),
  target_users: z.array(z.string()),
  goals: z.array(z.string()),
  features: z.array(z.string()),
  roles: z.array(z.string()),
  business_rules: z.array(z.string()),
  constraints: z.array(z.string()),
  integrations: z.array(z.string()),
  technical_preferences: z.array(z.string()),
  security_requirements: z.array(z.string()),
});

export const requirementsDraftSchema = z.object({
  overview: z.string().min(1),
  users_and_roles: z.array(z.string()),
  functional_requirements: z.array(z.string()),
  business_rules: z.array(z.string()),
  technical_requirements: z.array(z.string()),
  security_requirements: z.array(z.string()),
  reporting_requirements: z.array(z.string()),
  constraints: z.array(z.string()),
  scope_in: z.array(z.string()),
  scope_out: z.array(z.string()),
});

export const interactionModeSchema = z.enum([
  "question",
  "recommendation",
  "choice",
  "confirmation",
  "custom",
  "review",
]);

export const interactionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  recommended: z.boolean().optional(),
});

export const interactionSchema = z.object({
  mode: interactionModeSchema,
  options: z.array(interactionOptionSchema).optional(),
  allow_custom: z.boolean(),
});

const stateUpdatesSchema = z
  .object({
    idea: z.string().optional(),
    target_users: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    business_rules: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    integrations: z.array(z.string()).optional(),
    technical_preferences: z.array(z.string()).optional(),
    security_requirements: z.array(z.string()).optional(),
  })
  .default({});

// Schema for normal discovery turns (clarifying questions)
export const discoveryResponseSchema = z.object({
  assistant_message: z.string().min(1),
  interaction: interactionSchema,
  state_updates: stateUpdatesSchema,
  next_question: z.string().nullable(),
  phase: z.enum([
    "initial",
    "clarifying",
    "synthesis",
    "approval",
    "completed",
  ]),
});

// Schema for synthesis turn (generates requirements draft)
export const synthesisResponseSchema = z.object({
  assistant_message: z.string().min(1),
  state_updates: stateUpdatesSchema,
  next_question: z.null(),
  phase: z.literal("approval"),
  requirements_draft: requirementsDraftSchema,
});

export const reviewIssueSeveritySchema = z.enum(["important", "minor"]);

export const reviewIssueKindSchema = z.enum([
  "missing_requirement",
  "ambiguous_requirement",
  "conflicting_requirement",
  "recommended_improvement",
]);

export const requirementsReviewIssueSchema = z.object({
  id: z.string().min(1),
  severity: reviewIssueSeveritySchema,
  kind: reviewIssueKindSchema,
  section: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  recommendation: z.string().min(1),
  requires_user_decision: z.boolean(),
});

export const requirementsReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(requirementsReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export const reviewDecisionActionSchema = z.enum([
  "accept",
  "reject",
  "custom",
]);

export const reviewDecisionSchema = z.object({
  issue_id: z.string().min(1),
  action: reviewDecisionActionSchema,
  custom_text: z.string().optional(),
  resolved_at: z.string(),
});

export function mergeDiscoveryState(
  current: z.infer<typeof discoveryStateSchema>,
  updates: Partial<z.infer<typeof discoveryStateSchema>>,
) {
  const arrayKeys = [
    "target_users",
    "goals",
    "features",
    "roles",
    "business_rules",
    "constraints",
    "integrations",
    "technical_preferences",
    "security_requirements",
  ] as const;

  const merged = { ...current };

  if (updates.idea !== undefined && updates.idea !== "") {
    merged.idea = updates.idea;
  }

  for (const key of arrayKeys) {
    if (updates[key] !== undefined && updates[key]!.length > 0) {
      const existing = new Set(current[key]);
      const next = [...current[key]];
      for (const item of updates[key]!) {
        if (!existing.has(item)) {
          next.push(item);
        }
      }
      merged[key] = next;
    }
  }

  return discoveryStateSchema.parse(merged);
}
