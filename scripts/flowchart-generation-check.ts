import { OpenRouterProvider } from "../lib/ai/openrouter";
import {
  flowchartDocumentSchema,
  validateFlowchartDocument,
} from "../lib/ai/flowchart";
import type {
  ArchitectureDocument,
  DFDDocument,
  ERDDocument,
  FlowchartUpstreamContext,
  RequirementsDraft,
} from "../lib/ai/types";

const requirements: RequirementsDraft = {
  overview:
    "School Management System covering authentication, student records, attendance, and grade management.",
  users_and_roles: ["Admin", "Teacher", "Student"],
  functional_requirements: [
    "Teacher records attendance by subject.",
    "Teacher enters and updates grades for students in a class.",
    "Admin manages student records.",
    "Admin views attendance and grade reports.",
  ],
  business_rules: [
    "Attendance must be recorded per class session.",
    "Grades are weighted by assessment type before finalizing.",
  ],
  technical_requirements: ["Web application built with Next.js and Supabase."],
  security_requirements: [
    "Only authenticated teachers may record attendance.",
    "Only admins may manage student records.",
  ],
  reporting_requirements: ["Admin can export attendance reports."],
  constraints: [],
  scope_in: ["Authentication", "Attendance", "Grade management"],
  scope_out: ["Fee payment"],
};

const architecture: ArchitectureDocument = {
  overview: "Modular monolith with feature modules and Supabase backend.",
  architectural_style: "Modular monolith",
  modules: [
    {
      id: "mod-auth",
      name: "Authentication Module",
      description: "Handles login, sessions, and role checks.",
      responsibilities: ["Login", "Session management"],
      actors: ["Admin", "Teacher"],
    },
    {
      id: "mod-attendance",
      name: "Attendance Module",
      description: "Records and recalculates attendance.",
      responsibilities: ["Record attendance", "Attendance recap"],
      actors: ["Teacher"],
    },
  ],
  actors: [],
  entities: [],
  relationships: [],
  layers: [],
  technology_decisions: [],
  constraints: [],
  security_considerations: ["Role based access control"],
  assumptions: [],
};

const erd: ERDDocument = {
  version: 1,
  database: "postgresql",
  summary: "Core academic entities.",
  entities: [
    {
      name: "Attendance",
      table_name: "attendances",
      description: "Student attendance records.",
      columns: [],
    },
    {
      name: "Student",
      table_name: "students",
      description: "Student master data.",
      columns: [],
    },
  ],
  relationships: [],
  indexes: [],
  constraints: [],
  assumptions: [],
};

const dfd: DFDDocument = {
  version: "1.0",
  title: "School Management System DFD",
  description: "Data movement across the school management system.",
  context: { level: "context", nodes: [], flows: [] },
  level_1: {
    level: "level_1",
    nodes: [
      {
        id: "P3",
        type: "process",
        name: "Record Attendance",
        process_code: "3.0",
      },
      {
        id: "P4",
        type: "process",
        name: "Calculate Grades",
        process_code: "4.0",
      },
      { id: "DS1", type: "data_store", name: "Attendance Store" },
    ],
    flows: [],
  },
  data_store_mapping: [],
  process_mapping: [],
  assumptions: [],
};

const context: FlowchartUpstreamContext = {
  requirement_texts: [
    ...requirements.functional_requirements,
    ...requirements.business_rules,
    ...requirements.security_requirements,
    ...requirements.users_and_roles,
  ],
  architecture_module_ids: architecture.modules.map((m) => m.id),
  architecture_module_names: architecture.modules.map((m) => m.name),
  dfd_process_ids: ["P3", "P4"],
  dfd_process_codes: ["3.0", "4.0"],
  dfd_process_names: ["Record Attendance", "Calculate Grades"],
  erd_entity_names: erd.entities.map((e) => e.name),
  erd_table_names: erd.entities.map((e) => e.table_name),
};

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("SKIP  OPENROUTER_API_KEY not set — live generation test skipped.");
    return;
  }

  console.log("starting live flowchart generation...");
  const t0 = Date.now();
  const provider = new OpenRouterProvider();
  const flowchart = await provider.generateFlowchart({
    projectName: "School Management System",
    requirements,
    architecture,
    erd,
    dfd,
  });
  const elapsed = Date.now() - t0;

  console.log(`AI generation completed in ${elapsed}ms`);

  const zodResult = flowchartDocumentSchema.safeParse(flowchart);
  if (!zodResult.success) {
    console.log("FAIL  zod re-validation of AI output");
    console.log(zodResult.error.issues.slice(0, 5));
    process.exit(1);
  }
  console.log("PASS  zod re-validation of AI output");

  const validation = validateFlowchartDocument(flowchart, context);
  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning");

  console.log(`nodes=${flowchart.nodes.length} edges=${flowchart.edges.length} processes=${flowchart.processes.length}`);
  console.log(`errors=${errors.length} warnings=${warnings.length}`);
  for (const issue of errors) console.log(`  ERROR [${issue.category}] ${issue.message}`);
  for (const issue of warnings) console.log(`  WARN  [${issue.category}] ${issue.message}`);
  console.log("process codes:", flowchart.processes.map((p) => p.code).join(", "));

  const hasStart = flowchart.nodes.some((n) => n.type === "start");
  const hasEnd = flowchart.nodes.some((n) => n.type === "end");
  const hasDecision = flowchart.nodes.some((n) => n.type === "decision");
  const hasErrorPath = flowchart.nodes.some((n) => n.type === "error");
  const dfdMapped = flowchart.processes.some((p) => p.dfd_process_ids.length > 0);
  const reqMapped = flowchart.processes.some((p) => p.requirement_ids.length > 0);

  console.log(`has_start=${hasStart} has_end=${hasEnd} has_decision=${hasDecision} has_error_path=${hasErrorPath}`);
  console.log(`dfd_mapped=${dfdMapped} requirement_mapped=${reqMapped}`);

  if (!validation.valid) {
    console.log("FAIL  semantic validation of live AI output");
    process.exit(1);
  }

  const coverage = ["P3", "P4"].filter(
    (id) => !flowchart.processes.some((p) => p.dfd_process_ids.includes(id)),
  );
  if (coverage.length > 0) {
    console.log(`WARN  DFD processes not represented: ${coverage.join(", ")}`);
  }

  console.log("PASS  live generation produces a valid flowchart");
}

main().catch((err) => {
  console.error("FAIL  live generation threw:", err instanceof Error ? err.message : err);
  process.exit(1);
});
