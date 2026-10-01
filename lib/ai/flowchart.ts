import { z } from "zod";
import type {
  FlowchartDocument,
  FlowchartEdge,
  FlowchartNode,
  FlowchartNodeType,
  FlowchartProcess,
  FlowchartUpstreamContext,
  FlowchartValidationIssue,
  FlowchartValidationResult,
} from "./types";

export const flowchartReviewSeveritySchema = z.enum(["important", "minor"]);

export const flowchartReviewIssueKindSchema = z.enum([
  "missing_start",
  "missing_end",
  "unreachable_node",
  "disconnected_node",
  "orphan_edge",
  "invalid_edge_direction",
  "invalid_decision",
  "missing_decision_branch",
  "unlabeled_decision_branch",
  "invalid_default_branch",
  "invalid_loop",
  "dead_end_process",
  "missing_process_entry",
  "missing_process_exit",
  "duplicate_process",
  "invalid_process_reference",
  "missing_requirement_traceability",
  "missing_architecture_traceability",
  "missing_dfd_traceability",
  "invalid_dfd_traceability",
  "invalid_erd_reference",
  "uncovered_dfd_process",
  "uncovered_requirement",
  "scope_creep",
  "inconsistent_business_rule",
  "inconsistent_upstream_artifact",
  "error_path_missing",
  "validation_path_missing",
  "ambiguous_process",
  "recommended_improvement",
]);

export const flowchartReviewIssueSchema = z.object({
  id: z.string().min(1),
  severity: flowchartReviewSeveritySchema,
  kind: flowchartReviewIssueKindSchema,
  section: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().min(1),
  recommendation: z.string().min(1),
  node_id: z.string().optional(),
  edge_id: z.string().optional(),
  process_code: z.string().optional(),
  requires_user_decision: z.boolean(),
});

export const flowchartReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(flowchartReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export const flowchartReviewDecisionActionSchema = z.enum([
  "accept",
  "ignore",
  "custom",
]);

export const flowchartReviewDecisionSchema = z.object({
  issue_id: z.string().min(1),
  action: flowchartReviewDecisionActionSchema,
  custom_text: z.string().optional(),
  resolved_at: z.string(),
});

export const flowchartNodeTypeSchema = z.enum([
  "start",
  "end",
  "process",
  "decision",
  "input",
  "output",
  "subprocess",
  "validation",
  "error",
  "connector",
]);

export const flowchartNodeSchema = z.object({
  id: z.string().min(1),
  type: flowchartNodeTypeSchema,
  label: z.string().min(1),
  description: z.string().optional(),
  process_code: z.string().optional(),
  requirement_ids: z.array(z.string()).optional(),
  architecture_module_ids: z.array(z.string()).optional(),
  dfd_process_ids: z.array(z.string()).optional(),
  erd_entity_ids: z.array(z.string()).optional(),
});

export const flowchartEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  condition: z.string().optional(),
  is_default: z.boolean().optional(),
});

export const flowchartProcessSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string().optional(),
  node_ids: z.array(z.string()),
  entry_node_id: z.string().min(1),
  exit_node_ids: z.array(z.string()),
  requirement_ids: z.array(z.string()),
  architecture_module_ids: z.array(z.string()),
  dfd_process_ids: z.array(z.string()),
});

export const flowchartDocumentSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  nodes: z.array(flowchartNodeSchema),
  edges: z.array(flowchartEdgeSchema),
  processes: z.array(flowchartProcessSchema),
  assumptions: z.array(z.string()),
  _metadata: z.any().optional(),
});

const NODE_TYPES: ReadonlySet<FlowchartNodeType> = new Set<FlowchartNodeType>([
  "start",
  "end",
  "process",
  "decision",
  "input",
  "output",
  "subprocess",
  "validation",
  "error",
  "connector",
]);

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesReference(ref: string, candidates: string[]): boolean {
  const target = normalize(ref);
  if (target === "") return false;
  return candidates.some((candidate) => {
    const value = normalize(candidate);
    if (value === "") return false;
    return value === target || value.includes(target) || target.includes(value);
  });
}

/**
 * Deterministic semantic + graph validation for a FlowchartDocument.
 *
 * Zod validates the shape; this validates meaning and graph integrity.
 * When an `context` (the approved upstream artifacts) is supplied, cross
 * document traceability is verified as well.
 *
 * Severity `error` issues block persistence (`valid === false`).
 * Severity `warning` issues are surfaced for human review in the UI.
 */
export function validateFlowchartDocument(
  doc: FlowchartDocument,
  context?: FlowchartUpstreamContext,
): FlowchartValidationResult {
  const issues: FlowchartValidationIssue[] = [];
  const issuedIds = new Set<string>();

  const add = (issue: FlowchartValidationIssue) => {
    if (issuedIds.has(issue.id)) return;
    issuedIds.add(issue.id);
    issues.push(issue);
  };

  const nodeById = new Map<string, FlowchartNode>();
  const seenNodeIds = new Set<string>();

  for (const node of doc.nodes) {
    if (seenNodeIds.has(node.id)) {
      add({
        id: `node-duplicate-id-${node.id}`,
        category: "graph",
        severity: "error",
        message: `Duplicate node ID: "${node.id}".`,
        node_id: node.id,
      });
      continue;
    }
    seenNodeIds.add(node.id);
    nodeById.set(node.id, node);

    if (!NODE_TYPES.has(node.type)) {
      add({
        id: `node-invalid-type-${node.id}`,
        category: "graph",
        severity: "error",
        message: `Node "${node.id}" has an invalid node type "${String(node.type)}".`,
        node_id: node.id,
      });
    }

    if (node.label.trim() === "") {
      add({
        id: `node-empty-label-${node.id}`,
        category: "graph",
        severity: "error",
        message: `Node "${node.id}" has an empty label.`,
        node_id: node.id,
      });
    }
  }

  const outgoing = new Map<string, FlowchartEdge[]>();
  const incoming = new Map<string, FlowchartEdge[]>();
  const seenEdgeIds = new Set<string>();
  const seenEdgePairs = new Map<string, string>();
  const validEdges: FlowchartEdge[] = [];

  const pushInto = (map: Map<string, FlowchartEdge[]>, key: string, edge: FlowchartEdge) => {
    const list = map.get(key);
    if (list) list.push(edge);
    else map.set(key, [edge]);
  };

  for (const edge of doc.edges) {
    if (seenEdgeIds.has(edge.id)) {
      add({
        id: `edge-duplicate-id-${edge.id}`,
        category: "graph",
        severity: "error",
        message: `Duplicate edge ID: "${edge.id}".`,
        edge_id: edge.id,
      });
      continue;
    }
    seenEdgeIds.add(edge.id);

    const sourceExists = nodeById.has(edge.source);
    const targetExists = nodeById.has(edge.target);

    if (!sourceExists || !targetExists) {
      add({
        id: `edge-orphan-${edge.id}`,
        category: "graph",
        severity: "error",
        message: `Edge "${edge.id}" references ${
          !sourceExists && !targetExists
            ? `missing source "${edge.source}" and missing target "${edge.target}"`
            : !sourceExists
              ? `missing source "${edge.source}"`
              : `missing target "${edge.target}"`
        }.`,
        edge_id: edge.id,
      });
      continue;
    }

    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);

    if (edge.source === edge.target) {
      add({
        id: `edge-self-loop-${edge.id}`,
        category: "graph",
        severity: "warning",
        message: `Edge "${edge.id}" is a self-loop on "${edge.source}". Self-loops are only valid when they represent an intentional retry path.`,
        edge_id: edge.id,
        node_id: edge.source,
      });
    }

    if (targetNode && targetNode.type === "start") {
      add({
        id: `edge-into-start-${edge.id}`,
        category: "graph",
        severity: "error",
        message: `Edge "${edge.id}" points into the START node "${edge.target}". START nodes must not have incoming edges.`,
        edge_id: edge.id,
        node_id: edge.target,
      });
    }

    if (sourceNode && sourceNode.type === "end") {
      add({
        id: `edge-out-of-end-${edge.id}`,
        category: "graph",
        severity: "error",
        message: `Edge "${edge.id}" leaves the END node "${edge.source}". END nodes must be terminal.`,
        edge_id: edge.id,
        node_id: edge.source,
      });
    }

    const pairKey = `${edge.source}→${edge.target}::${normalize(edge.label ?? "")}|${normalize(edge.condition ?? "")}`;
    const firstEdgeForPair = seenEdgePairs.get(pairKey);
    if (firstEdgeForPair) {
      add({
        id: `edge-duplicate-pair-${edge.id}`,
        category: "graph",
        severity: "error",
        message: `Edge "${edge.id}" duplicates edge "${firstEdgeForPair}" (${edge.source} → ${edge.target}).`,
        edge_id: edge.id,
      });
      continue;
    }
    seenEdgePairs.set(pairKey, edge.id);

    validEdges.push(edge);
    pushInto(outgoing, edge.source, edge);
    pushInto(incoming, edge.target, edge);
  }

  const startNodes = doc.nodes.filter((n) => n.type === "start");
  const endNodes = doc.nodes.filter((n) => n.type === "end");

  if (startNodes.length === 0) {
    add({
      id: "graph-missing-start",
      category: "graph",
      severity: "error",
      message: "The flowchart has no START node.",
    });
  } else if (startNodes.length > 1) {
    add({
      id: "graph-multiple-starts",
      category: "graph",
      severity: "warning",
      message: `The flowchart has ${startNodes.length} START nodes. Prefer exactly one entry point per business process.`,
    });
  }

  if (endNodes.length === 0) {
    add({
      id: "graph-missing-end",
      category: "graph",
      severity: "error",
      message: "The flowchart has no END node.",
    });
  }

  if (doc.nodes.length > 1) {
    for (const node of doc.nodes) {
      const hasOut = (outgoing.get(node.id) ?? []).length > 0;
      const hasIn = (incoming.get(node.id) ?? []).length > 0;
      if (!hasIn && !hasOut) {
        add({
          id: `graph-disconnected-node-${node.id}`,
          category: "graph",
          severity: "error",
          message: `Node "${node.id}" (${node.label}) is disconnected — it has no incoming or outgoing edges.`,
          node_id: node.id,
        });
      }
    }
  }

  if (startNodes.length > 0 && endNodes.length > 0 && doc.nodes.length > 1) {
    const reachable = new Set<string>();
    const queue: string[] = startNodes.map((n) => n.id);
    for (const id of queue) reachable.add(id);

    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const edge of outgoing.get(current) ?? []) {
        if (!reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    for (const node of doc.nodes) {
      if (!reachable.has(node.id)) {
        add({
          id: `graph-unreachable-node-${node.id}`,
          category: "graph",
          severity: "error",
          message: `Node "${node.id}" (${node.label}) is unreachable from the START node.`,
          node_id: node.id,
        });
      }
    }

    if (!endNodes.some((n) => reachable.has(n.id))) {
      add({
        id: "graph-end-unreachable",
        category: "graph",
        severity: "error",
        message: "No END node is reachable from the START node.",
      });
    }

    for (const node of doc.nodes) {
      if (node.type === "start") continue;
      if ((incoming.get(node.id) ?? []).length === 0) {
        add({
          id: `graph-no-predecessor-${node.id}`,
          category: "graph",
          severity: "error",
          message: `Node "${node.id}" (${node.label}) has no predecessor.`,
          node_id: node.id,
        });
      }
    }

    for (const node of doc.nodes) {
      if (node.type === "end") continue;
      if ((outgoing.get(node.id) ?? []).length === 0) {
        add({
          id: `graph-no-successor-${node.id}`,
          category: "graph",
          severity: "error",
          message: `Node "${node.id}" (${node.label}) has no successor. Non-terminal nodes must continue or terminate at END.`,
          node_id: node.id,
        });
      }
    }
  }

  for (const node of doc.nodes) {
    if (node.type !== "decision") continue;

    const branches = outgoing.get(node.id) ?? [];

    if (branches.length === 0) {
      add({
        id: `decision-no-branch-${node.id}`,
        category: "decision",
        severity: "error",
        message: `Decision "${node.label}" has no outgoing branches.`,
        node_id: node.id,
      });
      continue;
    }

    if (branches.length === 1) {
      add({
        id: `decision-single-branch-${node.id}`,
        category: "decision",
        severity: "error",
        message: `Decision "${node.label}" has only one branch. A decision must offer at least two outcomes.`,
        node_id: node.id,
      });
      continue;
    }

    const unlabeled = branches.filter(
      (b) => !(b.label && b.label.trim() !== "") && !(b.condition && b.condition.trim() !== ""),
    );
    if (unlabeled.length > 0) {
      add({
        id: `decision-unlabeled-branch-${node.id}`,
        category: "decision",
        severity: "warning",
        message: `Decision "${node.label}" has ${unlabeled.length} branch(es) without a label or condition.`,
        node_id: node.id,
      });
    }

    const hasDefault = branches.some(
      (b) =>
        b.is_default === true ||
        (!(b.label && b.label.trim() !== "") &&
          !(b.condition && b.condition.trim() !== "")),
    );
    if (!hasDefault) {
      add({
        id: `decision-no-default-${node.id}`,
        category: "decision",
        severity: "warning",
        message: `Decision "${node.label}" has no explicit default branch. Exactly one default path should exist where appropriate.`,
        node_id: node.id,
      });
    }
  }

  const cycles = findCycles(doc.nodes, validEdges);
  for (const cycle of cycles) {
    const cycleEdgeIds = new Set<string>();
    for (let i = 0; i < cycle.length; i++) {
      const from = cycle[i];
      const to = cycle[(i + 1) % cycle.length];
      for (const edge of validEdges) {
        if (edge.source === from && edge.target === to) cycleEdgeIds.add(edge.id);
      }
    }

    const conditioned = [...cycleEdgeIds].some((edgeId) => {
      const edge = validEdges.find((e) => e.id === edgeId);
      if (!edge) return false;
      return (
        (edge.label !== undefined && edge.label.trim() !== "") ||
        (edge.condition !== undefined && edge.condition.trim() !== "") ||
        edge.is_default === true
      );
    });

    if (!conditioned) {
      add({
        id: `decision-loop-without-condition-${cycle.join("_")}`,
        category: "decision",
        severity: "warning",
        message: `Loop through ${cycle.join(" → ")} has no labelled condition or retry path.`,
        node_id: cycle[0],
      });
    }
  }

  const processIds = new Set<string>();
  const processCodes = new Set<string>();
  const nodesCoveredByProcesses = new Set<string>();

  for (const process of doc.processes) {
    const label = process.code || process.id;

    if (processIds.has(process.id)) {
      add({
        id: `process-duplicate-id-${process.id}`,
        category: "graph",
        severity: "error",
        message: `Duplicate process ID: "${process.id}".`,
        process_code: process.code,
      });
      continue;
    }
    processIds.add(process.id);

    if (process.code.trim() === "") {
      add({
        id: `process-missing-code-${process.id}`,
        category: "graph",
        severity: "error",
        message: `Process "${process.name}" has no process code.`,
        process_code: process.code,
      });
    } else if (processCodes.has(process.code)) {
      add({
        id: `process-duplicate-code-${process.code}`,
        category: "graph",
        severity: "error",
        message: `Duplicate process code: "${process.code}".`,
        process_code: process.code,
      });
    } else {
      processCodes.add(process.code);

      if (!/^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)+$/.test(process.code)) {
        add({
          id: `process-numbering-${process.code}`,
          category: "graph",
          severity: "warning",
          message: `Process code "${process.code}" does not follow the expected numbering convention (e.g. FC-ATT-01).`,
          process_code: process.code,
        });
      }
    }

    if (process.node_ids.length === 0) {
      add({
        id: `process-no-nodes-${label}`,
        category: "graph",
        severity: "error",
        message: `Process "${label}" contains no nodes.`,
        process_code: process.code,
      });
    }

    for (const nodeId of process.node_ids) {
      nodesCoveredByProcesses.add(nodeId);
      if (!nodeById.has(nodeId)) {
        add({
          id: `process-missing-node-${label}-${nodeId}`,
          category: "graph",
          severity: "error",
          message: `Process "${label}" references missing node "${nodeId}".`,
          process_code: process.code,
          node_id: nodeId,
        });
      }
    }

    if (process.entry_node_id.trim() === "") {
      add({
        id: `process-no-entry-${label}`,
        category: "graph",
        severity: "error",
        message: `Process "${label}" has no entry node.`,
        process_code: process.code,
      });
    } else if (!process.node_ids.includes(process.entry_node_id)) {
      add({
        id: `process-entry-invalid-${label}`,
        category: "graph",
        severity: "error",
        message: `Process "${label}" entry node "${process.entry_node_id}" is not one of its nodes.`,
        process_code: process.code,
        node_id: process.entry_node_id,
      });
    }

    if (process.exit_node_ids.length === 0) {
      add({
        id: `process-no-exit-${label}`,
        category: "graph",
        severity: "error",
        message: `Process "${label}" has no exit node.`,
        process_code: process.code,
      });
    }

    for (const exitId of process.exit_node_ids) {
      if (!nodeById.has(exitId)) {
        add({
          id: `process-exit-missing-${label}-${exitId}`,
          category: "graph",
          severity: "error",
          message: `Process "${label}" exit node "${exitId}" does not exist.`,
          process_code: process.code,
          node_id: exitId,
        });
      } else if (!process.node_ids.includes(exitId)) {
        add({
          id: `process-exit-foreign-${label}-${exitId}`,
          category: "graph",
          severity: "error",
          message: `Process "${label}" exit node "${exitId}" is not one of its nodes.`,
          process_code: process.code,
          node_id: exitId,
        });
      }
    }

    validateProcessTraceability(process, context, add);
  }

  if (context) {
    const erdCandidates = [
      ...(context.erd_entity_names ?? []),
      ...(context.erd_table_names ?? []),
    ].filter((c) => c.trim() !== "");

    if (erdCandidates.length > 0) {
      for (const node of doc.nodes) {
        const refs = node.erd_entity_ids ?? [];
        if (refs.length === 0) continue;
        const missing = refs.filter(
          (ref) => ref.trim() === "" || !matchesReference(ref, erdCandidates),
        );
        if (missing.length > 0) {
          add({
            id: `data-erd-not-found-${node.id}`,
            category: "data",
            severity: "warning",
            message: `Node "${node.id}" (${node.label}) references ERD entit(ies) that are not in the approved ERD: ${missing
              .map((m) => `"${m}"`)
              .join(", ")}.`,
            node_id: node.id,
          });
        }
      }
    }
  }

  if (doc.processes.length > 0) {
    for (const node of doc.nodes) {
      if (!nodesCoveredByProcesses.has(node.id)) {
        add({
          id: `scope-node-not-in-process-${node.id}`,
          category: "scope",
          severity: "warning",
          message: `Node "${node.id}" (${node.label}) does not belong to any flowchart process.`,
          node_id: node.id,
        });
      }
    }
  }

  if (context?.dfd_process_ids && context.dfd_process_ids.length > 0) {
    const covered = new Set<string>();
    for (const process of doc.processes) {
      for (const ref of process.dfd_process_ids) covered.add(normalize(ref));
    }

    for (const dfdProcessId of context.dfd_process_ids) {
      const code = context.dfd_process_codes?.[context.dfd_process_ids.indexOf(dfdProcessId)];
      const name = context.dfd_process_names?.[context.dfd_process_ids.indexOf(dfdProcessId)];
      const matched = [...covered].some(
        (ref) =>
          matchesReference(ref, [dfdProcessId, code ?? "", name ?? ""]),
      );
      if (!matched) {
        add({
          id: `dfd-uncovered-${dfdProcessId}`,
          category: "dfd_consistency",
          severity: "warning",
          message: `Approved DFD process "${code ?? dfdProcessId}${
            name ? ` (${name})` : ""
          }" has no flowchart representation.`,
        });
      }
    }
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

function validateProcessTraceability(
  process: FlowchartProcess,
  context: FlowchartUpstreamContext | undefined,
  add: (issue: FlowchartValidationIssue) => void,
): void {
  const label = process.code || process.id;
  const hasAnyUpstream =
    process.requirement_ids.length > 0 ||
    process.architecture_module_ids.length > 0 ||
    process.dfd_process_ids.length > 0;

  if (process.requirement_ids.length === 0) {
    add({
      id: `traceability-process-no-requirement-${label}`,
      category: "traceability",
      severity: "warning",
      message: `Flowchart process "${label}" is not linked to any approved requirement.`,
      process_code: process.code,
    });
  }

  if (process.architecture_module_ids.length === 0) {
    add({
      id: `architecture-process-no-module-${label}`,
      category: "architecture",
      severity: "warning",
      message: `Flowchart process "${label}" is not linked to any approved architecture module.`,
      process_code: process.code,
    });
  }

  if (process.dfd_process_ids.length === 0) {
    add({
      id: `dfd-process-no-mapping-${label}`,
      category: "dfd_consistency",
      severity: "warning",
      message: `Flowchart process "${label}" is not linked to any approved DFD process.`,
      process_code: process.code,
    });
  }

  if (!hasAnyUpstream && process.requirement_ids.length === 0) {
    add({
      id: `scope-process-no-upstream-${label}`,
      category: "scope",
      severity: "warning",
      message: `Flowchart process "${label}" has no traceability to requirements, architecture, or the DFD. It may be out of scope.`,
      process_code: process.code,
    });
  }

  if (!context) return;

  if (
    context.requirement_texts &&
    context.requirement_texts.length > 0 &&
    process.requirement_ids.length > 0
  ) {
    const missing = process.requirement_ids.filter(
      (ref) => ref.trim() !== "" && !matchesReference(ref, context.requirement_texts ?? []),
    );
    if (missing.length > 0) {
      add({
        id: `traceability-requirement-not-found-${label}`,
        category: "traceability",
        severity: "warning",
        message: `Flowchart process "${label}" references requirement(s) not found in the approved requirements: ${missing
          .map((m) => `"${m}"`)
          .join(", ")}.`,
        process_code: process.code,
      });
    }
  }

  const emptyRequirementRefs = process.requirement_ids.filter((ref) => ref.trim() === "");
  if (emptyRequirementRefs.length > 0) {
    add({
      id: `traceability-requirement-empty-${label}`,
      category: "traceability",
      severity: "error",
      message: `Flowchart process "${label}" contains an empty requirement reference.`,
      process_code: process.code,
    });
  }

  if (
    context.architecture_module_ids ||
    context.architecture_module_names
  ) {
    const candidates = [
      ...(context.architecture_module_ids ?? []),
      ...(context.architecture_module_names ?? []),
    ].filter((c) => c.trim() !== "");

    if (candidates.length > 0 && process.architecture_module_ids.length > 0) {
      const missing = process.architecture_module_ids.filter(
        (ref) => ref.trim() === "" || !matchesReference(ref, candidates),
      );
      if (missing.length > 0) {
        add({
          id: `architecture-module-not-found-${label}`,
          category: "architecture",
          severity: "error",
          message: `Flowchart process "${label}" references architecture module(s) that do not exist in the approved architecture: ${missing
            .map((m) => `"${m}"`)
            .join(", ")}.`,
          process_code: process.code,
        });
      }
    }
  }

  if (context.dfd_process_ids || context.dfd_process_codes || context.dfd_process_names) {
    const candidates = [
      ...(context.dfd_process_ids ?? []),
      ...(context.dfd_process_codes ?? []),
      ...(context.dfd_process_names ?? []),
    ].filter((c) => c.trim() !== "");

    if (candidates.length > 0 && process.dfd_process_ids.length > 0) {
      const missing = process.dfd_process_ids.filter(
        (ref) => ref.trim() === "" || !matchesReference(ref, candidates),
      );
      if (missing.length > 0) {
        add({
          id: `dfd-process-not-found-${label}`,
          category: "dfd_consistency",
          severity: "error",
          message: `Flowchart process "${label}" references DFD process(es) that do not exist in the approved DFD: ${missing
            .map((m) => `"${m}"`)
            .join(", ")}.`,
          process_code: process.code,
        });
      }
    }
  }
}

function findCycles(nodes: FlowchartNode[], edges: FlowchartEdge[]): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    const list = adjacency.get(edge.source);
    if (list && adjacency.has(edge.target)) list.push(edge.target);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const node of nodes) color.set(node.id, WHITE);

  const cycles: string[][] = [];
  const signatures = new Set<string>();
  const stack: string[] = [];

  const visit = (nodeId: string) => {
    color.set(nodeId, GRAY);
    stack.push(nodeId);

    for (const next of adjacency.get(nodeId) ?? []) {
      const state = color.get(next) ?? WHITE;
      if (state === GRAY) {
        const startIndex = stack.indexOf(next);
        const cycle = stack.slice(startIndex);
        const signature = [...cycle].sort().join("|");
        if (!signatures.has(signature)) {
          signatures.add(signature);
          cycles.push(cycle);
        }
      } else if (state === WHITE) {
        visit(next);
      }
    }

    stack.pop();
    color.set(nodeId, BLACK);
  };

  for (const node of nodes) {
    if ((color.get(node.id) ?? WHITE) === WHITE) visit(node.id);
  }

  return cycles;
}
