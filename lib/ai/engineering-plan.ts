import { z } from "zod";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  AgentPackageDocument,
  DesignSystemDocument,
} from "./types";

/* ============================================
   ENGINEERING PLAN ZOD SCHEMAS & TYPES
   ============================================ */

export const phaseKindSchema = z.enum([
  "foundation",
  "database",
  "authentication",
  "authorization",
  "backend",
  "api",
  "frontend",
  "integration",
  "testing",
  "hardening",
]);

export const CANONICAL_PHASE_KINDS = [
  "foundation",
  "database",
  "authentication",
  "authorization",
  "backend",
  "api",
  "frontend",
  "integration",
  "testing",
  "hardening",
] as const;

export const taskPrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const engineeringTraceabilitySchema = z.object({
  requirement_ids: z.array(z.string()),
  architecture_module_ids: z.array(z.string()),
  erd_entity_ids: z.array(z.string()),
  dfd_process_ids: z.array(z.string()),
  flowchart_process_ids: z.array(z.string()),
  blueprint_module_ids: z.array(z.string()),
  agent_package_module_ids: z.array(z.string()),
  design_system_screen_ids: z.array(z.string()),
  design_system_component_ids: z.array(z.string()),
});

export const projectSummarySchema = z.object({
  project_name: z.string().min(1),
  overview: z.string().min(1),
  target_users: z.array(z.string()).min(1),
  primary_goals: z.array(z.string()).min(1),
});

export const engineeringPrincipleSchema = z.object({
  id: z.string().min(1),
  principle: z.string().min(1),
  description: z.string().min(1),
});

export const repositoryStrategySchema = z.object({
  branching_model: z.string().min(1),
  commit_conventions: z.string().min(1),
  review_process: z.string().min(1),
  release_strategy: z.string().min(1),
  structure_notes: z.array(z.string()),
});

export const technologyStackEntrySchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  technology: z.string().min(1),
  version: z.string().min(1),
  justification: z.string().min(1),
});

export const environmentVariableSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  secret: z.boolean(),
});

export const environmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string().min(1),
  variables: z.array(environmentVariableSchema),
});

export const environmentRequirementsSchema = z.object({
  environments: z.array(environmentSchema).min(1),
  local_setup: z.array(z.string()).min(1),
  ci_requirements: z.array(z.string()),
});

export const filePlanEntrySchema = z.object({
  path: z.string().min(1),
  purpose: z.string().min(1),
  module_id: z.string().min(1),
});

export const filePlanSchema = z.object({
  create: z.array(filePlanEntrySchema),
  modify: z.array(filePlanEntrySchema),
  preserve: z.array(filePlanEntrySchema),
});

export const directoryStructureSchema = z.object({
  file_plan: filePlanSchema,
  conventions: z.array(z.string()).min(1),
});

export const modulePlanSchema = z.object({
  module_id: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string().min(1),
  frontend_work: z.array(z.string()),
  backend_work: z.array(z.string()),
  database_work: z.array(z.string()),
  api_work: z.array(z.string()),
  auth_work: z.array(z.string()),
  validation_work: z.array(z.string()),
  testing_work: z.array(z.string()),
  dependencies: z.array(z.string()),
  implementation_order: z.number().int().min(1),
  traceability: engineeringTraceabilitySchema,
});

export const columnPlanSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  constraints: z.array(z.string()),
});

export const relationshipPlanSchema = z.object({
  from_column: z.string().min(1),
  to_table: z.string().min(1),
  to_column: z.string().min(1),
  type: z.string().min(1),
});

export const indexPlanSchema = z.object({
  name: z.string().min(1),
  columns: z.array(z.string()).min(1),
  unique: z.boolean(),
});

export const rlsPolicyPlanSchema = z.object({
  policy_name: z.string().min(1),
  mode: z.enum(["read", "write", "all"]),
  description: z.string().min(1),
});

export const tablePlanSchema = z.object({
  entity_id: z.string().min(1),
  table_name: z.string().min(1),
  purpose: z.string().min(1),
  columns: z.array(columnPlanSchema).min(1),
  relationships: z.array(relationshipPlanSchema),
  indexes: z.array(indexPlanSchema),
  constraints: z.array(z.string()),
  rls: z.array(rlsPolicyPlanSchema),
  assumption: z.string().optional(),
});

export const migrationPlanSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().min(1),
});

export const databaseImplementationSchema = z.object({
  tables: z.array(tablePlanSchema).min(1),
  migrations: z.array(migrationPlanSchema),
  seed_requirements: z.array(z.string()),
});

export const apiAuthorizationSchema = z.object({
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export const apiRequestPlanSchema = z.object({
  description: z.string().min(1),
  body_fields: z.array(z.string()),
  query_params: z.array(z.string()),
});

export const apiResponsePlanSchema = z.object({
  description: z.string().min(1),
  body_fields: z.array(z.string()),
});

export const apiErrorPlanSchema = z.object({
  status: z.number().int().min(400).max(599),
  condition: z.string().min(1),
  response_message: z.string().min(1),
});

export const apiTraceabilitySchema = z.object({
  requirement_ids: z.array(z.string()),
  architecture_module_ids: z.array(z.string()),
  blueprint_module_ids: z.array(z.string()),
});

export const apiImplementationPlanSchema = z.object({
  id: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().min(1),
  purpose: z.string().min(1),
  module_id: z.string().min(1),
  authentication_required: z.boolean(),
  authorization: apiAuthorizationSchema,
  request: apiRequestPlanSchema,
  response: apiResponsePlanSchema,
  validation: z.array(z.string()).min(1),
  errors: z.array(apiErrorPlanSchema).min(1),
  database_operations: z.array(z.string()),
  testing: z.array(z.string()).min(1),
  traceability: apiTraceabilitySchema,
});

export const sessionHandlingSchema = z.object({
  strategy: z.string().min(1),
  storage: z.string().min(1),
  expiration: z.string().min(1),
});

export const authenticationImplementationSchema = z.object({
  flow: z.string().min(1),
  session_handling: sessionHandlingSchema,
  mechanisms: z.array(z.string()).min(1),
  protected_routes: z.array(z.string()).min(1),
  public_routes: z.array(z.string()).min(1),
  implementation_notes: z.array(z.string()),
});

export const authorizedRoleSchema = z.object({
  role: z.string().min(1),
  permissions: z.array(z.string()),
  module_access: z.array(z.string()),
  source: z.string().min(1),
});

export const routeProtectionSchema = z.object({
  route: z.string().min(1),
  methods: z.array(z.string()).min(1),
  roles: z.array(z.string()).min(1),
});

export const authorizationImplementationSchema = z.object({
  roles: z.array(authorizedRoleSchema).min(1),
  route_protection: z.array(routeProtectionSchema).min(1),
  frontend_visibility: z.array(z.string()).min(1),
  server_enforcement: z.array(z.string()).min(1),
});

export const pageStatesSchema = z.object({
  loading: z.string().min(1),
  empty: z.string().min(1),
  error: z.string().min(1),
  success: z.string().min(1),
});

export const frontendPagePlanSchema = z.object({
  id: z.string().min(1),
  route: z.string().min(1),
  screen_id: z.string().min(1),
  purpose: z.string().min(1),
  components: z.array(z.string()).min(1),
  forms: z.array(z.string()),
  tables: z.array(z.string()),
  states: pageStatesSchema,
  responsive_behavior: z.string().min(1),
  accessibility: z.array(z.string()).min(1),
});

export const frontendImplementationSchema = z.object({
  pages: z.array(frontendPagePlanSchema).min(1),
  global_components: z.array(z.string()),
  navigation_notes: z.array(z.string()).min(1),
});

export const servicePlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string().min(1),
  module_id: z.string().min(1),
  responsibilities: z.array(z.string()).min(1),
});

export const dataAccessPlanSchema = z.object({
  id: z.string().min(1),
  table: z.string().min(1),
  operations: z.array(z.string()).min(1),
  service_id: z.string().min(1),
});

export const businessRulePlanSchema = z.object({
  id: z.string().min(1),
  rule: z.string().min(1),
  source_requirement_id: z.string().min(1),
  service_id: z.string().min(1),
});

export const transactionPlanSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  steps: z.array(z.string()).min(1),
});

export const backendImplementationSchema = z.object({
  services: z.array(servicePlanSchema).min(1),
  data_access: z.array(dataAccessPlanSchema).min(1),
  business_rules: z.array(businessRulePlanSchema),
  transactions: z.array(transactionPlanSchema),
  error_boundaries: z.array(z.string()).min(1),
});

export const validationLayerPlanSchema = z.object({
  id: z.string().min(1),
  target: z.string().min(1),
  rules: z.array(z.string()).min(1),
});

export const validationStrategySchema = z.object({
  client_side: z.array(validationLayerPlanSchema).min(1),
  server_side: z.array(validationLayerPlanSchema).min(1),
  shared_rules: z.array(z.string()).min(1),
});

export const errorCategoryPlanSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  http_status: z.number().int().min(400).max(599),
  user_message: z.string().min(1),
  logging: z.string().min(1),
});

export const retryPolicyPlanSchema = z.object({
  id: z.string().min(1),
  target: z.string().min(1),
  strategy: z.string().min(1),
});

export const errorHandlingSchema = z.object({
  categories: z.array(errorCategoryPlanSchema).min(1),
  retry_policies: z.array(retryPolicyPlanSchema).min(1),
  global_handlers: z.array(z.string()).min(1),
});

export const rlsStrategyEntrySchema = z.object({
  table: z.string().min(1),
  policies: z.array(z.string()).min(1),
});

export const securityImplementationSchema = z.object({
  secrets_handling: z.array(z.string()).min(1),
  input_sanitization: z.array(z.string()).min(1),
  rls_strategy: z.array(rlsStrategyEntrySchema),
  rate_limiting: z.array(z.string()),
  security_headers: z.array(z.string()).min(1),
  audit_logging: z.array(z.string()),
});

export const testLevelIdSchema = z.enum([
  "unit",
  "integration",
  "api",
  "auth",
  "rbac",
  "database_rls",
]);

export const REQUIRED_TEST_LEVELS: TestLevelId[] = [
  "unit",
  "integration",
  "api",
  "auth",
  "rbac",
  "database_rls",
];

export const testLevelPlanSchema = z.object({
  id: testLevelIdSchema,
  approach: z.string().min(1),
  tools: z.array(z.string()).min(1),
  scope: z.array(z.string()).min(1),
});

export const testingStrategySchema = z.object({
  levels: z.array(testLevelPlanSchema).min(1),
  coverage_expectations: z.array(z.string()).min(1),
  required_suites: z.array(z.string()).min(1),
});

export const implementationPhaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: phaseKindSchema,
  order: z.number().int().min(1),
  tasks: z.array(z.string()),
  dependencies: z.array(z.string()),
  completion_checks: z.array(z.string()).min(1),
});

export const implementationTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  phase: z.string().min(1),
  module_id: z.string().min(1),
  priority: taskPrioritySchema,
  implementation_order: z.number().int().min(1),
  dependencies: z.array(z.string()),
  files_to_create: z.array(z.string()),
  files_to_modify: z.array(z.string()),
  files_not_to_modify: z.array(z.string()),
  acceptance_criteria: z.array(z.string()).min(1),
  test_requirements: z.array(z.string()).min(1),
  traceability: engineeringTraceabilitySchema,
});

export const externalDependencySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["package", "service", "tool", "infrastructure", "team"]),
  name: z.string().min(1),
  version: z.string(),
  purpose: z.string().min(1),
  required_by: z.array(z.string()).min(1),
});

export const forbiddenChangeIdSchema = z.enum([
  "do_not_change_requirements",
  "do_not_change_architecture",
  "do_not_alter_erd",
  "do_not_alter_rbac",
  "do_not_expose_secrets",
  "do_not_disable_rls",
  "do_not_bypass_authentication",
  "do_not_remove_tests",
  "do_not_modify_unrelated_files",
  "do_not_rewrite_working_modules",
]);

export const REQUIRED_FORBIDDEN_CHANGES: ForbiddenChangeId[] = [
  "do_not_change_requirements",
  "do_not_change_architecture",
  "do_not_alter_erd",
  "do_not_alter_rbac",
  "do_not_expose_secrets",
  "do_not_disable_rls",
  "do_not_bypass_authentication",
  "do_not_remove_tests",
  "do_not_modify_unrelated_files",
  "do_not_rewrite_working_modules",
];

export const forbiddenChangeSchema = z.object({
  id: forbiddenChangeIdSchema,
  rule: z.string().min(1),
  rationale: z.string().min(1),
});

export const completionCheckIdSchema = z.enum([
  "typecheck",
  "lint",
  "build",
  "unit_tests",
  "integration_tests",
  "api_tests",
  "auth_tests",
  "rbac_tests",
  "database_rls_tests",
  "security_checks",
  "responsive_checks",
  "accessibility_checks",
]);

export const REQUIRED_COMPLETION_CHECKS: CompletionCheckId[] = [
  "typecheck",
  "lint",
  "build",
  "unit_tests",
  "integration_tests",
  "api_tests",
  "auth_tests",
  "rbac_tests",
  "database_rls_tests",
  "security_checks",
  "responsive_checks",
  "accessibility_checks",
];

export const completionCheckSchema = z.object({
  id: completionCheckIdSchema,
  description: z.string().min(1),
  command: z.string().min(1),
  blocking: z.boolean(),
});

export const stopTriggerIdSchema = z.enum([
  "requirement_conflict",
  "architecture_conflict",
  "erd_conflict",
  "missing_api_contract",
  "missing_permission",
  "missing_security_decision",
  "missing_design_decision",
  "ambiguous_business_rule",
  "destructive_change",
  "unexpected_repository_state",
]);

export const REQUIRED_STOP_TRIGGERS: StopTriggerId[] = [
  "requirement_conflict",
  "architecture_conflict",
  "erd_conflict",
  "missing_api_contract",
  "missing_permission",
  "missing_security_decision",
  "missing_design_decision",
  "ambiguous_business_rule",
  "destructive_change",
  "unexpected_repository_state",
];

export const stopTriggerSchema = z.object({
  id: stopTriggerIdSchema,
  trigger: z.string().min(1),
  action: z.string().min(1),
});

export const uncertaintyProtocolSchema = z.object({
  protocol: z.string().min(1),
  stop_triggers: z.array(stopTriggerSchema),
});

export const taskTraceabilityEntrySchema = engineeringTraceabilitySchema.extend({
  task_id: z.string().min(1),
});

export const engineeringTraceabilityRollupSchema = z.object({
  tasks: z.array(taskTraceabilityEntrySchema).min(1),
});

export const engineeringPlanMetadataSchema = z.object({
  source_of_truth: z.literal("engineering-plan"),
  requirements_document_id: z.string(),
  architecture_document_id: z.string(),
  erd_document_id: z.string(),
  dfd_document_id: z.string(),
  flowchart_document_id: z.string(),
  blueprint_document_id: z.string(),
  agent_package_document_id: z.string(),
  design_system_document_id: z.string(),
  generated_at: z.string().optional(),
});

export const engineeringPlanDocumentSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  project_summary: projectSummarySchema,
  engineering_principles: z.array(engineeringPrincipleSchema).min(1),
  repository_strategy: repositoryStrategySchema,
  technology_stack: z.array(technologyStackEntrySchema).min(1),
  environment_requirements: environmentRequirementsSchema,
  directory_structure: directoryStructureSchema,
  modules: z.array(modulePlanSchema).min(1),
  database_implementation: databaseImplementationSchema,
  api_implementation: z.array(apiImplementationPlanSchema).min(1),
  authentication_implementation: authenticationImplementationSchema,
  authorization_implementation: authorizationImplementationSchema,
  frontend_implementation: frontendImplementationSchema,
  backend_implementation: backendImplementationSchema,
  validation_strategy: validationStrategySchema,
  error_handling: errorHandlingSchema,
  security_implementation: securityImplementationSchema,
  testing_strategy: testingStrategySchema,
  implementation_phases: z.array(implementationPhaseSchema).min(1),
  implementation_tasks: z.array(implementationTaskSchema).min(1),
  dependencies: z.array(externalDependencySchema),
  forbidden_changes: z.array(forbiddenChangeSchema),
  completion_checks: z.array(completionCheckSchema),
  uncertainty_protocol: uncertaintyProtocolSchema,
  traceability: engineeringTraceabilityRollupSchema,
  _metadata: engineeringPlanMetadataSchema,
});

export type PhaseKind = z.infer<typeof phaseKindSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type EngineeringTraceability = z.infer<typeof engineeringTraceabilitySchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type EngineeringPrinciple = z.infer<typeof engineeringPrincipleSchema>;
export type RepositoryStrategy = z.infer<typeof repositoryStrategySchema>;
export type TechnologyStackEntry = z.infer<typeof technologyStackEntrySchema>;
export type EnvironmentVariable = z.infer<typeof environmentVariableSchema>;
export type EnvironmentPlan = z.infer<typeof environmentSchema>;
export type EnvironmentRequirements = z.infer<typeof environmentRequirementsSchema>;
export type FilePlanEntry = z.infer<typeof filePlanEntrySchema>;
export type FilePlan = z.infer<typeof filePlanSchema>;
export type DirectoryStructure = z.infer<typeof directoryStructureSchema>;
export type ModulePlan = z.infer<typeof modulePlanSchema>;
export type TablePlan = z.infer<typeof tablePlanSchema>;
export type MigrationPlan = z.infer<typeof migrationPlanSchema>;
export type DatabaseImplementation = z.infer<typeof databaseImplementationSchema>;
export type ApiImplementationPlan = z.infer<typeof apiImplementationPlanSchema>;
export type AuthenticationImplementation = z.infer<typeof authenticationImplementationSchema>;
export type AuthorizedRole = z.infer<typeof authorizedRoleSchema>;
export type RouteProtection = z.infer<typeof routeProtectionSchema>;
export type AuthorizationImplementation = z.infer<typeof authorizationImplementationSchema>;
export type FrontendPagePlan = z.infer<typeof frontendPagePlanSchema>;
export type FrontendImplementation = z.infer<typeof frontendImplementationSchema>;
export type ServicePlan = z.infer<typeof servicePlanSchema>;
export type BackendImplementation = z.infer<typeof backendImplementationSchema>;
export type ValidationStrategy = z.infer<typeof validationStrategySchema>;
export type ErrorHandling = z.infer<typeof errorHandlingSchema>;
export type SecurityImplementation = z.infer<typeof securityImplementationSchema>;
export type TestLevelId = z.infer<typeof testLevelIdSchema>;
export type TestingStrategy = z.infer<typeof testingStrategySchema>;
export type ImplementationPhase = z.infer<typeof implementationPhaseSchema>;
export type ImplementationTask = z.infer<typeof implementationTaskSchema>;
export type ExternalDependency = z.infer<typeof externalDependencySchema>;
export type ForbiddenChangeId = z.infer<typeof forbiddenChangeIdSchema>;
export type ForbiddenChange = z.infer<typeof forbiddenChangeSchema>;
export type CompletionCheckId = z.infer<typeof completionCheckIdSchema>;
export type CompletionCheck = z.infer<typeof completionCheckSchema>;
export type StopTriggerId = z.infer<typeof stopTriggerIdSchema>;
export type StopTrigger = z.infer<typeof stopTriggerSchema>;
export type UncertaintyProtocol = z.infer<typeof uncertaintyProtocolSchema>;
export type EngineeringPlanDocument = z.infer<typeof engineeringPlanDocumentSchema>;

/* ============================================
   ENGINEERING PLAN REVIEW SCHEMAS & TYPES
   ============================================ */

export const engineeringReviewSeveritySchema = z.enum([
  "critical",
  "important",
  "minor",
]);

export const engineeringReviewCategorySchema = z.enum([
  "requirements_alignment",
  "architecture_alignment",
  "database_alignment",
  "api_alignment",
  "security",
  "authentication",
  "authorization",
  "design_system_alignment",
  "implementation_feasibility",
  "dependency_order",
  "testing",
  "traceability",
  "complexity",
  "uncertainty",
]);

export const engineeringReviewIssueSchema = z.object({
  id: z.string().min(1),
  severity: engineeringReviewSeveritySchema,
  category: engineeringReviewCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().min(1),
  suggested_resolution: z.string().min(1),
  source_references: z.array(z.string()),
});

export const engineeringReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(engineeringReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export const engineeringReviewDecisionActionSchema = z.enum([
  "accept",
  "ignore",
  "custom",
]);

export const engineeringReviewDecisionSchema = z
  .object({
    issue_id: z.string().min(1),
    decision: engineeringReviewDecisionActionSchema,
    rationale: z.string().optional(),
    resolved_at: z.string().min(1),
  })
  .superRefine((val, ctx) => {
    if (val.decision === "custom" && !val.rationale?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "A custom decision requires a non-empty rationale.",
        path: ["rationale"],
      });
    }
  });

export type EngineeringReviewSeverity = z.infer<typeof engineeringReviewSeveritySchema>;
export type EngineeringReviewCategory = z.infer<typeof engineeringReviewCategorySchema>;
export type EngineeringReviewIssue = z.infer<typeof engineeringReviewIssueSchema>;
export type EngineeringReview = z.infer<typeof engineeringReviewSchema>;
export type EngineeringReviewDecisionAction = z.infer<
  typeof engineeringReviewDecisionActionSchema
>;
export type EngineeringReviewDecision = z.infer<typeof engineeringReviewDecisionSchema>;

/* ============================================
   UPSTREAM CONTEXT & DETERMINISTIC VALIDATOR
   ============================================ */

export type EngineeringPlanUpstreamContext = {
  requirements: RequirementsDraft;
  architecture: ArchitectureDocument;
  erd: ERDDocument;
  dfd: DFDDocument;
  flowchart: FlowchartDocument;
  blueprint: ImplementationBlueprint;
  agentPackage: AgentPackageDocument;
  designSystem: DesignSystemDocument;
};

export type EngineeringValidationCategory =
  | "metadata"
  | "identity"
  | "modules"
  | "tasks"
  | "dependency_graph"
  | "implementation_order"
  | "file_plan"
  | "api"
  | "database"
  | "auth"
  | "traceability"
  | "uncertainty"
  | "forbidden"
  | "completion"
  | "security";

export type EngineeringValidationIssue = {
  id: string;
  severity: "error" | "warning";
  category: EngineeringValidationCategory;
  title: string;
  description: string;
  item_id?: string;
};

export type EngineeringValidationResult = {
  valid: boolean;
  issues: EngineeringValidationIssue[];
};

function pushIssue(
  issues: EngineeringValidationIssue[],
  issue: EngineeringValidationIssue,
) {
  issues.push(issue);
}

function checkDuplicates(
  items: { id: string }[],
  kind: string,
  issues: EngineeringValidationIssue[],
  title: string,
  category: EngineeringValidationCategory,
) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      pushIssue(issues, {
        id: `dup-${kind}-${item.id}`,
        severity: "error",
        category,
        title,
        description: `Duplicate ${kind} id '${item.id}' detected.`,
        item_id: item.id,
      });
    }
    seen.add(item.id);
  }
}

function detectCycle(
  nodeIds: string[],
  edgesOf: (id: string) => string[],
): string | null {
  const state = new Map<string, 0 | 1 | 2>();
  let cycle: string | null = null;

  const visit = (id: string): boolean => {
    const s = state.get(id) ?? 0;
    if (s === 1) {
      cycle = id;
      return true;
    }
    if (s === 2) return false;
    state.set(id, 1);
    for (const next of edgesOf(id)) {
      if (state.get(next) === undefined && !nodeIds.includes(next)) continue;
      if (visit(next)) return true;
    }
    state.set(id, 2);
    return false;
  };

  for (const id of nodeIds) {
    if ((state.get(id) ?? 0) === 0 && visit(id)) return cycle;
  }
  return null;
}

/**
 * Deterministic validator for Engineering Plan documents.
 * Structural checks always run; upstream reference checks run when context is given.
 */
export function validateEngineeringPlanDocument(
  plan: EngineeringPlanDocument,
  context?: EngineeringPlanUpstreamContext,
): EngineeringValidationResult {
  const issues: EngineeringValidationIssue[] = [];

  // --- 1. METADATA ---
  if (plan._metadata.source_of_truth !== "engineering-plan") {
    pushIssue(issues, {
      id: "invalid-metadata-source",
      severity: "error",
      category: "metadata",
      title: "Invalid Metadata Source Of Truth",
      description: "Metadata source_of_truth must be exactly 'engineering-plan'.",
    });
  }
  const metadataIds: [string, string][] = [
    ["requirements", plan._metadata.requirements_document_id],
    ["architecture", plan._metadata.architecture_document_id],
    ["erd", plan._metadata.erd_document_id],
    ["dfd", plan._metadata.dfd_document_id],
    ["flowchart", plan._metadata.flowchart_document_id],
    ["blueprint", plan._metadata.blueprint_document_id],
    ["agent_package", plan._metadata.agent_package_document_id],
    ["design_system", plan._metadata.design_system_document_id],
  ];
  for (const [name, id] of metadataIds) {
    if (!id || !id.trim()) {
      pushIssue(issues, {
        id: `empty-metadata-${name}`,
        severity: "error",
        category: "metadata",
        title: "Empty Metadata Source ID",
        description: `Metadata ${name} document id must not be empty.`,
      });
    }
  }

  // --- 2. DUPLICATE IDS ---
  checkDuplicates(
    plan.modules.map((m) => ({ id: m.module_id })),
    "module",
    issues,
    "Duplicate Module ID",
    "identity",
  );
  checkDuplicates(plan.implementation_tasks, "task", issues, "Duplicate Task ID", "identity");
  checkDuplicates(plan.implementation_phases, "phase", issues, "Duplicate Phase ID", "identity");
  checkDuplicates(plan.api_implementation, "api", issues, "Duplicate API ID", "identity");
  checkDuplicates(plan.engineering_principles, "principle", issues, "Duplicate Principle ID", "identity");
  checkDuplicates(plan.technology_stack, "stack", issues, "Duplicate Stack Entry ID", "identity");
  checkDuplicates(plan.backend_implementation.services, "service", issues, "Duplicate Service ID", "identity");
  checkDuplicates(plan.backend_implementation.data_access, "data-access", issues, "Duplicate Data Access ID", "identity");
  checkDuplicates(plan.dependencies, "external-dependency", issues, "Duplicate External Dependency ID", "identity");
  checkDuplicates(plan.environment_requirements.environments, "environment", issues, "Duplicate Environment ID", "identity");
  checkDuplicates(plan.implementation_tasks.map((t) => ({ id: String(t.implementation_order) })), "task-order", issues, "Duplicate Task Implementation Order", "implementation_order");
  checkDuplicates(plan.implementation_phases.map((p) => ({ id: String(p.order) })), "phase-order", issues, "Duplicate Phase Order", "implementation_order");

  const phaseKindSeen = new Set<string>();
  for (const phase of plan.implementation_phases) {
    if (phaseKindSeen.has(phase.kind)) {
      pushIssue(issues, {
        id: `duplicate-phase-kind-${phase.kind}`,
        severity: "error",
        category: "identity",
        title: "Duplicate Phase Kind",
        description: `Phase kind '${phase.kind}' is declared more than once.`,
        item_id: phase.id,
      });
    }
    phaseKindSeen.add(phase.kind);
  }

  const tableNames = new Set<string>();
  for (const table of plan.database_implementation.tables) {
    if (tableNames.has(table.table_name)) {
      pushIssue(issues, {
        id: `dup-table-${table.table_name}`,
        severity: "error",
        category: "identity",
        title: "Duplicate Table Name",
        description: `Table '${table.table_name}' is defined more than once.`,
        item_id: table.table_name,
      });
    }
    tableNames.add(table.table_name);
  }

  const filePathLists: [string, string[]][] = [
    ["create", plan.directory_structure.file_plan.create.map((f) => f.path)],
    ["modify", plan.directory_structure.file_plan.modify.map((f) => f.path)],
    ["preserve", plan.directory_structure.file_plan.preserve.map((f) => f.path)],
  ];
  for (const [listName, paths] of filePathLists) {
    const seen = new Set<string>();
    for (const p of paths) {
      if (seen.has(p)) {
        pushIssue(issues, {
          id: `dup-file-${listName}-${p}`,
          severity: "error",
          category: "file_plan",
          title: "Duplicate File Plan Entry",
          description: `Path '${p}' appears more than once in the ${listName} list.`,
          item_id: p,
        });
      }
      seen.add(p);
    }
  }
  const createSet = new Set(plan.directory_structure.file_plan.create.map((f) => f.path));
  const modifySet = new Set(plan.directory_structure.file_plan.modify.map((f) => f.path));
  const preserveSet = new Set(plan.directory_structure.file_plan.preserve.map((f) => f.path));
  for (const p of createSet) {
    if (modifySet.has(p)) {
      pushIssue(issues, {
        id: `file-create-modify-conflict-${p}`,
        severity: "error",
        category: "file_plan",
        title: "File Plan Conflict",
        description: `Path '${p}' cannot be both created and modified.`,
        item_id: p,
      });
    }
    if (preserveSet.has(p)) {
      pushIssue(issues, {
        id: `file-create-preserve-conflict-${p}`,
        severity: "error",
        category: "file_plan",
        title: "File Plan Conflict",
        description: `Path '${p}' cannot be both created and preserved.`,
        item_id: p,
      });
    }
  }
  for (const p of modifySet) {
    if (preserveSet.has(p)) {
      pushIssue(issues, {
        id: `file-modify-preserve-conflict-${p}`,
        severity: "error",
        category: "file_plan",
        title: "File Plan Conflict",
        description: `Path '${p}' cannot be both modified and preserved.`,
        item_id: p,
      });
    }
  }

  // --- 3. PHASE SET & ORDER ---
  const phaseById = new Map(plan.implementation_phases.map((p) => [p.id, p]));
  const phaseIds = plan.implementation_phases.map((p) => p.id);
  for (const kind of CANONICAL_PHASE_KINDS) {
    if (!phaseKindSeen.has(kind)) {
      pushIssue(issues, {
        id: `missing-phase-${kind}`,
        severity: "error",
        category: "implementation_order",
        title: "Missing Canonical Phase",
        description: `Required implementation phase '${kind}' is missing.`,
      });
    }
  }
  for (const phase of plan.implementation_phases) {
    for (const dep of phase.dependencies) {
      if (!phaseById.has(dep)) {
        pushIssue(issues, {
          id: `unknown-phase-dependency-${phase.id}-${dep}`,
          severity: "error",
          category: "dependency_graph",
          title: "Unknown Phase Dependency",
          description: `Phase '${phase.id}' depends on unknown phase '${dep}'.`,
          item_id: phase.id,
        });
      }
      if (dep === phase.id) {
        pushIssue(issues, {
          id: `self-phase-dependency-${phase.id}`,
          severity: "error",
          category: "dependency_graph",
          title: "Self Phase Dependency",
          description: `Phase '${phase.id}' depends on itself.`,
          item_id: phase.id,
        });
      }
    }
    if (phase.order !== 1 && phase.dependencies.length === 0) {
      pushIssue(issues, {
        id: `phase-missing-prerequisite-${phase.id}`,
        severity: "error",
        category: "implementation_order",
        title: "Phase Missing Prerequisite",
        description: `Phase '${phase.id}' (order ${phase.order}) must declare at least one prerequisite phase.`,
        item_id: phase.id,
      });
    }
  }
  const phaseCycle = detectCycle(
    phaseIds,
    (id) => phaseById.get(id)?.dependencies ?? [],
  );
  if (phaseCycle) {
    pushIssue(issues, {
      id: `circular-phase-dependency-${phaseCycle}`,
      severity: "error",
      category: "dependency_graph",
      title: "Circular Phase Dependency",
      description: `Circular dependency detected in phase graph near '${phaseCycle}'.`,
      item_id: phaseCycle,
    });
  }

  // --- 4. MODULES ---
  const moduleIds = new Set(plan.modules.map((m) => m.module_id));
  const moduleById = new Map(plan.modules.map((m) => [m.module_id, m]));
  for (const mod of plan.modules) {
    if (mod.dependencies.includes(mod.module_id)) {
      pushIssue(issues, {
        id: `self-module-dependency-${mod.module_id}`,
        severity: "error",
        category: "dependency_graph",
        title: "Self Module Dependency",
        description: `Module '${mod.module_id}' depends on itself.`,
        item_id: mod.module_id,
      });
    }
    for (const dep of mod.dependencies) {
      if (!moduleIds.has(dep)) {
        pushIssue(issues, {
          id: `unknown-module-dependency-${mod.module_id}-${dep}`,
          severity: "error",
          category: "dependency_graph",
          title: "Unknown Module Dependency",
          description: `Module '${mod.module_id}' depends on unknown module '${dep}'.`,
          item_id: mod.module_id,
        });
      }
    }
    if (mod.traceability.blueprint_module_ids.length === 0) {
      pushIssue(issues, {
        id: `module-no-blueprint-source-${mod.module_id}`,
        severity: "error",
        category: "traceability",
        title: "Module Without Blueprint Source",
        description: `Module '${mod.module_id}' must trace to at least one approved blueprint module.`,
        item_id: mod.module_id,
      });
    }
  }
  const moduleCycle = detectCycle(
    [...moduleIds],
    (id) => moduleById.get(id)?.dependencies ?? [],
  );
  if (moduleCycle) {
    pushIssue(issues, {
      id: `circular-module-dependency-${moduleCycle}`,
      severity: "error",
      category: "dependency_graph",
      title: "Circular Module Dependency",
      description: `Circular dependency detected in module graph near '${moduleCycle}'.`,
      item_id: moduleCycle,
    });
  }

  // --- 5. FILE PLAN MODULE REFERENCES ---
  for (const entry of [
    ...plan.directory_structure.file_plan.create,
    ...plan.directory_structure.file_plan.modify,
    ...plan.directory_structure.file_plan.preserve,
  ]) {
    if (!moduleIds.has(entry.module_id)) {
      pushIssue(issues, {
        id: `file-unknown-module-${entry.path}`,
        severity: "error",
        category: "file_plan",
        title: "File Plan References Unknown Module",
        description: `File '${entry.path}' references unknown module '${entry.module_id}'.`,
        item_id: entry.path,
      });
    }
  }

  // --- 6. TASKS ---
  const taskById = new Map(plan.implementation_tasks.map((t) => [t.id, t]));
  const taskIds = plan.implementation_tasks.map((t) => t.id);
  const phaseTasks = new Map<string, string[]>();
  for (const phase of plan.implementation_phases) {
    phaseTasks.set(phase.id, phase.tasks);
  }

  for (const task of plan.implementation_tasks) {
    if (!phaseById.has(task.phase)) {
      pushIssue(issues, {
        id: `task-unknown-phase-${task.id}`,
        severity: "error",
        category: "tasks",
        title: "Task References Unknown Phase",
        description: `Task '${task.id}' references unknown phase '${task.phase}'.`,
        item_id: task.id,
      });
    } else if (!phaseTasks.get(task.phase)!.includes(task.id)) {
      pushIssue(issues, {
        id: `task-not-listed-in-phase-${task.id}`,
        severity: "error",
        category: "tasks",
        title: "Task Not Listed In Its Phase",
        description: `Task '${task.id}' declares phase '${task.phase}' but is not listed in that phase's tasks.`,
        item_id: task.id,
      });
    }
    if (!moduleIds.has(task.module_id)) {
      pushIssue(issues, {
        id: `task-unknown-module-${task.id}`,
        severity: "error",
        category: "modules",
        title: "Task References Unknown Module",
        description: `Task '${task.id}' references unknown module '${task.module_id}'.`,
        item_id: task.id,
      });
    }
    if (task.dependencies.includes(task.id)) {
      pushIssue(issues, {
        id: `self-task-dependency-${task.id}`,
        severity: "error",
        category: "dependency_graph",
        title: "Self Task Dependency",
        description: `Task '${task.id}' depends on itself.`,
        item_id: task.id,
      });
    }
    for (const dep of task.dependencies) {
      if (dep === task.id) continue;
      const depTask = taskById.get(dep);
      if (!depTask) {
        pushIssue(issues, {
          id: `unknown-task-dependency-${task.id}-${dep}`,
          severity: "error",
          category: "dependency_graph",
          title: "Unknown Task Dependency",
          description: `Task '${task.id}' depends on unknown task '${dep}'.`,
          item_id: task.id,
        });
        continue;
      }
      if (depTask.implementation_order >= task.implementation_order) {
        pushIssue(issues, {
          id: `dependency-after-dependent-${task.id}-${dep}`,
          severity: "error",
          category: "implementation_order",
          title: "Dependency Executes After Dependent Task",
          description: `Task '${task.id}' (order ${task.implementation_order}) depends on '${dep}' which runs at order ${depTask.implementation_order}.`,
          item_id: task.id,
        });
      }
    }

    // File plan consistency
    for (const f of task.files_to_create) {
      if (!createSet.has(f)) {
        pushIssue(issues, {
          id: `task-create-not-in-plan-${task.id}-${f}`,
          severity: "error",
          category: "file_plan",
          title: "Task Creates File Missing From File Plan",
          description: `Task '${task.id}' creates '${f}' which is not in the directory structure create plan.`,
          item_id: task.id,
        });
      }
    }
    for (const f of task.files_to_modify) {
      if (!modifySet.has(f)) {
        pushIssue(issues, {
          id: `task-modify-not-in-plan-${task.id}-${f}`,
          severity: "error",
          category: "file_plan",
          title: "Task Modifies File Missing From File Plan",
          description: `Task '${task.id}' modifies '${f}' which is not in the directory structure modify plan.`,
          item_id: task.id,
        });
      }
    }
    for (const f of task.files_not_to_modify) {
      if (createSet.has(f) || modifySet.has(f)) {
        pushIssue(issues, {
          id: `task-preserve-conflict-${task.id}-${f}`,
          severity: "error",
          category: "file_plan",
          title: "Task Preservation Conflicts With File Plan",
          description: `Task '${task.id}' forbids modifying '${f}' but the file plan changes it.`,
          item_id: task.id,
        });
      }
    }

    // Traceability emptiness
    const totalRefs =
      task.traceability.requirement_ids.length +
      task.traceability.architecture_module_ids.length +
      task.traceability.erd_entity_ids.length +
      task.traceability.dfd_process_ids.length +
      task.traceability.flowchart_process_ids.length +
      task.traceability.blueprint_module_ids.length +
      task.traceability.agent_package_module_ids.length +
      task.traceability.design_system_screen_ids.length +
      task.traceability.design_system_component_ids.length;
    if (totalRefs === 0) {
      pushIssue(issues, {
        id: `empty-task-traceability-${task.id}`,
        severity: "error",
        category: "traceability",
        title: "Task Without Traceability",
        description: `Task '${task.id}' has no upstream traceability references.`,
        item_id: task.id,
      });
    }
  }

  const taskCycle = detectCycle(
    taskIds,
    (id) => taskById.get(id)?.dependencies ?? [],
  );
  if (taskCycle) {
    pushIssue(issues, {
      id: `circular-task-dependency-${taskCycle}`,
      severity: "error",
      category: "dependency_graph",
      title: "Circular Task Dependency",
      description: `Circular dependency detected in task graph near '${taskCycle}'.`,
      item_id: taskCycle,
    });
  }

  for (const phase of plan.implementation_phases) {
    for (const t of phase.tasks) {
      if (!taskById.has(t)) {
        pushIssue(issues, {
          id: `phase-unknown-task-${phase.id}-${t}`,
          severity: "error",
          category: "tasks",
          title: "Phase References Unknown Task",
          description: `Phase '${phase.id}' lists unknown task '${t}'.`,
          item_id: phase.id,
        });
      }
    }
  }

  // --- 7. EXTERNAL DEPENDENCIES ---
  for (const dep of plan.dependencies) {
    for (const t of dep.required_by) {
      if (!taskById.has(t)) {
        pushIssue(issues, {
          id: `external-dependency-unknown-task-${dep.id}-${t}`,
          severity: "error",
          category: "dependency_graph",
          title: "External Dependency References Unknown Task",
          description: `External dependency '${dep.id}' is required by unknown task '${t}'.`,
          item_id: dep.id,
        });
      }
    }
  }

  // --- 8. DATABASE ---
  for (const table of plan.database_implementation.tables) {
    for (const rel of table.relationships) {
      if (!tableNames.has(rel.to_table)) {
        pushIssue(issues, {
          id: `unknown-related-table-${table.table_name}-${rel.to_table}`,
          severity: "error",
          category: "database",
          title: "Relationship References Unknown Table",
          description: `Table '${table.table_name}' references unknown related table '${rel.to_table}'.`,
          item_id: table.table_name,
        });
      }
    }
  }
  for (const rls of plan.security_implementation.rls_strategy) {
    if (!tableNames.has(rls.table)) {
      pushIssue(issues, {
        id: `rls-unknown-table-${rls.table}`,
        severity: "error",
        category: "security",
        title: "RLS Strategy References Unknown Table",
        description: `RLS strategy targets table '${rls.table}' which is not part of the database implementation.`,
        item_id: rls.table,
      });
    }
  }
  const rlsCovered = new Set(plan.security_implementation.rls_strategy.map((r) => r.table));
  for (const table of plan.database_implementation.tables) {
    const needsRls =
      table.rls.length > 0 ||
      table.columns.some((c) =>
        c.constraints.some((x) => /row level|rls/i.test(x)),
      );
    if (needsRls && !rlsCovered.has(table.table_name)) {
      pushIssue(issues, {
        id: `missing-rls-strategy-${table.table_name}`,
        severity: "error",
        category: "security",
        title: "Missing RLS Strategy",
        description: `Table '${table.table_name}' requires RLS but has no security strategy entry.`,
        item_id: table.table_name,
      });
    }
  }

  // --- 9. SECURITY MINIMUMS ---
  if (plan.security_implementation.secrets_handling.length === 0) {
    pushIssue(issues, {
      id: "missing-secrets-handling",
      severity: "error",
      category: "security",
      title: "Missing Secrets Handling",
      description: "Security implementation must define secrets handling rules.",
    });
  }
  if (plan.security_implementation.input_sanitization.length === 0) {
    pushIssue(issues, {
      id: "missing-input-sanitization",
      severity: "error",
      category: "security",
      title: "Missing Input Sanitization",
      description: "Security implementation must define input sanitization rules.",
    });
  }

  // --- 10. API ---
  for (const api of plan.api_implementation) {
    if (!moduleIds.has(api.module_id)) {
      pushIssue(issues, {
        id: `api-unknown-module-${api.id}`,
        severity: "error",
        category: "modules",
        title: "API References Unknown Module",
        description: `API '${api.id}' references unknown module '${api.module_id}'.`,
        item_id: api.id,
      });
    }
    const apiTotalRefs =
      api.traceability.requirement_ids.length +
      api.traceability.architecture_module_ids.length +
      api.traceability.blueprint_module_ids.length;
    if (apiTotalRefs === 0) {
      pushIssue(issues, {
        id: `empty-api-traceability-${api.id}`,
        severity: "error",
        category: "traceability",
        title: "API Without Traceability",
        description: `API '${api.id}' has no upstream traceability references.`,
        item_id: api.id,
      });
    }
  }

  // --- 11. AUTH / RBAC ---
  for (const role of plan.authorization_implementation.roles) {
    if (!role.source.trim()) {
      pushIssue(issues, {
        id: `role-no-source-${role.role}`,
        severity: "error",
        category: "auth",
        title: "Role Without Source",
        description: `Role '${role.role}' must declare its upstream source.`,
        item_id: role.role,
      });
    }
  }
  for (const prot of plan.authorization_implementation.route_protection) {
    if (!prot.route.startsWith("/")) {
      pushIssue(issues, {
        id: `invalid-protected-route-${prot.route}`,
        severity: "error",
        category: "auth",
        title: "Invalid Protected Route",
        description: `Protected route '${prot.route}' must be an absolute path.`,
        item_id: prot.route,
      });
    }
    if (prot.roles.length === 0) {
      pushIssue(issues, {
        id: `protected-route-no-roles-${prot.route}`,
        severity: "error",
        category: "auth",
        title: "Protected Route Without Roles",
        description: `Protected route '${prot.route}' has no roles defined.`,
        item_id: prot.route,
      });
    }
  }

  // --- 12. BACKEND ---
  const serviceIds = new Set(plan.backend_implementation.services.map((s) => s.id));
  for (const da of plan.backend_implementation.data_access) {
    if (!tableNames.has(da.table)) {
      pushIssue(issues, {
        id: `data-access-unknown-table-${da.id}`,
        severity: "error",
        category: "database",
        title: "Data Access References Unknown Table",
        description: `Data access '${da.id}' targets table '${da.table}' which is not part of the database implementation.`,
        item_id: da.id,
      });
    }
    if (!serviceIds.has(da.service_id)) {
      pushIssue(issues, {
        id: `data-access-unknown-service-${da.id}`,
        severity: "error",
        category: "modules",
        title: "Data Access References Unknown Service",
        description: `Data access '${da.id}' references unknown service '${da.service_id}'.`,
        item_id: da.id,
      });
    }
  }
  for (const svc of plan.backend_implementation.services) {
    if (!moduleIds.has(svc.module_id)) {
      pushIssue(issues, {
        id: `service-unknown-module-${svc.id}`,
        severity: "error",
        category: "modules",
        title: "Service References Unknown Module",
        description: `Service '${svc.id}' references unknown module '${svc.module_id}'.`,
        item_id: svc.id,
      });
    }
  }
  for (const rule of plan.backend_implementation.business_rules) {
    if (!serviceIds.has(rule.service_id)) {
      pushIssue(issues, {
        id: `business-rule-unknown-service-${rule.id}`,
        severity: "error",
        category: "modules",
        title: "Business Rule References Unknown Service",
        description: `Business rule '${rule.id}' references unknown service '${rule.service_id}'.`,
        item_id: rule.id,
      });
    }
  }

  // --- 13. TESTING STRATEGY ---
  const levelSeen = new Set(plan.testing_strategy.levels.map((l) => l.id));
  for (const level of REQUIRED_TEST_LEVELS) {
    if (!levelSeen.has(level)) {
      pushIssue(issues, {
        id: `missing-test-level-${level}`,
        severity: "error",
        category: "completion",
        title: "Missing Test Level",
        description: `Testing strategy must define the '${level}' test level.`,
      });
    }
  }

  // --- 14. UNCERTAINTY PROTOCOL ---
  if (!/\bSTOP\b/i.test(plan.uncertainty_protocol.protocol)) {
    pushIssue(issues, {
      id: "uncertainty-protocol-missing-stop",
      severity: "error",
      category: "uncertainty",
      title: "Uncertainty Protocol Missing STOP Directive",
      description: "Uncertainty protocol must instruct the agent to STOP when uncertain.",
    });
  }
  const triggerSeen = new Set(plan.uncertainty_protocol.stop_triggers.map((t) => t.id));
  for (const id of REQUIRED_STOP_TRIGGERS) {
    if (!triggerSeen.has(id)) {
      pushIssue(issues, {
        id: `missing-stop-trigger-${id}`,
        severity: "error",
        category: "uncertainty",
        title: "Missing STOP Trigger",
        description: `Uncertainty protocol is missing the '${id}' stop trigger.`,
      });
    }
  }

  // --- 15. FORBIDDEN CHANGES ---
  const forbiddenSeen = new Set(plan.forbidden_changes.map((f) => f.id));
  for (const id of REQUIRED_FORBIDDEN_CHANGES) {
    if (!forbiddenSeen.has(id)) {
      pushIssue(issues, {
        id: `missing-forbidden-change-${id}`,
        severity: "error",
        category: "forbidden",
        title: "Missing Forbidden Change Rule",
        description: `Forbidden changes must include the '${id}' rule.`,
      });
    }
  }

  // --- 16. COMPLETION CHECKS ---
  const checkSeen = new Set(plan.completion_checks.map((c) => c.id));
  for (const id of REQUIRED_COMPLETION_CHECKS) {
    if (!checkSeen.has(id)) {
      pushIssue(issues, {
        id: `missing-completion-check-${id}`,
        severity: "error",
        category: "completion",
        title: "Missing Completion Check",
        description: `Completion checks must include the '${id}' check.`,
      });
    }
  }

  // --- 17. DOCUMENT-LEVEL TRACEABILITY ---
  const rollupByTask = new Map(plan.traceability.tasks.map((t) => [t.task_id, t]));
  for (const task of plan.implementation_tasks) {
    if (!rollupByTask.has(task.id)) {
      pushIssue(issues, {
        id: `orphan-task-traceability-${task.id}`,
        severity: "error",
        category: "traceability",
        title: "Task Without Traceability Rollup Entry",
        description: `Task '${task.id}' has no entry in the document traceability rollup.`,
        item_id: task.id,
      });
    }
  }
  for (const entry of plan.traceability.tasks) {
    if (!taskById.has(entry.task_id)) {
      pushIssue(issues, {
        id: `traceability-unknown-task-${entry.task_id}`,
        severity: "error",
        category: "traceability",
        title: "Traceability References Unknown Task",
        description: `Traceability rollup references unknown task '${entry.task_id}'.`,
        item_id: entry.task_id,
      });
    }
    const totalRefs =
      entry.requirement_ids.length +
      entry.architecture_module_ids.length +
      entry.erd_entity_ids.length +
      entry.dfd_process_ids.length +
      entry.flowchart_process_ids.length +
      entry.blueprint_module_ids.length +
      entry.agent_package_module_ids.length +
      entry.design_system_screen_ids.length +
      entry.design_system_component_ids.length;
    if (totalRefs === 0) {
      pushIssue(issues, {
        id: `empty-rollup-traceability-${entry.task_id}`,
        severity: "error",
        category: "traceability",
        title: "Empty Traceability Rollup Entry",
        description: `Traceability rollup entry for '${entry.task_id}' has no upstream references.`,
        item_id: entry.task_id,
      });
    }
  }

  // --- 18. SECRET PATTERNS ---
  const secretPatterns = [
    /\b(password|secret|key|token|credentials)["']?\s*[:=]\s*["'][^"']+["']/i,
    /process\.env\.(API_KEY|SECRET|PASSWORD|TOKEN)/i,
    /Authorization:\s*["']Bearer\s+[a-zA-Z0-9\-\._]+["']/i,
  ];
  const planString = JSON.stringify(plan);
  for (const pattern of secretPatterns) {
    if (pattern.test(planString)) {
      pushIssue(issues, {
        id: "forbidden-secret-pattern",
        severity: "error",
        category: "security",
        title: "Forbidden Secret Pattern Detected",
        description:
          "Engineering Plan contains text that resembles hardcoded secrets or credentials.",
      });
      break;
    }
  }

  // --- 19. UPSTREAM REFERENCES (context required) ---
  if (context) {
    const validRequirementIds = new Set<string>([
      ...context.blueprint.modules.flatMap((m) => m.requirement_ids),
      ...context.blueprint.api_plan.flatMap((a) => a.requirement_ids),
      ...context.blueprint.traceability.mappings.map((m) => m.requirement_id),
      ...context.flowchart.processes.flatMap((p) => p.requirement_ids),
    ]);
    const validArchModules = new Set(context.architecture.modules.map((m) => m.id));
    const validErdEntities = new Set(context.erd.entities.map((e) => e.name));
    const validDfdProcesses = new Set([
      ...context.dfd.context.nodes.filter((n) => n.type === "process").map((n) => n.id),
      ...context.dfd.level_1.nodes.filter((n) => n.type === "process").map((n) => n.id),
    ]);
    const validFlowchartIds = new Set([
      ...context.flowchart.nodes.map((n) => n.id),
      ...context.flowchart.processes.map((p) => p.id),
    ]);
    const validBlueprintModules = new Set(context.blueprint.modules.map((m) => m.id));
    const validBlueprintRoutes = new Set(
      context.blueprint.frontend_plan.pages.map((p) => p.route),
    );
    const validBlueprintApiPairs = new Set(
      context.blueprint.api_plan.map((a) => `${a.method} ${a.route}`),
    );
    const validRoles = new Set(
      context.blueprint.authorization_plan.roles.map((r) => r.role),
    );
    const validAgentPackageModules = new Set(
      context.agentPackage.modules.map((m) => m.id),
    );
    const validScreens = new Set(
      context.designSystem.screen_specifications.map((s) => s.id),
    );
    const validComponents = new Set(
      context.designSystem.component_system.components.map((c) => c.id),
    );
    const validFormPatterns = new Set(
      context.designSystem.form_patterns.map((f) => f.id),
    );
    const validTablePatterns = new Set(
      context.designSystem.table_patterns.map((t) => t.id),
    );

    const traceKinds: {
      entries: { owner: string; refs: string[] }[];
      valid: Set<string>;
      kind: string;
      field: string;
    }[] = [
      { entries: [], valid: validRequirementIds, kind: "requirement", field: "requirement_ids" },
      { entries: [], valid: validArchModules, kind: "architecture module", field: "architecture_module_ids" },
      { entries: [], valid: validErdEntities, kind: "ERD entity", field: "erd_entity_ids" },
      { entries: [], valid: validDfdProcesses, kind: "DFD process", field: "dfd_process_ids" },
      { entries: [], valid: validFlowchartIds, kind: "flowchart node", field: "flowchart_process_ids" },
      { entries: [], valid: validBlueprintModules, kind: "blueprint module", field: "blueprint_module_ids" },
      { entries: [], valid: validAgentPackageModules, kind: "agent package module", field: "agent_package_module_ids" },
      { entries: [], valid: validScreens, kind: "design system screen", field: "design_system_screen_ids" },
      { entries: [], valid: validComponents, kind: "design system component", field: "design_system_component_ids" },
    ];

    const collect = (owner: string, trace: EngineeringTraceability) => {
      for (const kind of traceKinds) {
        kind.entries.push({
          owner,
          refs: (trace as unknown as Record<string, string[]>)[
            kind.field as string
          ] ?? [],
        });
      }
    };

    for (const task of plan.implementation_tasks) collect(task.id, task.traceability);
    for (const mod of plan.modules) collect(mod.module_id, mod.traceability);
    for (const entry of plan.traceability.tasks) collect(entry.task_id, entry);

    for (const kind of traceKinds) {
      for (const entry of kind.entries) {
        for (const ref of entry.refs) {
          if (!kind.valid.has(ref)) {
            pushIssue(issues, {
              id: `unknown-${kind.kind.replace(/\s+/g, "-")}-${entry.owner}-${ref}`,
              severity: "error",
              category: "traceability",
              title: `Unknown ${kind.kind} reference`,
              description: `'${entry.owner}' references unknown ${kind.kind} '${ref}'.`,
              item_id: entry.owner,
            });
          }
        }
      }
    }

    // API: must match approved blueprint API (method + path)
    for (const api of plan.api_implementation) {
      if (!validBlueprintApiPairs.has(`${api.method} ${api.path}`)) {
        pushIssue(issues, {
          id: `unknown-blueprint-api-${api.id}`,
          severity: "error",
          category: "api",
          title: "API Not Found In Approved Blueprint",
          description: `API '${api.id}' (${api.method} ${api.path}) does not exist in the approved blueprint api_plan.`,
          item_id: api.id,
        });
      }
      for (const role of api.authorization.roles) {
        if (!validRoles.has(role)) {
          pushIssue(issues, {
            id: `api-unknown-role-${api.id}-${role}`,
            severity: "error",
            category: "auth",
            title: "API References Unknown Role",
            description: `API '${api.id}' references unknown role '${role}'.`,
            item_id: api.id,
          });
        }
      }
      for (const ref of api.traceability.requirement_ids) {
        if (!validRequirementIds.has(ref)) {
          pushIssue(issues, {
            id: `unknown-requirement-${api.id}-${ref}`,
            severity: "error",
            category: "traceability",
            title: "Unknown requirement reference",
            description: `API '${api.id}' references unknown requirement '${ref}'.`,
            item_id: api.id,
          });
        }
      }
      for (const ref of api.traceability.blueprint_module_ids) {
        if (!validBlueprintModules.has(ref)) {
          pushIssue(issues, {
            id: `unknown-blueprint-module-${api.id}-${ref}`,
            severity: "error",
            category: "traceability",
            title: "Unknown blueprint module reference",
            description: `API '${api.id}' references unknown blueprint module '${ref}'.`,
            item_id: api.id,
          });
        }
      }
    }

    // Database: ERD is the source of truth
    for (const table of plan.database_implementation.tables) {
      if (!validErdEntities.has(table.entity_id)) {
        if (table.assumption && table.assumption.trim()) {
          pushIssue(issues, {
            id: `table-assumed-entity-${table.table_name}`,
            severity: "warning",
            category: "database",
            title: "Table Uses Assumed Entity",
            description: `Table '${table.table_name}' uses entity '${table.entity_id}' which is not in the approved ERD (declared as an assumption).`,
            item_id: table.table_name,
          });
        } else {
          pushIssue(issues, {
            id: `unknown-erd-entity-${table.table_name}-${table.entity_id}`,
            severity: "error",
            category: "database",
            title: "Table References Unknown ERD Entity",
            description: `Table '${table.table_name}' references entity '${table.entity_id}' which is not in the approved ERD.`,
            item_id: table.table_name,
          });
        }
      }
    }

    // Auth roles must come from the blueprint
    for (const role of plan.authorization_implementation.roles) {
      if (!validRoles.has(role.role)) {
        pushIssue(issues, {
          id: `unknown-role-${role.role}`,
          severity: "error",
          category: "auth",
          title: "Unknown Role",
          description: `Role '${role.role}' does not exist in the approved blueprint authorization plan.`,
          item_id: role.role,
        });
      }
    }

    // Protected routes must exist in the blueprint
    const protectedRouteValid = (route: string) =>
      validBlueprintRoutes.has(route) ||
      [...validBlueprintApiPairs].some((pair) => pair.endsWith(` ${route}`));
    for (const prot of plan.authorization_implementation.route_protection) {
      if (prot.route.startsWith("/") && !protectedRouteValid(prot.route)) {
        pushIssue(issues, {
          id: `unknown-protected-route-${prot.route}`,
          severity: "error",
          category: "auth",
          title: "Protected Route Not In Blueprint",
          description: `Protected route '${prot.route}' does not exist in the approved blueprint.`,
          item_id: prot.route,
        });
      }
      for (const role of prot.roles) {
        if (!validRoles.has(role)) {
          pushIssue(issues, {
            id: `protected-route-unknown-role-${prot.route}-${role}`,
            severity: "error",
            category: "auth",
            title: "Protected Route References Unknown Role",
            description: `Protected route '${prot.route}' references unknown role '${role}'.`,
            item_id: prot.route,
          });
        }
      }
    }

    // Frontend pages must follow blueprint routes + design system screens
    for (const page of plan.frontend_implementation.pages) {
      if (page.route.startsWith("/") && !validBlueprintRoutes.has(page.route)) {
        pushIssue(issues, {
          id: `unknown-frontend-route-${page.id}`,
          severity: "error",
          category: "api",
          title: "Frontend Route Not In Blueprint",
          description: `Page '${page.id}' route '${page.route}' does not exist in the approved blueprint frontend plan.`,
          item_id: page.id,
        });
      }
      if (!validScreens.has(page.screen_id)) {
        pushIssue(issues, {
          id: `unknown-design-system-screen-${page.id}-${page.screen_id}`,
          severity: "error",
          category: "traceability",
          title: "Page References Unknown Design System Screen",
          description: `Page '${page.id}' references unknown design system screen '${page.screen_id}'.`,
          item_id: page.id,
        });
      }
      for (const comp of page.components) {
        if (!validComponents.has(comp)) {
          pushIssue(issues, {
            id: `unknown-design-system-component-${page.id}-${comp}`,
            severity: "error",
            category: "traceability",
            title: "Page References Unknown Design System Component",
            description: `Page '${page.id}' references unknown design system component '${comp}'.`,
            item_id: page.id,
          });
        }
      }
      for (const form of page.forms) {
        if (!validFormPatterns.has(form)) {
          pushIssue(issues, {
            id: `unknown-design-system-form-${page.id}-${form}`,
            severity: "error",
            category: "traceability",
            title: "Page References Unknown Design System Form Pattern",
            description: `Page '${page.id}' references unknown form pattern '${form}'.`,
            item_id: page.id,
          });
        }
      }
      for (const tableId of page.tables) {
        if (!validTablePatterns.has(tableId)) {
          pushIssue(issues, {
            id: `unknown-design-system-table-${page.id}-${tableId}`,
            severity: "error",
            category: "traceability",
            title: "Page References Unknown Design System Table Pattern",
            description: `Page '${page.id}' references unknown table pattern '${tableId}'.`,
            item_id: page.id,
          });
        }
      }
    }

    // Business rules must trace to real requirements
    for (const rule of plan.backend_implementation.business_rules) {
      if (!validRequirementIds.has(rule.source_requirement_id)) {
        pushIssue(issues, {
          id: `unknown-business-rule-requirement-${rule.id}-${rule.source_requirement_id}`,
          severity: "error",
          category: "traceability",
          title: "Business Rule References Unknown Requirement",
          description: `Business rule '${rule.id}' references unknown requirement '${rule.source_requirement_id}'.`,
          item_id: rule.id,
        });
      }
    }
  }

  const hasError = issues.some((i) => i.severity === "error");
  return { valid: !hasError, issues };
}

/* ============================================
   APPROVAL EVALUATOR (shared by route & tests)
   ============================================ */

export type EngineeringApprovalInput = {
  isOwner: boolean;
  status: string;
  reviewData: EngineeringReview | null;
  decisions: EngineeringReviewDecision[];
  validationValid: boolean;
  upstreamsComplete: boolean;
  sourceIdsMatch: boolean;
};

export type EngineeringApprovalResult = {
  approved: boolean;
  reasons: string[];
};

/**
 * Deterministic approval gate. Server-authoritative: the approve route
 * delegates its decision logic here so tests exercise the real path.
 *
 * Blocking rule: a critical-severity issue resolved with 'ignore' blocks
 * approval even when decision coverage is 100%.
 */
export function evaluateEngineeringPlanApproval(
  input: EngineeringApprovalInput,
): EngineeringApprovalResult {
  const reasons: string[] = [];

  if (!input.isOwner) {
    reasons.push("Only the project owner can approve documents.");
  }
  if (input.status === "approved") {
    reasons.push("Document is already approved.");
  } else if (input.status !== "review") {
    reasons.push("Document must be in review state before approval.");
  }
  if (!input.reviewData) {
    reasons.push("No review data found. Run the AI review first.");
  } else {
    const resolvedIds = new Set(input.decisions.map((d) => d.issue_id));
    const unresolved = input.reviewData.issues.filter((i) => !resolvedIds.has(i.id));
    if (unresolved.length > 0) {
      reasons.push(
        `All review issues must have a decision before approval (${unresolved.length} unresolved).`,
      );
    }
    const decisionById = new Map(input.decisions.map((d) => [d.issue_id, d]));
    for (const issue of input.reviewData.issues) {
      const decision = decisionById.get(issue.id);
      if (issue.severity === "critical" && decision?.decision === "ignore") {
        reasons.push(
          `Blocking issue '${issue.title}' is critical and cannot be ignored.`,
        );
      }
    }
  }
  if (!input.validationValid) {
    reasons.push("Document failed deterministic validation.");
  }
  if (!input.upstreamsComplete) {
    reasons.push("Missing required approved upstream artifacts.");
  }
  if (!input.sourceIdsMatch) {
    reasons.push(
      "Source document IDs do not match the current approved upstream documents.",
    );
  }

  return { approved: reasons.length === 0, reasons };
}

/**
 * Approved documents are immutable; only draft/review may be mutated.
 */
export function canMutateEngineeringPlan(status: string): boolean {
  return status === "draft" || status === "review";
}
