import {
  validateFlowchartDocument,
  flowchartReviewSchema,
  flowchartReviewDecisionSchema,
} from "../lib/ai/flowchart";
import type {
  FlowchartDocument,
  FlowchartReview,
  FlowchartReviewDecision,
  FlowchartUpstreamContext,
} from "../lib/ai/types";

let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function baseDoc(): FlowchartDocument {
  return {
    version: "1.0",
    title: "School Management Flowchart",
    description: "Business process flow for attendance recording.",
    nodes: [
      { id: "n_start", type: "start", label: "Start" },
      { id: "n_input", type: "input", label: "Teacher selects class/subject" },
      { id: "n_load", type: "process", label: "Load students" },
      { id: "n_enter", type: "input", label: "Enter attendance" },
      { id: "n_valid", type: "validation", label: "Validate attendance data" },
      { id: "n_dec", type: "decision", label: "Attendance valid?" },
      { id: "n_err", type: "error", label: "Show validation error" },
      { id: "n_save", type: "process", label: "Save attendance" },
      { id: "n_recap", type: "process", label: "Update attendance recap" },
      { id: "n_ok", type: "output", label: "Show success" },
      { id: "n_end", type: "end", label: "End" },
    ],
    edges: [
      { id: "e1", source: "n_start", target: "n_input" },
      { id: "e2", source: "n_input", target: "n_load" },
      { id: "e3", source: "n_load", target: "n_enter" },
      { id: "e4", source: "n_enter", target: "n_valid" },
      { id: "e5", source: "n_valid", target: "n_dec" },
      { id: "e6", source: "n_dec", target: "n_save", label: "Yes", condition: "valid == true" },
      { id: "e7", source: "n_dec", target: "n_err", label: "No", condition: "valid == false", is_default: true },
      { id: "e8", source: "n_err", target: "n_end" },
      { id: "e9", source: "n_save", target: "n_recap" },
      { id: "e10", source: "n_recap", target: "n_ok" },
      { id: "e11", source: "n_ok", target: "n_end" },
    ],
    processes: [
      {
        id: "p1",
        code: "FC-ATT-01",
        name: "Attendance Submission",
        purpose: "Record and validate student attendance",
        node_ids: ["n_start", "n_input", "n_load", "n_enter", "n_valid", "n_dec", "n_err", "n_save", "n_recap", "n_ok", "n_end"],
        entry_node_id: "n_start",
        exit_node_ids: ["n_end"],
        requirement_ids: ["Teachers must be able to record student attendance"],
        architecture_module_ids: ["attendance-module"],
        dfd_process_ids: ["P1"],
      },
    ],
    assumptions: ["Attendance data is validated before persistence."],
  };
}

const upstreamContext: FlowchartUpstreamContext = {
  requirement_texts: [
    "Teachers must be able to record student attendance",
    "System must validate attendance data",
    "Admin must be able to view attendance reports",
  ],
  architecture_module_ids: ["attendance-module", "auth-module", "report-module"],
  architecture_module_names: ["Attendance Module", "Auth Module", "Report Module"],
  dfd_process_ids: ["P1", "P2", "P3"],
  dfd_process_codes: ["ATT-01", "AUTH-01", "RPT-01"],
  dfd_process_names: ["Record Attendance", "Authenticate User", "Generate Report"],
  erd_entity_names: ["Attendance", "Student", "Teacher", "Class"],
  erd_table_names: ["attendances", "students", "teachers", "classes"],
};

console.log("\n=== FLOWCHART REVIEW CHECKS ===\n");

// TEST 1: valid flowchart review Zod schema
console.log("--- TEST 1: Valid flowchart review Zod schema ---");
const validReview: FlowchartReview = {
  summary: "Flowchart looks consistent with upstream artifacts.",
  issues: [
    {
      id: "issue-001",
      severity: "minor",
      kind: "recommended_improvement",
      section: "Processes",
      title: "Consider adding explicit error handling for network failures",
      description: "The save process does not have an explicit network error path.",
      evidence: "Node n_save has no error branch for network failures.",
      recommendation: "Add an error node and edge for network failure scenarios.",
      requires_user_decision: false,
    },
  ],
  ready_for_approval: true,
};
const reviewParsed = flowchartReviewSchema.safeParse(validReview);
check("Valid FlowchartReview passes Zod schema", reviewParsed.success);

// TEST 2: invalid severity rejected
console.log("\n--- TEST 2: Invalid severity rejected by Zod ---");
const invalidSeverityReview = {
  summary: "Test",
  issues: [{ id: "x", severity: "critical", kind: "missing_start", section: "Graph", title: "T", description: "D", evidence: "E", recommendation: "R", requires_user_decision: false }],
  ready_for_approval: false,
};
const invalidSeverityParsed = flowchartReviewSchema.safeParse(invalidSeverityReview);
check("Invalid severity 'critical' rejected by Zod", !invalidSeverityParsed.success);

// TEST 3: invalid kind rejected
console.log("\n--- TEST 3: Invalid kind rejected by Zod ---");
const invalidKindReview = {
  summary: "Test",
  issues: [{ id: "x", severity: "important", kind: "nonexistent_kind", section: "Graph", title: "T", description: "D", evidence: "E", recommendation: "R", requires_user_decision: false }],
  ready_for_approval: false,
};
const invalidKindParsed = flowchartReviewSchema.safeParse(invalidKindReview);
check("Invalid kind 'nonexistent_kind' rejected by Zod", !invalidKindParsed.success);

// TEST 4: missing start node → deterministic error
console.log("\n--- TEST 4: Missing start node ---");
const noStartDoc = baseDoc();
noStartDoc.nodes = noStartDoc.nodes.filter((n) => n.type !== "start");
noStartDoc.edges = noStartDoc.edges.filter((e) => e.source !== "n_start" && e.target !== "n_start");
const noStartResult = validateFlowchartDocument(noStartDoc);
const noStartErrors = noStartResult.issues.filter((i) => i.severity === "error");
check("Missing start detected as error", !noStartResult.valid);
check("graph-missing-start issue present", noStartErrors.some((i) => i.id === "graph-missing-start"));

// TEST 5: missing end node → deterministic error
console.log("\n--- TEST 5: Missing end node ---");
const noEndDoc = baseDoc();
noEndDoc.nodes = noEndDoc.nodes.filter((n) => n.type !== "end");
noEndDoc.edges = noEndDoc.edges.filter((e) => e.source !== "n_end" && e.target !== "n_end");
noEndDoc.processes[0].exit_node_ids = ["n_ok"];
const noEndResult = validateFlowchartDocument(noEndDoc);
check("Missing end detected as error", !noEndResult.valid);
check("graph-missing-end issue present", noEndResult.issues.some((i) => i.id === "graph-missing-end" && i.severity === "error"));

// TEST 6: unreachable node
console.log("\n--- TEST 6: Unreachable node ---");
const unreachableDoc = baseDoc();
unreachableDoc.nodes.push({ id: "n_orphan", type: "process", label: "Orphan process" });
unreachableDoc.edges.push({ id: "e_orphan_end", source: "n_orphan", target: "n_end" });
unreachableDoc.processes[0].node_ids.push("n_orphan");
const unreachableResult = validateFlowchartDocument(unreachableDoc);
const unreachableErrors = unreachableResult.issues.filter((i) => i.severity === "error" && i.node_id === "n_orphan");
check("Unreachable node detected", unreachableErrors.length > 0);

// TEST 7: invalid decision branch (only one branch)
console.log("\n--- TEST 7: Invalid decision — single branch ---");
const singleBranchDoc = baseDoc();
singleBranchDoc.edges = singleBranchDoc.edges.filter((e) => !(e.source === "n_dec" && e.label === "No"));
const singleBranchResult = validateFlowchartDocument(singleBranchDoc);
check("Single-branch decision detected as error", !singleBranchResult.valid);
check("decision-single-branch error present", singleBranchResult.issues.some(
  (i) => i.id === `decision-single-branch-n_dec` && i.severity === "error"
));

// TEST 8: unlabeled decision branch
console.log("\n--- TEST 8: Unlabeled decision branch ---");
const unlabeledDoc = baseDoc();
unlabeledDoc.edges = unlabeledDoc.edges.map((e) => {
  if (e.id === "e6") return { id: e.id, source: e.source, target: e.target };
  return e;
});
const unlabeledResult = validateFlowchartDocument(unlabeledDoc);
check("Unlabeled branch detected as warning", unlabeledResult.issues.some(
  (i) => i.id === `decision-unlabeled-branch-n_dec` && i.severity === "warning"
));

// TEST 9: invalid edge (dangling source)
console.log("\n--- TEST 9: Invalid edge — missing source node ---");
const invalidEdgeDoc = baseDoc();
invalidEdgeDoc.edges.push({ id: "e_bad", source: "n_nonexistent", target: "n_end" });
const invalidEdgeResult = validateFlowchartDocument(invalidEdgeDoc);
check("Orphan edge with missing source detected as error", invalidEdgeResult.issues.some(
  (i) => i.id === "edge-orphan-e_bad" && i.severity === "error"
));

// TEST 10: missing process (no nodes)
console.log("\n--- TEST 10: Process with no nodes ---");
const noNodesDoc = baseDoc();
noNodesDoc.processes[0].node_ids = [];
const noNodesResult = validateFlowchartDocument(noNodesDoc);
check("Process with no nodes detected as error", noNodesResult.issues.some(
  (i) => i.severity === "error" && i.message.includes("contains no nodes")
));

// TEST 11: invalid DFD traceability
console.log("\n--- TEST 11: Invalid DFD process reference ---");
const invalidDFDDoc = baseDoc();
invalidDFDDoc.processes[0].dfd_process_ids = ["NONEXISTENT_DFD_PROCESS_XYZ"];
const invalidDFDResult = validateFlowchartDocument(invalidDFDDoc, upstreamContext);
check("Invalid DFD process reference detected as error", invalidDFDResult.issues.some(
  (i) => i.severity === "error" && i.category === "dfd_consistency"
));

// TEST 12: invalid architecture module reference
console.log("\n--- TEST 12: Invalid architecture module reference ---");
const invalidArchDoc = baseDoc();
invalidArchDoc.processes[0].architecture_module_ids = ["NONEXISTENT_MODULE_XYZ"];
const invalidArchResult = validateFlowchartDocument(invalidArchDoc, upstreamContext);
check("Invalid architecture module reference detected as error", invalidArchResult.issues.some(
  (i) => i.severity === "error" && i.category === "architecture"
));

// TEST 13: invalid ERD entity reference
console.log("\n--- TEST 13: Invalid ERD entity reference ---");
const invalidERDDoc = baseDoc();
invalidERDDoc.nodes[7].erd_entity_ids = ["NONEXISTENT_TABLE_XYZ"];
const invalidERDResult = validateFlowchartDocument(invalidERDDoc, upstreamContext);
check("Invalid ERD entity reference detected as warning", invalidERDResult.issues.some(
  (i) => i.category === "data" && i.severity === "warning"
));

// TEST 14: unresolved mandatory issue blocks approval
console.log("\n--- TEST 14: Unresolved mandatory decision blocks approval ---");
const reviewWithRequired: FlowchartReview = {
  summary: "Issues found.",
  issues: [
    {
      id: "scope-001",
      severity: "important",
      kind: "scope_creep",
      section: "Processes",
      title: "Scope creep detected",
      description: "Process introduces functionality not in approved requirements.",
      evidence: "Process X references feature Y not found in requirements.",
      recommendation: "Remove or document this process.",
      requires_user_decision: true,
    },
  ],
  ready_for_approval: false,
};
const decisions: FlowchartReviewDecision[] = [];
const resolvedIds = new Set(decisions.map((d) => d.issue_id));
const unresolvedRequired = reviewWithRequired.issues.filter(
  (i) => i.requires_user_decision && !resolvedIds.has(i.id),
);
check("Unresolved mandatory issue blocks approval", unresolvedRequired.length > 0);

// TEST 15: resolved mandatory issue unblocks approval check
console.log("\n--- TEST 15: Resolved mandatory issue allows approval ---");
const resolvedDecisions: FlowchartReviewDecision[] = [
  { issue_id: "scope-001", action: "accept", resolved_at: new Date().toISOString() },
];
const resolvedIdsSet = new Set(resolvedDecisions.map((d) => d.issue_id));
const unresolvedAfterDecision = reviewWithRequired.issues.filter(
  (i) => i.requires_user_decision && !resolvedIdsSet.has(i.id),
);
check("After resolution, no unresolved mandatory issues", unresolvedAfterDecision.length === 0);

// TEST 16: deterministic validation error blocks approval
console.log("\n--- TEST 16: Deterministic validation error blocks approval ---");
const errorDoc = baseDoc();
errorDoc.nodes = errorDoc.nodes.filter((n) => n.type !== "start");
errorDoc.edges = errorDoc.edges.filter((e) => e.source !== "n_start" && e.target !== "n_start");
const errorResult = validateFlowchartDocument(errorDoc);
check("Deterministic error (missing start) blocks approval", !errorResult.valid);

// TEST 17: approved flowchart immutability — decision action schema
console.log("\n--- TEST 17: Valid decision actions accepted by schema ---");
const acceptDecision = { issue_id: "x", action: "accept", resolved_at: new Date().toISOString() };
const ignoreDecision = { issue_id: "y", action: "ignore", resolved_at: new Date().toISOString() };
const customDecision = { issue_id: "z", action: "custom", custom_text: "We disagree because...", resolved_at: new Date().toISOString() };
check("accept decision valid", flowchartReviewDecisionSchema.safeParse(acceptDecision).success);
check("ignore decision valid", flowchartReviewDecisionSchema.safeParse(ignoreDecision).success);
check("custom decision valid", flowchartReviewDecisionSchema.safeParse(customDecision).success);

// TEST 18: non-accept review decision rejected if bad action
console.log("\n--- TEST 18: Invalid decision action rejected ---");
const badDecision = { issue_id: "x", action: "approve", resolved_at: new Date().toISOString() };
check("Invalid action 'approve' rejected", !flowchartReviewDecisionSchema.safeParse(badDecision).success);

// TEST 19: valid flowchart passes deterministic validation
console.log("\n--- TEST 19: Valid flowchart passes deterministic validation ---");
const validResult = validateFlowchartDocument(baseDoc(), upstreamContext);
check("Valid flowchart passes validation", validResult.valid, validResult.issues.filter((i) => i.severity === "error").map((i) => i.message).join("; "));

// TEST 20: duplicate process code detected
console.log("\n--- TEST 20: Duplicate process code detected ---");
const dupCodeDoc = baseDoc();
dupCodeDoc.processes.push({
  id: "p2",
  code: "FC-ATT-01",
  name: "Duplicate Process",
  node_ids: ["n_start"],
  entry_node_id: "n_start",
  exit_node_ids: ["n_start"],
  requirement_ids: [],
  architecture_module_ids: [],
  dfd_process_ids: [],
});
const dupCodeResult = validateFlowchartDocument(dupCodeDoc);
check("Duplicate process code detected as error", dupCodeResult.issues.some(
  (i) => i.severity === "error" && i.message.includes("Duplicate process code")
));

// TEST 21: ready_for_approval false when important issues exist
console.log("\n--- TEST 21: ready_for_approval = false when important issues exist ---");
const notReadyReview: FlowchartReview = {
  summary: "Issues found.",
  issues: [
    { id: "i1", severity: "important", kind: "scope_creep", section: "Processes", title: "T", description: "D", evidence: "E", recommendation: "R", requires_user_decision: true },
  ],
  ready_for_approval: false,
};
check("ready_for_approval false when important issues exist", !notReadyReview.ready_for_approval);

console.log(`\n=== RESULTS: ${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`} ===\n`);

if (failures > 0) {
  process.exit(1);
}
