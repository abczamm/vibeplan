import { z } from "zod";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
} from "./types";

/* ============================================
   AGENT PACKAGE ZOD SCHEMAS & TYPES
   ============================================ */

export const agentContractSchema = z.object({
  objective: z.string(),
  must: z.array(z.string()).min(1),
  must_not: z.array(z.string()).min(1),
  allowed_changes: z.array(z.string()),
  prohibited_changes: z.array(z.string()),
  required_checks: z.array(z.string()),
  escalation_rules: z.array(z.string()).min(1),
  completion_rules: z.array(z.string()),
});

export const projectRuleSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
});

export const implementationPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  modules: z.array(z.string()),
});

export const implementationStrategySchema = z.object({
  phases: z.array(implementationPhaseSchema),
  dependency_order: z.array(z.string()),
});

export const agentModuleSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  purpose: z.string(),
  requirements: z.array(z.string()),
  architecture_modules: z.array(z.string()),
  erd_entities: z.array(z.string()),
  dfd_processes: z.array(z.string()),
  flowchart_processes: z.array(z.string()),
  blueprint_module_id: z.string(),
  frontend: z.object({
    pages: z.array(z.string()),
    components: z.array(z.string()),
    states: z.array(z.string()),
  }),
  backend: z.object({
    services: z.array(z.string()),
    operations: z.array(z.string()),
  }),
  api_ids: z.array(z.string()),
  database_entities: z.array(z.string()),
  authorization: z.object({
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
  validation_rules: z.array(z.string()),
  security_requirements: z.array(z.string()),
  testing_requirements: z.array(z.string()),
  dependencies: z.array(z.string()),
  implementation_order: z.number().int(),
});

export const databaseInstructionSchema = z.object({
  table_name: z.string(),
  source_entity_id: z.string(),
  columns: z.array(z.string()),
  primary_key: z.string(),
  foreign_keys: z.array(z.string()),
  unique_constraints: z.array(z.string()),
  check_constraints: z.array(z.string()),
  indexes: z.array(z.string()),
  timestamps_required: z.boolean(),
  audit_requirements: z.array(z.string()),
  rls_requirements: z.array(z.string()),
  seed_requirements: z.array(z.string()),
});

export const agentApiContractSchema = z.object({
  id: z.string(),
  method: z.string(),
  route: z.string(),
  purpose: z.string(),
  module_id: z.string(),
  authentication_required: z.boolean(),
  authorization: z.object({
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
  input: z.string(),
  validation: z.array(z.string()),
  response: z.string(),
  error_cases: z.array(z.string()),
  security_requirements: z.array(z.string()),
  traceability: z.object({
    requirement_ids: z.array(z.string()),
    architecture_module_ids: z.array(z.string()),
    dfd_process_ids: z.array(z.string()),
    blueprint_item_ids: z.array(z.string()),
  }),
});

export const frontendInstructionSchema = z.object({
  module_id: z.string(),
  instructions: z.array(z.string()),
});

export const backendInstructionSchema = z.object({
  module_id: z.string(),
  instructions: z.array(z.string()),
});

export const authenticationInstructionSchema = z.object({
  component: z.string(),
  instruction: z.string(),
});

export const authorizationInstructionSchema = z.object({
  role_or_permission: z.string(),
  instruction: z.string(),
});

export const validationInstructionSchema = z.object({
  target: z.string(),
  instruction: z.string(),
});

export const securityInstructionSchema = z.object({
  category: z.string(),
  instruction: z.string(),
});

export const testingInstructionSchema = z.object({
  module_id: z.string(),
  category: z.enum(["unit", "integration", "e2e", "security", "regression"]),
  instruction: z.string(),
});

export const forbiddenChangeSchema = z.object({
  category: z.string(),
  description: z.string(),
});

export const uncertaintyProtocolSchema = z.object({
  triggers: z.array(z.string()).min(1),
  actions: z.array(z.string()).min(1),
});

export const definitionOfDoneSchema = z.object({
  category: z.string(),
  criteria: z.array(z.string()).min(1),
});

export const agentTraceabilitySchema = z.object({
  module_id: z.string(),
  upstream_links: z.object({
    requirement_ids: z.array(z.string()),
    architecture_module_ids: z.array(z.string()),
    erd_entity_names: z.array(z.string()),
    dfd_process_ids: z.array(z.string()),
    flowchart_process_ids: z.array(z.string()),
    blueprint_module_id: z.string(),
  }),
});

export const agentPackageMetadataSchema = z.object({
  generated_at: z.string(),
  source_document_ids: z.object({
    requirements_id: z.string(),
    architecture_id: z.string(),
    erd_id: z.string(),
    dfd_id: z.string(),
    flowchart_id: z.string(),
    blueprint_id: z.string(),
  }),
  generator_version: z.string(),
});

export const agentPackageDocumentSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string(),
  project_context: z.object({
    project_name: z.string(),
    project_summary: z.string(),
    target_users: z.array(z.string()),
    primary_goals: z.array(z.string()),
  }),
  source_of_truth: z.object({
    requirements_document_id: z.string(),
    architecture_document_id: z.string(),
    erd_document_id: z.string(),
    dfd_document_id: z.string(),
    flowchart_document_id: z.string(),
    blueprint_document_id: z.string(),
  }),
  agent_contract: agentContractSchema,
  project_rules: z.array(projectRuleSchema),
  implementation_strategy: implementationStrategySchema,
  modules: z.array(agentModuleSchema),
  database_instructions: z.array(databaseInstructionSchema),
  api_contracts: z.array(agentApiContractSchema),
  frontend_instructions: z.array(frontendInstructionSchema),
  backend_instructions: z.array(backendInstructionSchema),
  authentication_instructions: z.array(authenticationInstructionSchema),
  authorization_instructions: z.array(authorizationInstructionSchema),
  validation_instructions: z.array(validationInstructionSchema),
  security_instructions: z.array(securityInstructionSchema),
  testing_instructions: z.array(testingInstructionSchema),
  forbidden_changes: z.array(forbiddenChangeSchema),
  uncertainty_protocol: uncertaintyProtocolSchema,
  definition_of_done: z.array(definitionOfDoneSchema).min(1),
  traceability: z.array(agentTraceabilitySchema),
  assumptions: z.array(z.string()),
  _metadata: agentPackageMetadataSchema,
});

export type AgentContract = z.infer<typeof agentContractSchema>;
export type ProjectRule = z.infer<typeof projectRuleSchema>;
export type ImplementationPhase = z.infer<typeof implementationPhaseSchema>;
export type ImplementationStrategy = z.infer<typeof implementationStrategySchema>;
export type AgentModule = z.infer<typeof agentModuleSchema>;
export type DatabaseInstruction = z.infer<typeof databaseInstructionSchema>;
export type AgentApiContract = z.infer<typeof agentApiContractSchema>;
export type FrontendInstruction = z.infer<typeof frontendInstructionSchema>;
export type BackendInstruction = z.infer<typeof backendInstructionSchema>;
export type AuthenticationInstruction = z.infer<typeof authenticationInstructionSchema>;
export type AuthorizationInstruction = z.infer<typeof authorizationInstructionSchema>;
export type ValidationInstruction = z.infer<typeof validationInstructionSchema>;
export type SecurityInstruction = z.infer<typeof securityInstructionSchema>;
export type TestingInstruction = z.infer<typeof testingInstructionSchema>;
export type ForbiddenChange = z.infer<typeof forbiddenChangeSchema>;
export type UncertaintyProtocol = z.infer<typeof uncertaintyProtocolSchema>;
export type DefinitionOfDone = z.infer<typeof definitionOfDoneSchema>;
export type AgentTraceability = z.infer<typeof agentTraceabilitySchema>;
export type AgentPackageMetadata = z.infer<typeof agentPackageMetadataSchema>;
export type AgentPackageDocument = z.infer<typeof agentPackageDocumentSchema>;

/* ============================================
   AGENT PACKAGE REVIEW SCHEMAS & TYPES
   ============================================ */

export const agentPackageReviewSeveritySchema = z.enum(["important", "minor"]);
export const agentPackageReviewIssueKindSchema = z.enum([
  "contract_incomplete",
  "missing_requirements_coverage",
  "architecture_misalignment",
  "erd_misalignment",
  "dfd_misalignment",
  "flowchart_misalignment",
  "blueprint_misalignment",
  "missing_authorization",
  "missing_security",
  "incomplete_testing",
  "dependency_error",
  "traceability_broken",
  "insufficient_forbidden_changes",
  "weak_uncertainty_protocol",
  "weak_definition_of_done",
  "recommended_improvement",
]);

export const agentPackageReviewIssueSchema = z.object({
  id: z.string(),
  severity: agentPackageReviewSeveritySchema,
  kind: agentPackageReviewIssueKindSchema,
  section: z.string(),
  title: z.string(),
  description: z.string(),
  evidence: z.string(),
  recommendation: z.string(),
  module_id: z.string().optional(),
  api_id: z.string().optional(),
  requires_user_decision: z.boolean(),
});

export const agentPackageReviewSchema = z.object({
  summary: z.string(),
  issues: z.array(agentPackageReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export const agentPackageReviewDecisionActionSchema = z.enum(["accept", "ignore", "custom"]);

export const agentPackageReviewDecisionSchema = z.object({
  issue_id: z.string(),
  action: agentPackageReviewDecisionActionSchema,
  custom_text: z.string().optional(),
  resolved_at: z.string(),
});

export type AgentPackageReviewSeverity = z.infer<typeof agentPackageReviewSeveritySchema>;
export type AgentPackageReviewIssueKind = z.infer<typeof agentPackageReviewIssueKindSchema>;
export type AgentPackageReviewIssue = z.infer<typeof agentPackageReviewIssueSchema>;
export type AgentPackageReview = z.infer<typeof agentPackageReviewSchema>;
export type AgentPackageReviewDecisionAction = z.infer<typeof agentPackageReviewDecisionActionSchema>;
export type AgentPackageReviewDecision = z.infer<typeof agentPackageReviewDecisionSchema>;

/* ============================================
   UPSTREAM CONTEXT & VALIDATOR
   ============================================ */

export type AgentPackageUpstreamContext = {
  requirements: RequirementsDraft;
  architecture: ArchitectureDocument;
  erd: ERDDocument;
  dfd: DFDDocument;
  flowchart: FlowchartDocument;
  blueprint: ImplementationBlueprint;
};

export type AgentPackageValidationIssue = {
  id: string;
  severity: "error" | "warning";
  category: "structure" | "traceability" | "security" | "implementation" | "contract";
  title: string;
  description: string;
  item_id?: string;
};

export type AgentPackageValidationResult = {
  valid: boolean;
  issues: AgentPackageValidationIssue[];
};

/**
 * Deterministic Validator for Agent Package
 */
export function validateAgentPackageDocument(
  pkg: AgentPackageDocument,
  context?: AgentPackageUpstreamContext
): AgentPackageValidationResult {
  const issues: AgentPackageValidationIssue[] = [];

  // --- 1. CONTRACT CHECKS ---
  if (!pkg.agent_contract.must || pkg.agent_contract.must.length === 0) {
    issues.push({
      id: "contract-missing-must",
      severity: "error",
      category: "contract",
      title: "Missing MUST Rules",
      description: "Agent Contract is missing 'must' rules.",
    });
  }
  if (!pkg.agent_contract.must_not || pkg.agent_contract.must_not.length === 0) {
    issues.push({
      id: "contract-missing-must-not",
      severity: "error",
      category: "contract",
      title: "Missing MUST NOT Rules",
      description: "Agent Contract is missing 'must_not' rules.",
    });
  }
  if (!pkg.uncertainty_protocol.triggers || pkg.uncertainty_protocol.triggers.length === 0 || !pkg.uncertainty_protocol.actions || pkg.uncertainty_protocol.actions.length === 0) {
    issues.push({
      id: "missing-uncertainty-protocol",
      severity: "error",
      category: "contract",
      title: "Missing Uncertainty Protocol",
      description: "Uncertainty protocol must have triggers and actions.",
    });
  }
  if (!pkg.agent_contract.escalation_rules || pkg.agent_contract.escalation_rules.length === 0) {
    issues.push({
      id: "contract-missing-escalation",
      severity: "error",
      category: "contract",
      title: "Missing Escalation Rules",
      description: "Agent Contract must include escalation rules.",
    });
  }
  if (!pkg.definition_of_done || pkg.definition_of_done.length === 0) {
    issues.push({
      id: "missing-dod",
      severity: "error",
      category: "contract",
      title: "Missing Definition of Done",
      description: "Agent Package is missing Definition of Done criteria.",
    });
  }

  // --- 2. STRUCTURE & MODULE CHECKS ---
  const moduleIds = new Set<string>();
  const apiIds = new Set<string>();
  const moduleOrders = new Set<number>();

  for (const mod of pkg.modules) {
    if (moduleIds.has(mod.id)) {
      issues.push({
        id: `dup-mod-id-${mod.id}`,
        severity: "error",
        category: "structure",
        title: "Duplicate Module ID",
        description: `Module ID '${mod.id}' is duplicated.`,
        item_id: mod.id,
      });
    }
    moduleIds.add(mod.id);

    if (moduleOrders.has(mod.implementation_order)) {
      issues.push({
        id: `dup-mod-order-${mod.implementation_order}`,
        severity: "error",
        category: "implementation",
        title: "Duplicate Implementation Order",
        description: `Implementation order '${mod.implementation_order}' is duplicated across modules.`,
        item_id: mod.id,
      });
    }
    moduleOrders.add(mod.implementation_order);

    if (!mod.security_requirements || mod.security_requirements.length === 0) {
      issues.push({
        id: `mod-no-security-${mod.id}`,
        severity: "error",
        category: "security",
        title: "Module Missing Security Requirements",
        description: `Module '${mod.id}' has no security requirements defined.`,
        item_id: mod.id,
      });
    }
  }

  for (const api of pkg.api_contracts) {
    if (apiIds.has(api.id)) {
      issues.push({
        id: `dup-api-id-${api.id}`,
        severity: "error",
        category: "structure",
        title: "Duplicate API ID",
        description: `API ID '${api.id}' is duplicated.`,
        item_id: api.id,
      });
    }
    apiIds.add(api.id);

    if (!moduleIds.has(api.module_id)) {
      issues.push({
        id: `api-no-module-${api.id}`,
        severity: "error",
        category: "implementation",
        title: "API Without Valid Module",
        description: `API '${api.id}' references a non-existent module '${api.module_id}'.`,
        item_id: api.id,
      });
    }

    if (api.authentication_required && (!api.authorization || api.authorization.roles.length === 0)) {
      issues.push({
        id: `api-no-authz-${api.id}`,
        severity: "error",
        category: "security",
        title: "Protected API Missing Authorization",
        description: `API '${api.id}' requires authentication but has no authorization roles defined.`,
        item_id: api.id,
      });
    }
  }

  if (pkg.implementation_strategy.phases.length === 0) {
    issues.push({
      id: "strategy-no-phases",
      severity: "error",
      category: "structure",
      title: "Empty Implementation Strategy",
      description: "Implementation strategy has no phases defined.",
    });
  }

  // --- 3. DATABASE INSTRUCTIONS ---
  for (const db of pkg.database_instructions) {
    if (!db.source_entity_id) {
      issues.push({
        id: `db-no-source-${db.table_name}`,
        severity: "error",
        category: "implementation",
        title: "Database Instruction Without Source Entity",
        description: `Table '${db.table_name}' is missing a source ERD entity reference.`,
        item_id: db.table_name,
      });
    }
  }

  // --- 4. DEPENDENCY & CIRCULAR DEPENDENCY CHECKS ---
  const adj = new Map<string, string[]>();
  for (const mod of pkg.modules) {
    adj.set(mod.id, []);
    for (const dep of mod.dependencies) {
      if (!moduleIds.has(dep)) {
        issues.push({
          id: `mod-unknown-dep-${mod.id}-${dep}`,
          severity: "error",
          category: "implementation",
          title: "Dependency on Unknown Module",
          description: `Module '${mod.id}' depends on unknown module '${dep}'.`,
          item_id: mod.id,
        });
      }
    }
  }

  // Build graph for circular dependency check
  for (const mod of pkg.modules) {
    for (const dep of mod.dependencies) {
      if (moduleIds.has(dep)) {
        adj.get(mod.id)?.push(dep);
      }
    }
  }

  const visited = new Map<string, "white" | "gray" | "black">();
  for (const mId of moduleIds) visited.set(mId, "white");

  function dfs(u: string, path: string[]) {
    visited.set(u, "gray");
    path.push(u);
    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (visited.get(v) === "gray") {
        const cyclePath = path.slice(path.indexOf(v)).concat(v).join(" -> ");
        issues.push({
          id: `circular-dependency-${u}-${v}`,
          severity: "error",
          category: "implementation",
          title: "Circular Dependency Detected",
          description: `Circular dependency detected: ${cyclePath}`,
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

  // --- 5. SECURITY SECRET PATTERN CHECKS ---
  const secretPatterns = [
    /\b(password|secret|key|token|credentials)["']?\s*[:=]\s*["'][^"']+["']/i,
    /process\.env\.(API_KEY|SECRET|PASSWORD|TOKEN)/i,
    /Authorization:\s*["']Bearer\s+[a-zA-Z0-9\-\._]+["']/i
  ];

  const pkgString = JSON.stringify(pkg);
  for (const pattern of secretPatterns) {
    if (pattern.test(pkgString)) {
      issues.push({
        id: "forbidden-secret-pattern",
        severity: "error",
        category: "security",
        title: "Forbidden Secret Pattern Detected",
        description: "Agent Package contains text that resembles hardcoded secrets or credentials.",
      });
      break;
    }
  }

  if (pkg.authentication_instructions.length === 0) {
    issues.push({
      id: "no-auth-instructions",
      severity: "warning", // Not strictly an error if public only, but usually needed
      category: "security",
      title: "Missing Authentication Instructions",
      description: "No specific instructions for authentication implementation found.",
    });
  }

  // --- 6. TRACEABILITY & UPSTREAM CHECKS ---
  const traceModuleIds = new Set(pkg.traceability.map(t => t.module_id));
  
  for (const mod of pkg.modules) {
    if (!traceModuleIds.has(mod.id)) {
      issues.push({
        id: `orphan-module-${mod.id}`,
        severity: "error",
        category: "traceability",
        title: "Orphan Module",
        description: `Module '${mod.id}' has no corresponding entry in the traceability mappings.`,
        item_id: mod.id,
      });
    }
  }

  if (context) {
    const reqIds = new Set(context.blueprint.modules.flatMap(m => m.requirement_ids));
    const archIds = new Set(context.blueprint.modules.flatMap(m => m.architecture_module_ids));
    const erdEntities = new Set(context.erd.entities.map(e => e.name));
    const dfdProcs = new Set([
      ...context.dfd.context.nodes.filter(n => n.type === "process").map(n => n.id),
      ...context.dfd.level_1.nodes.filter(n => n.type === "process").map(n => n.id)
    ]);
    const fcProcs = new Set(context.flowchart.nodes.filter(n => n.type === "process").map(n => n.id));
    const bpModules = new Set(context.blueprint.modules.map(m => m.id));

    for (const trace of pkg.traceability) {
      for (const req of trace.upstream_links.requirement_ids) {
        if (!reqIds.has(req)) {
          issues.push({
            id: `invalid-req-trace-${trace.module_id}-${req}`,
            severity: "error",
            category: "traceability",
            title: "Invalid Requirement Reference",
            description: `Traceability for module '${trace.module_id}' references unknown requirement '${req}'.`,
          });
        }
      }
      for (const arch of trace.upstream_links.architecture_module_ids) {
        if (!archIds.has(arch)) {
          issues.push({
            id: `invalid-arch-trace-${trace.module_id}-${arch}`,
            severity: "error",
            category: "traceability",
            title: "Invalid Architecture Reference",
            description: `Traceability for module '${trace.module_id}' references unknown architecture module '${arch}'.`,
          });
        }
      }
      for (const erd of trace.upstream_links.erd_entity_names) {
        if (!erdEntities.has(erd)) {
          issues.push({
            id: `invalid-erd-trace-${trace.module_id}-${erd}`,
            severity: "error",
            category: "traceability",
            title: "Invalid ERD Entity Reference",
            description: `Traceability for module '${trace.module_id}' references unknown ERD entity '${erd}'.`,
          });
        }
      }
      for (const dfd of trace.upstream_links.dfd_process_ids) {
        if (!dfdProcs.has(dfd)) {
          issues.push({
            id: `invalid-dfd-trace-${trace.module_id}-${dfd}`,
            severity: "error",
            category: "traceability",
            title: "Invalid DFD Process Reference",
            description: `Traceability for module '${trace.module_id}' references unknown DFD process '${dfd}'.`,
          });
        }
      }
      for (const fc of trace.upstream_links.flowchart_process_ids) {
        if (!fcProcs.has(fc)) {
          issues.push({
            id: `invalid-fc-trace-${trace.module_id}-${fc}`,
            severity: "error",
            category: "traceability",
            title: "Invalid Flowchart Reference",
            description: `Traceability for module '${trace.module_id}' references unknown Flowchart node '${fc}'.`,
          });
        }
      }
      if (!bpModules.has(trace.upstream_links.blueprint_module_id)) {
        issues.push({
          id: `invalid-bp-trace-${trace.module_id}-${trace.upstream_links.blueprint_module_id}`,
          severity: "error",
          category: "traceability",
          title: "Invalid Blueprint Module Reference",
          description: `Traceability for module '${trace.module_id}' references unknown Blueprint module '${trace.upstream_links.blueprint_module_id}'.`,
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
