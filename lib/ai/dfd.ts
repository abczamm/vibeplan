import { z } from "zod";
import type { DFDDocument, DFDLevelDocument } from "./types";

export const dfdLevelSchema = z.enum(["context", "level_1"]);
export const dfdNodeTypeSchema = z.enum([
  "external_entity",
  "process",
  "data_store",
]);

export const dfdSourceReferencesSchema = z.object({
  requirements: z.array(z.string()).optional(),
  architecture: z.array(z.string()).optional(),
  erd_entities: z.array(z.string()).optional(),
});

export const dfdNodeSchema = z.object({
  id: z.string().min(1),
  type: dfdNodeTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  process_code: z.string().optional(),
  source_references: dfdSourceReferencesSchema.optional(),
});

export const dfdDataFlowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  source_node_id: z.string().min(1),
  target_node_id: z.string().min(1),
  data_elements: z.array(z.string()).optional(),
  source_references: dfdSourceReferencesSchema.optional(),
});

export const dfdLevelDocumentSchema = z.object({
  level: dfdLevelSchema,
  nodes: z.array(dfdNodeSchema),
  flows: z.array(dfdDataFlowSchema),
});

export const dfdDataStoreMappingSchema = z.object({
  dfd_node_id: z.string().min(1),
  erd_entity: z.string().min(1),
  reason: z.string().min(1),
});

export const dfdProcessMappingSchema = z.object({
  dfd_process_id: z.string().min(1),
  requirements: z.array(z.string()).optional(),
  architecture_modules: z.array(z.string()).optional(),
  erd_entities: z.array(z.string()).optional(),
  reason: z.string().min(1),
});

export const dfdDocumentSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  context: dfdLevelDocumentSchema,
  level_1: dfdLevelDocumentSchema,
  data_store_mapping: z.array(dfdDataStoreMappingSchema),
  process_mapping: z.array(dfdProcessMappingSchema),
  assumptions: z.array(z.string()),
  _metadata: z.any().optional(),
});

export const dfdReviewIssueKindSchema = z.enum([
  "context_balance_issue",
  "level_1_balance_issue",
  "missing_external_entity",
  "redundant_external_entity",
  "process_input_output_issue",
  "invalid_process",
  "missing_data_flow",
  "invalid_data_flow",
  "redundant_data_flow",
  "orphan_data_store",
  "missing_data_store",
  "invalid_data_store",
  "process_traceability_issue",
  "data_store_traceability_issue",
  "requirements_traceability_issue",
  "architecture_traceability_issue",
  "erd_traceability_issue",
  "system_boundary_issue",
  "level_1_decomposition_issue",
  "process_numbering_issue",
  "scope_creep",
  "security_model_issue",
  "complexity_issue",
  "recommended_improvement",
]);

export const dfdReviewSeveritySchema = z.enum(["important", "minor"]);

export const dfdReviewIssueSchema = z.object({
  id: z.string().min(1),
  severity: dfdReviewSeveritySchema,
  kind: dfdReviewIssueKindSchema,
  node_id: z.string().optional(),
  flow_id: z.string().optional(),
  process_code: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().min(1),
  recommendation: z.string().min(1),
  requires_user_decision: z.boolean(),
});

export const dfdReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(dfdReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export function validateDFDDocument(doc: DFDDocument): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const checkLevel = (levelDoc: DFDLevelDocument, levelName: string) => {
    const nodeIds = new Set<string>();
    const processCodes = new Set<string>();
    const flowIds = new Set<string>();

    let centralProcessCount = 0;

    for (const node of levelDoc.nodes) {
      if (nodeIds.has(node.id)) {
        errors.push(`[${levelName}] Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      if (levelName === "context" && node.type === "process") {
        centralProcessCount++;
      }

      if (node.type === "process" && node.process_code) {
        if (processCodes.has(node.process_code)) {
          errors.push(`[${levelName}] Duplicate process_code: ${node.process_code}`);
        }
        processCodes.add(node.process_code);
      }
    }

    if (levelName === "context" && centralProcessCount !== 1) {
      errors.push(
        `[${levelName}] Context diagram must have exactly one central process. Found: ${centralProcessCount}`,
      );
    }

    for (const flow of levelDoc.flows) {
      if (flowIds.has(flow.id)) {
        errors.push(`[${levelName}] Duplicate flow ID: ${flow.id}`);
      }
      flowIds.add(flow.id);

      if (!nodeIds.has(flow.source_node_id)) {
        errors.push(
          `[${levelName}] Flow '${flow.id}' references missing source_node_id '${flow.source_node_id}'`,
        );
      }
      if (!nodeIds.has(flow.target_node_id)) {
        errors.push(
          `[${levelName}] Flow '${flow.id}' references missing target_node_id '${flow.target_node_id}'`,
        );
      }
    }
    
    // Check for orphan nodes
    for (const node of levelDoc.nodes) {
      const isConnected = levelDoc.flows.some(
        (f) => f.source_node_id === node.id || f.target_node_id === node.id
      );
      if (!isConnected) {
        errors.push(`[${levelName}] Orphan node detected: '${node.id}' (${node.name}) has no flows.`);
      }
    }
  };

  checkLevel(doc.context, "context");
  checkLevel(doc.level_1, "level_1");

  // Validate mappings
  const level1ProcessIds = new Set(
    doc.level_1.nodes.filter((n) => n.type === "process").map((n) => n.id)
  );
  for (const pm of doc.process_mapping) {
    if (!level1ProcessIds.has(pm.dfd_process_id)) {
      errors.push(`Process mapping references missing process ID '${pm.dfd_process_id}' in Level 1.`);
    }
  }

  const level1DataStoreIds = new Set(
    doc.level_1.nodes.filter((n) => n.type === "data_store").map((n) => n.id)
  );
  for (const ds of doc.data_store_mapping) {
    if (!level1DataStoreIds.has(ds.dfd_node_id)) {
      errors.push(`Data store mapping references missing store ID '${ds.dfd_node_id}' in Level 1.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
