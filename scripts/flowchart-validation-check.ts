import { flowchartDocumentSchema, validateFlowchartDocument } from "../lib/ai/flowchart";
import type { FlowchartDocument, FlowchartUpstreamContext } from "../lib/ai/types";

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
        purpose: "Record and validate student attendance.",
        node_ids: [
          "n_start",
          "n_input",
          "n_load",
          "n_enter",
          "n_valid",
          "n_dec",
          "n_err",
          "n_save",
          "n_recap",
          "n_ok",
          "n_end",
        ],
        entry_node_id: "n_start",
        exit_node_ids: ["n_end"],
        requirement_ids: ["Teacher records attendance by subject."],
        architecture_module_ids: ["mod-attendance"],
        dfd_process_ids: ["P3"],
      },
    ],
    assumptions: [],
  };
}

const context: FlowchartUpstreamContext = {
  requirement_texts: ["Teacher records attendance by subject."],
  architecture_module_ids: ["mod-attendance"],
  architecture_module_names: ["Attendance Module"],
  dfd_process_ids: ["P1", "P3"],
  dfd_process_codes: ["1.0", "3.0"],
  dfd_process_names: ["Manage Students", "Record Attendance"],
  erd_entity_names: ["Attendance"],
  erd_table_names: ["attendances"],
};

// 1. Valid document passes Zod
const parsed = flowchartDocumentSchema.safeParse(baseDoc());
check("zod accepts valid flowchart document", parsed.success);

// 2. Malformed document rejected by Zod
check(
  "zod rejects document missing required fields",
  !flowchartDocumentSchema.safeParse({ version: "1.0" }).success,
);
check(
  "zod rejects unknown node type",
  !flowchartDocumentSchema.safeParse({
    ...baseDoc(),
    nodes: [{ id: "n1", type: "banana", label: "x" }],
  }).success,
);

// 3. Valid document passes semantic validation (with context)
const validResult = validateFlowchartDocument(baseDoc(), context);
check(
  "valid document passes semantic validation",
  validResult.valid,
  validResult.issues.filter((i) => i.severity === "error").map((i) => i.message).join(" | "),
);

// 4. Missing start
{
  const doc = baseDoc();
  doc.nodes = doc.nodes.filter((n) => n.type !== "start");
  doc.edges = doc.edges.filter((e) => e.source !== "n_start");
  doc.processes[0].node_ids = doc.processes[0].node_ids.filter((id) => id !== "n_start");
  doc.processes[0].entry_node_id = "n_input";
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects missing start node",
    !r.valid && r.issues.some((i) => i.id === "graph-missing-start"),
  );
}

// 5. Missing end
{
  const doc = baseDoc();
  doc.nodes = doc.nodes.filter((n) => n.type !== "end");
  doc.edges = doc.edges.filter((e) => e.target !== "n_end");
  doc.processes[0].node_ids = doc.processes[0].node_ids.filter((id) => id !== "n_end");
  doc.processes[0].exit_node_ids = ["n_ok"];
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects missing end node",
    !r.valid && r.issues.some((i) => i.id === "graph-missing-end"),
  );
}

// 6. Duplicate node id
{
  const doc = baseDoc();
  doc.nodes.push({ id: "n_save", type: "process", label: "Duplicate" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects duplicate node id",
    !r.valid && r.issues.some((i) => i.id === "node-duplicate-id-n_save"),
  );
}

// 7. Duplicate edge id
{
  const doc = baseDoc();
  doc.edges.push({ id: "e1", source: "n_ok", target: "n_end" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects duplicate edge id",
    !r.valid && r.issues.some((i) => i.id === "edge-duplicate-id-e1"),
  );
}

// 8. Edge referencing missing node (orphan edge)
{
  const doc = baseDoc();
  doc.edges.push({ id: "e_orphan", source: "n_save", target: "ghost_node" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects orphan edge referencing missing node",
    !r.valid && r.issues.some((i) => i.id === "edge-orphan-e_orphan"),
  );
}

// 9. Disconnected / unreachable node
{
  const doc = baseDoc();
  doc.nodes.push({ id: "n_float", type: "process", label: "Floating step" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects disconnected node",
    !r.valid && r.issues.some((i) => i.id === "graph-disconnected-node-n_float"),
  );
}

// 10. Decision with only one branch
{
  const doc = baseDoc();
  doc.edges = doc.edges.filter((e) => e.id !== "e7");
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects decision with a single branch",
    !r.valid && r.issues.some((i) => i.id === "decision-single-branch-n_dec"),
  );
}

// 11. Decision with no branches
{
  const doc = baseDoc();
  doc.edges = doc.edges.filter((e) => e.id !== "e6" && e.id !== "e7");
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects decision with no branches",
    !r.valid && r.issues.some((i) => i.id === "decision-no-branch-n_dec"),
  );
}

// 12. Decision without default branch (warning only)
{
  const doc = baseDoc();
  doc.edges = doc.edges.map((e) =>
    e.id === "e7" ? { ...e, is_default: false } : e,
  );
  const r = validateFlowchartDocument(doc, context);
  check(
    "warns when decision has no default branch",
    r.valid && r.issues.some((i) => i.id === "decision-no-default-n_dec"),
  );
}

// 13. Process referencing missing node
{
  const doc = baseDoc();
  doc.processes[0].node_ids.push("ghost_node");
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects process referencing missing node",
    !r.valid && r.issues.some((i) => i.id === "process-missing-node-FC-ATT-01-ghost_node"),
  );
}

// 14. Process with no entry node
{
  const doc = baseDoc();
  doc.processes[0].entry_node_id = "";
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects process with no entry node",
    !r.valid && r.issues.some((i) => i.id === "process-no-entry-FC-ATT-01"),
  );
}

// 15. Process with no exit node
{
  const doc = baseDoc();
  doc.processes[0].exit_node_ids = [];
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects process with no exit node",
    !r.valid && r.issues.some((i) => i.id === "process-no-exit-FC-ATT-01"),
  );
}

// 16. Duplicate process codes
{
  const doc = baseDoc();
  doc.processes.push({ ...doc.processes[0], id: "p2" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects duplicate process code",
    !r.valid && r.issues.some((i) => i.id === "process-duplicate-code-FC-ATT-01"),
  );
}

// 17. Edge into START
{
  const doc = baseDoc();
  doc.edges.push({ id: "e_back", source: "n_save", target: "n_start" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects impossible edge direction into start",
    !r.valid && r.issues.some((i) => i.id === "edge-into-start-e_back"),
  );
}

// 18. Unknown architecture module (error)
{
  const doc = baseDoc();
  doc.processes[0].architecture_module_ids = ["mod-nonexistent"];
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects missing architecture module reference",
    !r.valid && r.issues.some((i) => i.id === "architecture-module-not-found-FC-ATT-01"),
  );
}

// 19. Unknown DFD process (error)
{
  const doc = baseDoc();
  doc.processes[0].dfd_process_ids = ["P99"];
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects missing DFD process reference",
    !r.valid && r.issues.some((i) => i.id === "dfd-process-not-found-FC-ATT-01"),
  );
}

// 20. Suspicious ERD reference (warning)
{
  const doc = baseDoc();
  doc.nodes[1].erd_entity_ids = ["nonexistent_entity"];
  const r = validateFlowchartDocument(doc, context);
  check(
    "warns on suspicious ERD reference",
    r.valid && r.issues.some((i) => i.id === "data-erd-not-found-n_input"),
  );
}

// 21. Process without requirement / without DFD mapping (warnings)
{
  const doc = baseDoc();
  doc.processes[0].requirement_ids = [];
  doc.processes[0].dfd_process_ids = [];
  const r = validateFlowchartDocument(doc, context);
  check(
    "warns on flowchart process without requirement",
    r.valid && r.issues.some((i) => i.id === "traceability-process-no-requirement-FC-ATT-01"),
  );
  check(
    "warns on flowchart process without DFD mapping",
    r.valid && r.issues.some((i) => i.id === "dfd-process-no-mapping-FC-ATT-01"),
  );
}

// 22. DFD process without flowchart representation (warning)
{
  const doc = baseDoc();
  doc.processes[0].dfd_process_ids = ["P3"];
  const r = validateFlowchartDocument(doc, { ...context, dfd_process_ids: ["P3", "P5"] });
  check(
    "warns on DFD process without flowchart representation",
    r.valid && r.issues.some((i) => i.id === "dfd-uncovered-P5"),
  );
}

// 23. Legitimate retry loop is not rejected
{
  const doc = baseDoc();
  doc.nodes.push({ id: "n_retry", type: "process", label: "Correct input" });
  doc.edges.push({ id: "e_retry1", source: "n_err", target: "n_retry", label: "Retry", condition: "retry requested" });
  doc.edges.push({ id: "e_retry2", source: "n_retry", target: "n_enter", label: "Resubmit" });
  doc.processes[0].node_ids.push("n_retry");
  const r = validateFlowchartDocument(doc, context);
  check(
    "allows legitimate retry loop",
    r.valid,
    r.issues.filter((i) => i.severity === "error").map((i) => i.message).join(" | "),
  );
}

// 24. Loop without condition warns
{
  const doc = baseDoc();
  doc.edges.push({ id: "e_loop", source: "n_enter", target: "n_load" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "warns on loop without a condition",
    r.valid && r.issues.some((i) => i.id.startsWith("decision-loop-without-condition-")),
  );
}

// 25. Duplicate edges (same source/target/label)
{
  const doc = baseDoc();
  doc.edges.push({ id: "e_dup", source: "n_save", target: "n_recap" });
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects duplicate edge pair",
    !r.valid && r.issues.some((i) => i.id === "edge-duplicate-pair-e_dup"),
  );
}

// 26. Invalid process numbering warns
{
  const doc = baseDoc();
  doc.processes[0].code = "attendance1";
  const r = validateFlowchartDocument(doc, context);
  check(
    "warns on invalid process numbering",
    r.valid && r.issues.some((i) => i.id === "process-numbering-attendance1"),
  );
}

// 27. Node without predecessor / successor
{
  const doc = baseDoc();
  doc.edges = doc.edges.filter((e) => e.id !== "e11");
  const r = validateFlowchartDocument(doc, context);
  check(
    "detects node without successor",
    !r.valid && r.issues.some((i) => i.id === "graph-no-successor-n_ok"),
  );
}

console.log("");
console.log(failures === 0 ? "ALL TESTS PASSED" : `${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
