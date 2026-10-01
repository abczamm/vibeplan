import type {
  ImplementationBlueprint,
  BlueprintModule,
  DatabaseTablePlan,
  DatabaseImplementationPlan,
  ApiImplementationItem,
  ApiImplementationPlan,
  AuthenticationPlan,
  AuthorizationRolePlan,
  AuthorizationPlan,
  FrontendPagePlan,
  FrontendImplementationPlan,
  BackendServicePlan,
  BackendImplementationPlan,
  ValidationRuleItem,
  ValidationPlan,
  SecurityThreatMitigation,
  SecurityImplementationPlan,
  TestCaseRequirement,
  TestingImplementationPlan,
  ImplementationPhase,
  ImplementationDependency,
  BlueprintTraceabilityMapping,
  BlueprintTraceability,
  BlueprintMetadata,
  BlueprintReviewSeverity,
  BlueprintReviewIssueKind,
  BlueprintReviewIssue,
  BlueprintReview,
  BlueprintReviewDecisionAction,
  BlueprintReviewDecision,
  BlueprintUpstreamContext,
  BlueprintValidationIssue,
  BlueprintValidationResult
} from "./blueprint";
export type { ImplementationBlueprint, BlueprintModule, DatabaseTablePlan, DatabaseImplementationPlan, ApiImplementationItem, ApiImplementationPlan, AuthenticationPlan, AuthorizationRolePlan, AuthorizationPlan, FrontendPagePlan, FrontendImplementationPlan, BackendServicePlan, BackendImplementationPlan, ValidationRuleItem, ValidationPlan, SecurityThreatMitigation, SecurityImplementationPlan, TestCaseRequirement, TestingImplementationPlan, ImplementationPhase, ImplementationDependency, BlueprintTraceabilityMapping, BlueprintTraceability, BlueprintMetadata, BlueprintReviewSeverity, BlueprintReviewIssueKind, BlueprintReviewIssue, BlueprintReview, BlueprintReviewDecisionAction, BlueprintReviewDecision, BlueprintUpstreamContext, BlueprintValidationIssue, BlueprintValidationResult };
import type {
  AgentContract,
  ProjectRule,
  ImplementationStrategy,
  AgentModule,
  DatabaseInstruction,
  AgentApiContract,
  FrontendInstruction,
  BackendInstruction,
  AuthenticationInstruction,
  AuthorizationInstruction,
  ValidationInstruction,
  SecurityInstruction,
  TestingInstruction,
  ForbiddenChange,
  UncertaintyProtocol,
  DefinitionOfDone,
  AgentTraceability,
  AgentPackageMetadata,
  AgentPackageDocument,
  AgentPackageReviewSeverity,
  AgentPackageReviewIssueKind,
  AgentPackageReviewIssue,
  AgentPackageReview,
  AgentPackageReviewDecisionAction,
  AgentPackageReviewDecision,
  AgentPackageUpstreamContext,
  AgentPackageValidationIssue,
  AgentPackageValidationResult
} from "./agent-package";
export type { AgentContract, ProjectRule, ImplementationStrategy, AgentModule, DatabaseInstruction, AgentApiContract, FrontendInstruction, BackendInstruction, AuthenticationInstruction, AuthorizationInstruction, ValidationInstruction, SecurityInstruction, TestingInstruction, ForbiddenChange, UncertaintyProtocol, DefinitionOfDone, AgentTraceability, AgentPackageMetadata, AgentPackageDocument, AgentPackageReviewSeverity, AgentPackageReviewIssueKind, AgentPackageReviewIssue, AgentPackageReview, AgentPackageReviewDecisionAction, AgentPackageReviewDecision, AgentPackageUpstreamContext, AgentPackageValidationIssue, AgentPackageValidationResult };
import type {
  DesignPrinciple,
  DesignTokens,
  TypographySystem,
  ColorSystem,
  SpacingSystem,
  RadiusSystem,
  ElevationSystem,
  ComponentSystem,
  LayoutRules,
  ResponsiveRules,
  NavigationSystem,
  PagePattern,
  FormPattern,
  TablePattern,
  FeedbackStateSystem,
  AccessibilityRule,
  InteractionRules,
  ScreenSpecification,
  DesignTraceability,
  DesignSystemMetadata,
  DesignSystemDocument,
  DesignSystemReviewSeverity,
  DesignSystemReviewCategory,
  DesignSystemReviewIssue,
  DesignSystemReview,
  DesignSystemReviewDecisionAction,
  DesignSystemReviewDecision,
  DesignSystemUpstreamContext,
  DesignSystemValidationIssue,
  DesignSystemValidationResult,
  DesignSystemApprovalInput,
  DesignSystemApprovalResult
} from "./design-system";
export type { DesignPrinciple, DesignTokens, TypographySystem, ColorSystem, SpacingSystem, RadiusSystem, ElevationSystem, ComponentSystem, LayoutRules, ResponsiveRules, NavigationSystem, PagePattern, FormPattern, TablePattern, FeedbackStateSystem, AccessibilityRule, InteractionRules, ScreenSpecification, DesignTraceability, DesignSystemMetadata, DesignSystemDocument, DesignSystemReviewSeverity, DesignSystemReviewCategory, DesignSystemReviewIssue, DesignSystemReview, DesignSystemReviewDecisionAction, DesignSystemReviewDecision, DesignSystemUpstreamContext, DesignSystemValidationIssue, DesignSystemValidationResult, DesignSystemApprovalInput, DesignSystemApprovalResult };

import type { CodingAgentResponse, WorkspaceFile } from "./coding-agent";

import type {
  PhaseKind,
  TaskPriority,
  EngineeringTraceability,
  ProjectSummary,
  EngineeringPrinciple,
  RepositoryStrategy,
  TechnologyStackEntry,
  EnvironmentRequirements,
  DirectoryStructure,
  ModulePlan,
  DatabaseImplementation,
  AuthenticationImplementation,
  AuthorizationImplementation,
  FrontendImplementation,
  BackendImplementation,
  ValidationStrategy,
  ErrorHandling,
  SecurityImplementation,
  TestingStrategy,
  ImplementationTask,
  ExternalDependency,
  CompletionCheck,
  EngineeringPlanDocument,
  EngineeringReviewSeverity,
  EngineeringReviewCategory,
  EngineeringReviewIssue,
  EngineeringReview,
  EngineeringReviewDecisionAction,
  EngineeringReviewDecision,
  EngineeringPlanUpstreamContext,
  EngineeringValidationIssue,
  EngineeringValidationResult,
  EngineeringApprovalInput,
  EngineeringApprovalResult
} from "./engineering-plan";
export type { PhaseKind, TaskPriority, EngineeringTraceability, ProjectSummary, EngineeringPrinciple, RepositoryStrategy, TechnologyStackEntry, EnvironmentRequirements, DirectoryStructure, ModulePlan, DatabaseImplementation, AuthenticationImplementation, AuthorizationImplementation, FrontendImplementation, BackendImplementation, ValidationStrategy, ErrorHandling, SecurityImplementation, TestingStrategy, ImplementationTask, ExternalDependency, CompletionCheck, EngineeringPlanDocument, EngineeringReviewSeverity, EngineeringReviewCategory, EngineeringReviewIssue, EngineeringReview, EngineeringReviewDecisionAction, EngineeringReviewDecision, EngineeringPlanUpstreamContext, EngineeringValidationIssue, EngineeringValidationResult, EngineeringApprovalInput, EngineeringApprovalResult };
export type DiscoveryState = {
  idea: string;
  target_users: string[];
  goals: string[];
  features: string[];
  roles: string[];
  business_rules: string[];
  constraints: string[];
  integrations: string[];
  technical_preferences: string[];
  security_requirements: string[];
};

export type RequirementsDraft = {
  overview: string;
  users_and_roles: string[];
  functional_requirements: string[];
  business_rules: string[];
  technical_requirements: string[];
  security_requirements: string[];
  reporting_requirements: string[];
  constraints: string[];
  scope_in: string[];
  scope_out: string[];
};

export type InteractionMode =
  | "question"
  | "recommendation"
  | "choice"
  | "confirmation"
  | "custom"
  | "review";

export type InteractionOption = {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
};

export type DiscoveryInteraction = {
  mode: InteractionMode;
  options?: InteractionOption[];
  allow_custom: boolean;
};

export type DiscoveryAIResponse = {
  assistant_message: string;
  interaction: DiscoveryInteraction;
  state_updates: Partial<DiscoveryState>;
  next_question: string | null;
  phase: "initial" | "clarifying" | "synthesis" | "approval" | "completed";
  requirements_draft?: RequirementsDraft;
};

export type ReviewIssueSeverity = "important" | "minor";

export type ReviewIssueKind =
  | "missing_requirement"
  | "ambiguous_requirement"
  | "conflicting_requirement"
  | "recommended_improvement";

export type RequirementsReviewIssue = {
  id: string;
  severity: ReviewIssueSeverity;
  kind: ReviewIssueKind;
  section: string;
  title: string;
  description: string;
  recommendation: string;
  requires_user_decision: boolean;
};

export type RequirementsReview = {
  summary: string;
  issues: RequirementsReviewIssue[];
  ready_for_approval: boolean;
};

export type ReviewDecisionAction = "accept" | "reject" | "custom";

export type ReviewDecision = {
  issue_id: string;
  action: ReviewDecisionAction;
  custom_text?: string;
  resolved_at: string;
};

export type ArchitectureModule = {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  actors: string[];
};

export type ArchitectureActor = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

export type ArchitectureEntity = {
  id: string;
  name: string;
  description: string;
  attributes: {
    name: string;
    type: string;
    required: boolean;
    unique?: boolean;
  }[];
};

export type ArchitectureRelationship = {
  from: string;
  to: string;
  type: "one_to_one" | "one_to_many" | "many_to_many";
  description?: string;
};

export type ArchitectureLayer = {
  id: string;
  name: string;
  responsibility: string;
  technologies: string[];
};

export type ArchitectureDocument = {
  overview: string;
  architectural_style: string;
  modules: ArchitectureModule[];
  actors: ArchitectureActor[];
  entities: ArchitectureEntity[];
  relationships: ArchitectureRelationship[];
  layers: ArchitectureLayer[];
  technology_decisions: {
    category: string;
    technology: string;
    rationale: string;
  }[];
  constraints: string[];
  security_considerations: string[];
  assumptions: string[];
};

export type ArchitectureReviewIssueKind =
  | "requirement_mismatch"
  | "missing_entity"
  | "missing_actor"
  | "missing_module"
  | "invalid_relationship"
  | "scope_expansion"
  | "technology_issue"
  | "security_issue"
  | "layering_issue"
  | "architecture_complexity"
  | "missing_assumption"
  | "ambiguous_decision"
  | "recommended_improvement";

export type ArchitectureReviewSeverity = "important" | "minor";

export type ArchitectureReviewIssue = {
  id: string;
  severity: ArchitectureReviewSeverity;
  kind: ArchitectureReviewIssueKind;
  section: string;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  requires_user_decision: boolean;
};

export type ArchitectureReview = {
  summary: string;
  issues: ArchitectureReviewIssue[];
  ready_for_approval: boolean;
};

export type ERDColumnType =
  | "uuid"
  | "integer"
  | "bigint"
  | "decimal"
  | "boolean"
  | "text"
  | "varchar"
  | "date"
  | "time"
  | "timestamp"
  | "timestamptz"
  | "jsonb"
  | "enum";

export type ERDColumn = {
  name: string;
  type: ERDColumnType;
  nullable: boolean;
  primary_key: boolean;
  unique: boolean;
  default_value?: string | null;
  references?: {
    entity: string;
    column: string;
  } | null;
  description: string;
};

export type ERDEntity = {
  name: string;
  table_name: string;
  description: string;
  columns: ERDColumn[];
};

export type ERDRelationshipCardinality = "1:1" | "1:N" | "N:1" | "N:M";

export type ERDRelationship = {
  id: string;
  from_entity: string;
  to_entity: string;
  cardinality: ERDRelationshipCardinality;
  foreign_key?: {
    entity: string;
    column: string;
  } | null;
  description: string;
};

export type ERDIndex = {
  name: string;
  entity: string;
  columns: string[];
  unique: boolean;
  reason: string;
};

export type ERDConstraint = {
  id: string;
  entity: string;
  type: "primary_key" | "foreign_key" | "unique" | "check" | "not_null";
  description: string;
};

export type ERDAssumption = {
  id: string;
  description: string;
  reason: string;
};

export type ERDDocument = {
  version: number;
  database: "postgresql";
  summary: string;
  entities: ERDEntity[];
  relationships: ERDRelationship[];
  indexes: ERDIndex[];
  constraints: ERDConstraint[];
  assumptions: ERDAssumption[];
  _metadata?: {
    source_requirements_document_id: string;
    source_architecture_document_id: string;
  };
};

export type ERDReviewIssueKind =
  | "normalization_issue"
  | "missing_foreign_key"
  | "invalid_relationship"
  | "missing_constraint"
  | "missing_index"
  | "redundant_entity"
  | "redundant_column"
  | "inappropriate_data_type"
  | "inappropriate_jsonb"
  | "primary_key_issue"
  | "business_rule_issue"
  | "historical_data_issue"
  | "security_model_issue"
  | "naming_issue"
  | "traceability_issue"
  | "complexity_issue"
  | "recommended_improvement";

export type ERDReviewSeverity = "important" | "minor";

export type ERDReviewIssue = {
  id: string;
  severity: ERDReviewSeverity;
  kind: ERDReviewIssueKind;
  entity?: string;
  column?: string;
  relationship?: string;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  requires_user_decision: boolean;
};

export type ERDReview = {
  summary: string;
  issues: ERDReviewIssue[];
  ready_for_approval: boolean;
};

export type DFDLevel = "context" | "level_1";
export type DFDNodeType = "external_entity" | "process" | "data_store";

export type DFDNode = {
  id: string;
  type: DFDNodeType;
  name: string;
  description?: string;
  process_code?: string;
  source_references?: {
    requirements?: string[];
    architecture?: string[];
    erd_entities?: string[];
  };
};

export type DFDDataFlow = {
  id: string;
  name: string;
  description?: string;
  source_node_id: string;
  target_node_id: string;
  data_elements?: string[];
  source_references?: {
    requirements?: string[];
    architecture?: string[];
    erd_entities?: string[];
  };
};

export type DFDLevelDocument = {
  level: DFDLevel;
  nodes: DFDNode[];
  flows: DFDDataFlow[];
};

export type DFDDataStoreMapping = {
  dfd_node_id: string;
  erd_entity: string;
  reason: string;
};

export type DFDProcessMapping = {
  dfd_process_id: string;
  requirements?: string[];
  architecture_modules?: string[];
  erd_entities?: string[];
  reason: string;
};

export type DFDDocument = {
  version: string;
  title: string;
  description: string;
  context: DFDLevelDocument;
  level_1: DFDLevelDocument;
  data_store_mapping: DFDDataStoreMapping[];
  process_mapping: DFDProcessMapping[];
  assumptions: string[];
  _metadata?: {
    source_requirements_document_id: string;
    source_architecture_document_id: string;
    source_erd_document_id: string;
  };
};

export type DFDReviewIssueKind =
  | "context_balance_issue"
  | "level_1_balance_issue"
  | "missing_external_entity"
  | "redundant_external_entity"
  | "process_input_output_issue"
  | "invalid_process"
  | "missing_data_flow"
  | "invalid_data_flow"
  | "redundant_data_flow"
  | "orphan_data_store"
  | "missing_data_store"
  | "invalid_data_store"
  | "process_traceability_issue"
  | "data_store_traceability_issue"
  | "requirements_traceability_issue"
  | "architecture_traceability_issue"
  | "erd_traceability_issue"
  | "system_boundary_issue"
  | "level_1_decomposition_issue"
  | "process_numbering_issue"
  | "scope_creep"
  | "security_model_issue"
  | "complexity_issue"
  | "recommended_improvement";

export type DFDReviewSeverity = "important" | "minor";

export type DFDReviewIssue = {
  id: string;
  severity: DFDReviewSeverity;
  kind: DFDReviewIssueKind;
  node_id?: string;
  flow_id?: string;
  process_code?: string;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  requires_user_decision: boolean;
};

export type DFDReview = {
  summary: string;
  issues: DFDReviewIssue[];
  ready_for_approval: boolean;
};

export type FlowchartNodeType =
  | "start"
  | "end"
  | "process"
  | "decision"
  | "input"
  | "output"
  | "subprocess"
  | "validation"
  | "error"
  | "connector";

export type FlowchartNode = {
  id: string;
  type: FlowchartNodeType;
  label: string;
  description?: string;
  process_code?: string;
  requirement_ids?: string[];
  architecture_module_ids?: string[];
  dfd_process_ids?: string[];
  erd_entity_ids?: string[];
};

export type FlowchartEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  is_default?: boolean;
};

export type FlowchartProcess = {
  id: string;
  code: string;
  name: string;
  purpose?: string;
  node_ids: string[];
  entry_node_id: string;
  exit_node_ids: string[];
  requirement_ids: string[];
  architecture_module_ids: string[];
  dfd_process_ids: string[];
};

export type FlowchartDocument = {
  version: string;
  title: string;
  description: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  processes: FlowchartProcess[];
  assumptions: string[];
  _metadata?: {
    source_requirements_document_id: string;
    source_architecture_document_id: string;
    source_erd_document_id: string;
    source_dfd_document_id: string;
  };
};

export type FlowchartValidationCategory =
  | "graph"
  | "decision"
  | "traceability"
  | "scope"
  | "data"
  | "architecture"
  | "dfd_consistency";

export type FlowchartValidationSeverity = "error" | "warning";

export type FlowchartValidationIssue = {
  id: string;
  category: FlowchartValidationCategory;
  severity: FlowchartValidationSeverity;
  message: string;
  node_id?: string;
  edge_id?: string;
  process_code?: string;
};

export type FlowchartValidationResult = {
  valid: boolean;
  issues: FlowchartValidationIssue[];
};

export type FlowchartUpstreamContext = {
  requirement_texts?: string[];
  architecture_module_ids?: string[];
  architecture_module_names?: string[];
  dfd_process_ids?: string[];
  dfd_process_codes?: string[];
  dfd_process_names?: string[];
  erd_entity_names?: string[];
  erd_table_names?: string[];
};

export interface AIProvider {
  generateDiscoveryResponse(input: {
    projectName: string;
    projectDescription: string | null;
    state: DiscoveryState;
    messages: {
      role: "user" | "assistant";
      content: string;
    }[];
    isSynthesis?: boolean;
  }): Promise<DiscoveryAIResponse>;

  generateRequirementsReview(input: {
    projectName: string;
    draft: RequirementsDraft;
  }): Promise<RequirementsReview>;

  generateArchitecture(input: {
    projectName: string;
    requirements: RequirementsDraft;
  }): Promise<ArchitectureDocument>;

  generateArchitectureReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
  }): Promise<ArchitectureReview>;

  generateERD(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
  }): Promise<ERDDocument>;

  generateERDReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
  }): Promise<ERDReview>;

  generateDFD(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
  }): Promise<DFDDocument>;

  generateDFDReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
  }): Promise<DFDReview>;

  generateFlowchart(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
  }): Promise<FlowchartDocument>;

  generateFlowchartReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
  }): Promise<FlowchartReview>;

  generateImplementationBlueprint(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
  }): Promise<ImplementationBlueprint>;

  generateBlueprintReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
  }): Promise<BlueprintReview>;

  generateAgentPackage(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
  }): Promise<AgentPackageDocument>;

  generateAgentPackageReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
    packageDoc: AgentPackageDocument;
  }): Promise<AgentPackageReview>;

  generateDesignSystem(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
  }): Promise<DesignSystemDocument>;

  generateDesignSystemReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
    designSystemDoc: DesignSystemDocument;
  }): Promise<DesignSystemReview>;

  generateEngineeringPlan(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
    packageDoc: AgentPackageDocument;
    designSystemDoc: DesignSystemDocument;
  }): Promise<EngineeringPlanDocument>;

  generateEngineeringPlanReview(input: {
    projectName: string;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
    packageDoc: AgentPackageDocument;
    designSystemDoc: DesignSystemDocument;
    planDoc: EngineeringPlanDocument;
  }): Promise<EngineeringReview>;

  generateCodingAgentImplementation(input: {
    projectName: string;
    task: ImplementationTask;
    agentPackage: AgentPackageDocument;
    designSystem: DesignSystemDocument;
    requirements: RequirementsDraft;
    architecture: ArchitectureDocument;
    erd: ERDDocument;
    dfd: DFDDocument;
    flowchart: FlowchartDocument;
    blueprint: ImplementationBlueprint;
    workspaceFiles: WorkspaceFile[];
    previousError?: string;
  }): Promise<CodingAgentResponse>;
}

export type FlowchartReviewSeverity = "important" | "minor";

export type FlowchartReviewIssueKind =
  | "missing_start"
  | "missing_end"
  | "unreachable_node"
  | "disconnected_node"
  | "orphan_edge"
  | "invalid_edge_direction"
  | "invalid_decision"
  | "missing_decision_branch"
  | "unlabeled_decision_branch"
  | "invalid_default_branch"
  | "invalid_loop"
  | "dead_end_process"
  | "missing_process_entry"
  | "missing_process_exit"
  | "duplicate_process"
  | "invalid_process_reference"
  | "missing_requirement_traceability"
  | "missing_architecture_traceability"
  | "missing_dfd_traceability"
  | "invalid_dfd_traceability"
  | "invalid_erd_reference"
  | "uncovered_dfd_process"
  | "uncovered_requirement"
  | "scope_creep"
  | "inconsistent_business_rule"
  | "inconsistent_upstream_artifact"
  | "error_path_missing"
  | "validation_path_missing"
  | "ambiguous_process"
  | "recommended_improvement";

export type FlowchartReviewIssue = {
  id: string;
  severity: FlowchartReviewSeverity;
  kind: FlowchartReviewIssueKind;
  section: string;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  node_id?: string;
  edge_id?: string;
  process_code?: string;
  requires_user_decision: boolean;
};

export type FlowchartReview = {
  summary: string;
  issues: FlowchartReviewIssue[];
  ready_for_approval: boolean;
};

export type FlowchartReviewDecisionAction = "accept" | "ignore" | "custom";

export type FlowchartReviewDecision = {
  issue_id: string;
  action: FlowchartReviewDecisionAction;
  custom_text?: string;
  resolved_at: string;
};


