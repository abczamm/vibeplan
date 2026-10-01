import { z } from "zod";

export const architectureModuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  responsibilities: z.array(z.string()),
  actors: z.array(z.string()),
});

export const architectureActorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  permissions: z.array(z.string()),
});

export const architectureEntityAttributeSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  unique: z.boolean().optional(),
});

export const architectureEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  attributes: z.array(architectureEntityAttributeSchema),
});

export const architectureRelationshipSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  type: z.enum(["one_to_one", "one_to_many", "many_to_many"]),
  description: z.string().optional(),
});

export const architectureLayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  responsibility: z.string().min(1),
  technologies: z.array(z.string()),
});

export const architectureTechnologyDecisionSchema = z.object({
  category: z.string().min(1),
  technology: z.string().min(1),
  rationale: z.string().min(1),
});

export const architectureDocumentSchema = z.object({
  overview: z.string().min(1),
  architectural_style: z.string().min(1),
  modules: z.array(architectureModuleSchema),
  actors: z.array(architectureActorSchema),
  entities: z.array(architectureEntitySchema),
  relationships: z.array(architectureRelationshipSchema),
  layers: z.array(architectureLayerSchema),
  technology_decisions: z.array(architectureTechnologyDecisionSchema),
  constraints: z.array(z.string()),
  security_considerations: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export const architectureReviewIssueKindSchema = z.enum([
  "requirement_mismatch",
  "missing_entity",
  "missing_actor",
  "missing_module",
  "invalid_relationship",
  "scope_expansion",
  "technology_issue",
  "security_issue",
  "layering_issue",
  "architecture_complexity",
  "missing_assumption",
  "ambiguous_decision",
  "recommended_improvement",
]);

export const architectureReviewSeveritySchema = z.enum(["important", "minor"]);

export const architectureReviewIssueSchema = z.object({
  id: z.string().min(1),
  severity: architectureReviewSeveritySchema,
  kind: architectureReviewIssueKindSchema,
  section: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().min(1),
  recommendation: z.string().min(1),
  requires_user_decision: z.boolean(),
});

export const architectureReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(architectureReviewIssueSchema),
  ready_for_approval: z.boolean(),
});
