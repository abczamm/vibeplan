import { z } from "zod";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
} from "./types";

/* ============================================
   IMPLEMENTATION BLUEPRINT ZOD SCHEMAS & TYPES
   ============================================ */

export const blueprintModuleSchema = z.object({
  id: z.string(), // e.g. "BP-MOD-AUTH", "BP-MOD-PROJECT"
  code: z.string(), // e.g. "AUTH", "PROJ"
  name: z.string(),
  description: z.string(),
  responsibility: z.string(),
  requirement_ids: z.array(z.string()),
  architecture_module_ids: z.array(z.string()),
  erd_entity_ids: z.array(z.string()),
  dfd_process_ids: z.array(z.string()),
  flowchart_process_ids: z.array(z.string()),
  frontend_tasks: z.array(z.string()),
  backend_tasks: z.array(z.string()),
  database_tasks: z.array(z.string()),
  dependencies: z.array(z.string()), // Blueprint module IDs
  priority: z.number().int().min(1),
});

export const databaseTablePlanSchema = z.object({
  entity_id: z.string().optional(),
  table_name: z.string(),
  purpose: z.string(),
  primary_key: z.string(),
  foreign_keys: z.array(
    z.object({
      column: z.string(),
      references_table: z.string(),
      references_column: z.string(),
      on_delete: z.string().optional(),
    })
  ),
  indexes: z.array(
    z.object({
      name: z.string(),
      columns: z.array(z.string()),
      unique: z.boolean(),
    })
  ),
  constraints: z.array(z.string()),
  rls_required: z.boolean(),
  rls_summary: z.string().optional(),
  audit_logging: z.boolean(),
});

export const databaseImplementationPlanSchema = z.object({
  summary: z.string(),
  tables: z.array(databaseTablePlanSchema),
  migration_steps: z.array(z.string()),
  seed_data_plan: z.array(z.string()),
});

export const apiImplementationItemSchema = z.object({
  id: z.string(), // e.g. "BP-API-AUTH-LOGIN"
  module_id: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  route: z.string(), // e.g. "/api/auth/login"
  purpose: z.string(),
  authentication_required: z.boolean(),
  authorization_roles: z.array(z.string()),
  input_schema_summary: z.string(),
  response_description: z.string(),
  error_cases: z.array(z.string()),
  requirement_ids: z.array(z.string()),
  dfd_process_id: z.string().optional(),
  architecture_module_id: z.string().optional(),
});

export const apiImplementationPlanSchema = z.array(apiImplementationItemSchema);

export const authenticationPlanSchema = z.object({
  mechanism: z.string(),
  session_strategy: z.string(),
  protected_routes: z.array(z.string()),
  public_routes: z.array(z.string()),
  boundaries: z.array(z.string()),
  security_considerations: z.array(z.string()),
});

export const authorizationRolePlanSchema = z.object({
  role: z.string(),
  permissions: z.array(z.string()),
  module_access: z.array(z.string()),
});

export const authorizationPlanSchema = z.object({
  summary: z.string(),
  roles: z.array(authorizationRolePlanSchema),
  server_side_enforcement: z.array(z.string()),
  ui_visibility_rules: z.array(z.string()),
});

export const frontendPagePlanSchema = z.object({
  id: z.string(), // e.g. "BP-PAGE-DASHBOARD"
  module_id: z.string(),
  route: z.string(),
  title: z.string(),
  purpose: z.string(),
  components: z.array(z.string()),
  required_states: z.array(
    z.enum(["default", "loading", "empty", "error", "success"])
  ),
  responsive_requirements: z.string(),
});

export const frontendImplementationPlanSchema = z.object({
  summary: z.string(),
  pages: z.array(frontendPagePlanSchema),
  reusable_components: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      category: z.string(),
    })
  ),
});

export const backendServicePlanSchema = z.object({
  id: z.string(), // e.g. "BP-SVC-AUTH"
  module_id: z.string(),
  name: z.string(),
  purpose: z.string(),
  key_functions: z.array(z.string()),
  transaction_boundaries: z.array(z.string()),
  error_handling_strategy: z.string(),
});

export const backendImplementationPlanSchema = z.object({
  summary: z.string(),
  services: z.array(backendServicePlanSchema),
  data_access_boundaries: z.array(z.string()),
});

export const validationRuleItemSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  target: z.string(),
  rule: z.string(),
  error_message: z.string(),
  source: z.enum(["requirement", "architecture", "business_rule", "assumption"]),
});

export const validationPlanSchema = z.object({
  rules: z.array(validationRuleItemSchema),
});

export const securityThreatMitigationSchema = z.object({
  threat_category: z.string(), // e.g., "SQL Injection", "XSS", "Unauthorized Access"
  mitigation: z.string(),
  enforcement_location: z.enum(["database", "backend", "api", "frontend"]),
});

export const securityImplementationPlanSchema = z.object({
  summary: z.string(),
  mitigations: z.array(securityThreatMitigationSchema),
  sensitive_data_handling: z.array(z.string()),
  audit_trail_requirements: z.array(z.string()),
});

export const testCaseRequirementSchema = z.object({
  id: z.string(),
  category: z.enum(["unit", "integration", "e2e", "security"]),
  target_module_id: z.string(),
  title: z.string(),
  description: z.string(),
  expected_outcome: z.string(),
});

export const testingImplementationPlanSchema = z.object({
  summary: z.string(),
  test_cases: z.array(testCaseRequirementSchema),
});

export const implementationPhaseSchema = z.object({
  id: z.string(), // e.g. "BP-PHASE-1"
  phase_number: z.number().int().min(1),
  name: z.string(),
  description: z.string(),
  module_ids: z.array(z.string()),
  exit_criteria: z.array(z.string()),
});

export const implementationDependencySchema = z.object({
  from_module_id: z.string(),
  to_module_id: z.string(), // to_module_id depends on from_module_id
  reason: z.string(),
});

export const blueprintTraceabilityMappingSchema = z.object({
  requirement_id: z.string(),
  architecture_module_id: z.string().optional(),
  erd_entity_name: z.string().optional(),
  dfd_process_id: z.string().optional(),
  flowchart_process_id: z.string().optional(),
  blueprint_module_id: z.string(),
});

export const blueprintTraceabilitySchema = z.object({
  mappings: z.array(blueprintTraceabilityMappingSchema),
  uncovered_requirements: z.array(z.string()),
  uncovered_dfd_processes: z.array(z.string()),
});

export const blueprintMetadataSchema = z.object({
  generated_at: z.string(),
  generator_version: z.string(),
  upstream_artifact_ids: z.object({
    requirements_id: z.string(),
    architecture_id: z.string(),
    erd_id: z.string(),
    dfd_id: z.string(),
    flowchart_id: z.string(),
  }),
});

export const implementationBlueprintSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string(),
  project_summary: z.string(),
  modules: z.array(blueprintModuleSchema),
  database_plan: databaseImplementationPlanSchema,
  api_plan: apiImplementationPlanSchema,
  authentication_plan: authenticationPlanSchema,
  authorization_plan: authorizationPlanSchema,
  frontend_plan: frontendImplementationPlanSchema,
  backend_plan: backendImplementationPlanSchema,
  validation_plan: validationPlanSchema,
  security_plan: securityImplementationPlanSchema,
  testing_plan: testingImplementationPlanSchema,
  implementation_phases: z.array(implementationPhaseSchema),
  dependencies: z.array(implementationDependencySchema),
  assumptions: z.array(z.string()),
  traceability: blueprintTraceabilitySchema,
  _metadata: blueprintMetadataSchema,
});

export type BlueprintModule = z.infer<typeof blueprintModuleSchema>;
export type DatabaseTablePlan = z.infer<typeof databaseTablePlanSchema>;
export type DatabaseImplementationPlan = z.infer<typeof databaseImplementationPlanSchema>;
export type ApiImplementationItem = z.infer<typeof apiImplementationItemSchema>;
export type ApiImplementationPlan = z.infer<typeof apiImplementationPlanSchema>;
export type AuthenticationPlan = z.infer<typeof authenticationPlanSchema>;
export type AuthorizationRolePlan = z.infer<typeof authorizationRolePlanSchema>;
export type AuthorizationPlan = z.infer<typeof authorizationPlanSchema>;
export type FrontendPagePlan = z.infer<typeof frontendPagePlanSchema>;
export type FrontendImplementationPlan = z.infer<typeof frontendImplementationPlanSchema>;
export type BackendServicePlan = z.infer<typeof backendServicePlanSchema>;
export type BackendImplementationPlan = z.infer<typeof backendImplementationPlanSchema>;
export type ValidationRuleItem = z.infer<typeof validationRuleItemSchema>;
export type ValidationPlan = z.infer<typeof validationPlanSchema>;
export type SecurityThreatMitigation = z.infer<typeof securityThreatMitigationSchema>;
export type SecurityImplementationPlan = z.infer<typeof securityImplementationPlanSchema>;
export type TestCaseRequirement = z.infer<typeof testCaseRequirementSchema>;
export type TestingImplementationPlan = z.infer<typeof testingImplementationPlanSchema>;
export type ImplementationPhase = z.infer<typeof implementationPhaseSchema>;
export type ImplementationDependency = z.infer<typeof implementationDependencySchema>;
export type BlueprintTraceabilityMapping = z.infer<typeof blueprintTraceabilityMappingSchema>;
export type BlueprintTraceability = z.infer<typeof blueprintTraceabilitySchema>;
export type BlueprintMetadata = z.infer<typeof blueprintMetadataSchema>;
export type ImplementationBlueprint = z.infer<typeof implementationBlueprintSchema>;

/* ============================================
   BLUEPRINT REVIEW SCHEMAS & TYPES
   ============================================ */

export const blueprintReviewSeveritySchema = z.enum(["important", "minor"]);
export const blueprintReviewIssueKindSchema = z.enum([
  "missing_implementation_coverage",
  "unsupported_implementation_item",
  "broken_traceability",
  "missing_authorization",
  "missing_validation",
  "missing_security_consideration",
  "dependency_problem",
  "incomplete_testing_strategy",
  "database_implementation_mismatch",
  "api_mismatch",
  "frontend_backend_responsibility_mismatch",
  "unsupported_business_rule_invention",
  "ambiguous_task",
  "recommended_improvement",
]);

export const blueprintReviewIssueSchema = z.object({
  id: z.string(),
  severity: blueprintReviewSeveritySchema,
  kind: blueprintReviewIssueKindSchema,
  section: z.string(),
  title: z.string(),
  description: z.string(),
  evidence: z.string(),
  recommendation: z.string(),
  module_id: z.string().optional(),
  api_id: z.string().optional(),
  page_id: z.string().optional(),
  requires_user_decision: z.boolean(),
});

export const blueprintReviewSchema = z.object({
  summary: z.string(),
  issues: z.array(blueprintReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export const blueprintReviewDecisionActionSchema = z.enum(["accept", "ignore", "custom"]);

export const blueprintReviewDecisionSchema = z.object({
  issue_id: z.string(),
  action: blueprintReviewDecisionActionSchema,
  custom_text: z.string().optional(),
  resolved_at: z.string(),
});

export type BlueprintReviewSeverity = z.infer<typeof blueprintReviewSeveritySchema>;
export type BlueprintReviewIssueKind = z.infer<typeof blueprintReviewIssueKindSchema>;
export type BlueprintReviewIssue = z.infer<typeof blueprintReviewIssueSchema>;
export type BlueprintReview = z.infer<typeof blueprintReviewSchema>;
export type BlueprintReviewDecisionAction = z.infer<typeof blueprintReviewDecisionActionSchema>;
export type BlueprintReviewDecision = z.infer<typeof blueprintReviewDecisionSchema>;

/* ============================================
   UPSTREAM CONTEXT & VALIDATOR
   ============================================ */

export type BlueprintUpstreamContext = {
  requirements: RequirementsDraft;
  architecture: ArchitectureDocument;
  erd: ERDDocument;
  dfd: DFDDocument;
  flowchart: FlowchartDocument;
};

export type BlueprintValidationIssue = {
  id: string;
  severity: "error" | "warning";
  category: "structure" | "references" | "dependencies" | "completeness" | "traceability";
  title: string;
  description: string;
  item_id?: string;
};

export type BlueprintValidationResult = {
  valid: boolean;
  issues: BlueprintValidationIssue[];
};

/**
 * Deterministic Validator for Implementation Blueprint
 */
export function validateImplementationBlueprint(
  blueprint: ImplementationBlueprint,
  context?: BlueprintUpstreamContext
): BlueprintValidationResult {
  const issues: BlueprintValidationIssue[] = [];

  // --- 1. STRUCTURE CHECKS ---
  const moduleIds = new Set<string>();
  const moduleCodes = new Set<string>();
  for (const mod of blueprint.modules) {
    if (moduleIds.has(mod.id)) {
      issues.push({
        id: `dup-mod-id-${mod.id}`,
        severity: "error",
        category: "structure",
        title: "Duplicate Module ID",
        description: `Module ID '${mod.id}' is used multiple times.`,
        item_id: mod.id,
      });
    }
    moduleIds.add(mod.id);

    if (moduleCodes.has(mod.code)) {
      issues.push({
        id: `dup-mod-code-${mod.code}`,
        severity: "error",
        category: "structure",
        title: "Duplicate Module Code",
        description: `Module code '${mod.code}' is used by multiple modules.`,
        item_id: mod.id,
      });
    }
    moduleCodes.add(mod.code);
  }

  const apiIds = new Set<string>();
  const apiRoutes = new Set<string>();
  for (const api of blueprint.api_plan) {
    if (apiIds.has(api.id)) {
      issues.push({
        id: `dup-api-id-${api.id}`,
        severity: "error",
        category: "structure",
        title: "Duplicate API ID",
        description: `API ID '${api.id}' is used multiple times.`,
        item_id: api.id,
      });
    }
    apiIds.add(api.id);

    const routeKey = `${api.method}:${api.route}`;
    if (apiRoutes.has(routeKey)) {
      issues.push({
        id: `dup-api-route-${api.id}`,
        severity: "warning",
        category: "structure",
        title: "Duplicate Route & Method",
        description: `API route '${routeKey}' is specified more than once.`,
        item_id: api.id,
      });
    }
    apiRoutes.add(routeKey);
  }

  const pageIds = new Set<string>();
  const pageRoutes = new Set<string>();
  for (const page of blueprint.frontend_plan.pages) {
    if (pageIds.has(page.id)) {
      issues.push({
        id: `dup-page-id-${page.id}`,
        severity: "error",
        category: "structure",
        title: "Duplicate Page ID",
        description: `Page ID '${page.id}' is used multiple times.`,
        item_id: page.id,
      });
    }
    pageIds.add(page.id);

    if (pageRoutes.has(page.route)) {
      issues.push({
        id: `dup-page-route-${page.id}`,
        severity: "warning",
        category: "structure",
        title: "Duplicate Page Route",
        description: `Frontend page route '${page.route}' is specified multiple times.`,
        item_id: page.id,
      });
    }
    pageRoutes.add(page.route);
  }

  const phaseIds = new Set<string>();
  for (const phase of blueprint.implementation_phases) {
    if (phaseIds.has(phase.id)) {
      issues.push({
        id: `dup-phase-id-${phase.id}`,
        severity: "error",
        category: "structure",
        title: "Duplicate Phase ID",
        description: `Implementation Phase ID '${phase.id}' is used multiple times.`,
        item_id: phase.id,
      });
    }
    phaseIds.add(phase.id);
  }

  // --- 2. DEPENDENCY CHECKS ---
  const adj = new Map<string, string[]>();
  for (const modId of moduleIds) {
    adj.set(modId, []);
  }

  for (const dep of blueprint.dependencies) {
    if (!moduleIds.has(dep.from_module_id)) {
      issues.push({
        id: `invalid-dep-from-${dep.from_module_id}`,
        severity: "error",
        category: "dependencies",
        title: "Dependency on Missing Module",
        description: `Dependency references non-existent source module '${dep.from_module_id}'.`,
      });
    }
    if (!moduleIds.has(dep.to_module_id)) {
      issues.push({
        id: `invalid-dep-to-${dep.to_module_id}`,
        severity: "error",
        category: "dependencies",
        title: "Dependency on Missing Target Module",
        description: `Dependency references non-existent target module '${dep.to_module_id}'.`,
      });
    }

    if (dep.from_module_id === dep.to_module_id) {
      issues.push({
        id: `self-dep-${dep.from_module_id}`,
        severity: "error",
        category: "dependencies",
        title: "Self Dependency",
        description: `Module '${dep.from_module_id}' cannot depend on itself.`,
        item_id: dep.from_module_id,
      });
    } else if (moduleIds.has(dep.from_module_id) && moduleIds.has(dep.to_module_id)) {
      adj.get(dep.from_module_id)?.push(dep.to_module_id);
    }
  }

  // Also check module.dependencies array
  for (const mod of blueprint.modules) {
    for (const depId of mod.dependencies) {
      if (!moduleIds.has(depId)) {
        issues.push({
          id: `mod-dep-missing-${mod.id}-${depId}`,
          severity: "error",
          category: "dependencies",
          title: "Module Depends on Non-Existent Module",
          description: `Module '${mod.id}' lists dependency '${depId}' which does not exist in modules list.`,
          item_id: mod.id,
        });
      }
      if (depId === mod.id) {
        issues.push({
          id: `mod-self-dep-${mod.id}`,
          severity: "error",
          category: "dependencies",
          title: "Self Dependency",
          description: `Module '${mod.id}' depends on itself in its dependency list.`,
          item_id: mod.id,
        });
      }
    }
  }

  // Cycle detection via Tarjan/DFS
  const visited = new Map<string, "white" | "gray" | "black">();
  for (const mId of moduleIds) visited.set(mId, "white");

  let hasCycle = false;
  function dfs(u: string, path: string[]) {
    visited.set(u, "gray");
    path.push(u);
    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (visited.get(v) === "gray") {
        hasCycle = true;
        const cyclePath = path.slice(path.indexOf(v)).concat(v).join(" -> ");
        issues.push({
          id: `circular-dependency-${u}-${v}`,
          severity: "error",
          category: "dependencies",
          title: "Circular Dependency Detected",
          description: `Circular dependency detected in module plan: ${cyclePath}`,
          item_id: u,
        });
      } else if (visited.get(v) === "white") {
        dfs(v, path);
      }
    }
    path.pop();
    visited.set(u, "black");
  }

  for (const mId of moduleIds) {
    if (visited.get(mId) === "white") {
      dfs(mId, []);
    }
  }

  // --- 3. COMPLETENESS & MODULE REFERENCES CHECKS ---
  if (blueprint.implementation_phases.length === 0) {
    issues.push({
      id: "missing-phases",
      severity: "error",
      category: "completeness",
      title: "Missing Implementation Phases",
      description: "Blueprint must contain at least one implementation phase.",
    });
  }

  for (const mod of blueprint.modules) {
    if (
      mod.frontend_tasks.length === 0 &&
      mod.backend_tasks.length === 0 &&
      mod.database_tasks.length === 0
    ) {
      issues.push({
        id: `no-tasks-${mod.id}`,
        severity: "error",
        category: "completeness",
        title: "Module Without Implementation Responsibility",
        description: `Module '${mod.id}' (${mod.name}) has no frontend, backend, or database tasks defined.`,
        item_id: mod.id,
      });
    }
  }

  for (const api of blueprint.api_plan) {
    if (!moduleIds.has(api.module_id)) {
      issues.push({
        id: `api-invalid-mod-${api.id}`,
        severity: "error",
        category: "references",
        title: "API Linked to Missing Module",
        description: `API '${api.id}' references module_id '${api.module_id}' which does not exist.`,
        item_id: api.id,
      });
    }

    if (api.authentication_required && api.authorization_roles.length === 0) {
      issues.push({
        id: `api-no-roles-${api.id}`,
        severity: "warning",
        category: "completeness",
        title: "Protected Endpoint Without Roles",
        description: `Protected API endpoint '${api.id}' (${api.route}) requires authentication but specifies no authorization roles.`,
        item_id: api.id,
      });
    }
  }

  for (const page of blueprint.frontend_plan.pages) {
    if (!moduleIds.has(page.module_id)) {
      issues.push({
        id: `page-invalid-mod-${page.id}`,
        severity: "error",
        category: "references",
        title: "Page Linked to Missing Module",
        description: `Page '${page.id}' references module_id '${page.module_id}' which does not exist.`,
        item_id: page.id,
      });
    }
  }

  for (const svc of blueprint.backend_plan.services) {
    if (!moduleIds.has(svc.module_id)) {
      issues.push({
        id: `svc-invalid-mod-${svc.id}`,
        severity: "error",
        category: "references",
        title: "Backend Service Linked to Missing Module",
        description: `Service '${svc.id}' references module_id '${svc.module_id}' which does not exist.`,
        item_id: svc.id,
      });
    }
  }

  // --- 4. UPSTREAM ARTIFACT REFERENCE VALIDATION (If context provided) ---
  if (context) {
    const validArchModules = new Set(
      context.architecture.modules.map((m) => m.id)
    );
    const validErdEntities = new Set(
      context.erd.entities.map((e) => e.name)
    );
    const validErdTableNames = new Set(
      context.erd.entities.map((e) => e.table_name)
    );
    const validDfdProcesses = new Set([
      ...context.dfd.context.nodes.filter((n) => n.type === "process").map((n) => n.id),
      ...context.dfd.level_1.nodes.filter((n) => n.type === "process").map((n) => n.id),
    ]);
    const validFlowchartNodes = new Set(
      context.flowchart.nodes.map((n) => n.id)
    );

    // Validate module references to upstream
    for (const mod of blueprint.modules) {
      for (const archId of mod.architecture_module_ids) {
        if (!validArchModules.has(archId)) {
          issues.push({
            id: `invalid-arch-ref-${mod.id}-${archId}`,
            severity: "error",
            category: "references",
            title: "Invalid Architecture Module Reference",
            description: `Module '${mod.id}' references non-existent architecture module '${archId}'.`,
            item_id: mod.id,
          });
        }
      }
      for (const erdId of mod.erd_entity_ids) {
        if (!validErdEntities.has(erdId)) {
          issues.push({
            id: `invalid-erd-ref-${mod.id}-${erdId}`,
            severity: "error",
            category: "references",
            title: "Invalid ERD Entity Reference",
            description: `Module '${mod.id}' references non-existent ERD entity '${erdId}'.`,
            item_id: mod.id,
          });
        }
      }
      for (const dfdId of mod.dfd_process_ids) {
        if (!validDfdProcesses.has(dfdId)) {
          issues.push({
            id: `invalid-dfd-ref-${mod.id}-${dfdId}`,
            severity: "error",
            category: "references",
            title: "Invalid DFD Process Reference",
            description: `Module '${mod.id}' references non-existent DFD process '${dfdId}'.`,
            item_id: mod.id,
          });
        }
      }
      for (const fcId of mod.flowchart_process_ids) {
        if (!validFlowchartNodes.has(fcId)) {
          issues.push({
            id: `invalid-fc-ref-${mod.id}-${fcId}`,
            severity: "error",
            category: "references",
            title: "Invalid Flowchart Reference",
            description: `Module '${mod.id}' references non-existent flowchart node '${fcId}'.`,
            item_id: mod.id,
          });
        }
      }
    }

    // Validate database table plans against ERD
    for (const tbl of blueprint.database_plan.tables) {
      if (tbl.entity_id && !validErdEntities.has(tbl.entity_id)) {
        issues.push({
          id: `db-table-invalid-erd-${tbl.table_name}`,
          severity: "error",
          category: "references",
          title: "Database Table Linked to Missing ERD Entity",
          description: `Table '${tbl.table_name}' references entity_id '${tbl.entity_id}' which does not exist in approved ERD.`,
          item_id: tbl.table_name,
        });
      }
      if (!validErdTableNames.has(tbl.table_name)) {
        issues.push({
          id: `db-table-unmapped-${tbl.table_name}`,
          severity: "warning",
          category: "references",
          title: "Database Table Not in Approved ERD",
          description: `Table '${tbl.table_name}' does not match any table_name in the approved ERD.`,
          item_id: tbl.table_name,
        });
      }
    }
  }

  const hasError = issues.some((i) => i.severity === "error");

  return {
    valid: !hasError,
    issues,
  };
}
