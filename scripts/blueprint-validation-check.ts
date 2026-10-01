import { validateImplementationBlueprint } from "../lib/ai/blueprint";
import type { ImplementationBlueprint, BlueprintUpstreamContext } from "../lib/ai/types";

let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function baseContext(): BlueprintUpstreamContext {
  return {
    requirements: {
      overview: "Mock Project",
      users_and_roles: [],
      functional_requirements: [],
      business_rules: [],
      technical_requirements: [],
      security_requirements: [],
      reporting_requirements: [],
      constraints: [],
      scope_in: [],
      scope_out: [],
    },
    architecture: {
      overview: "",
      architectural_style: "",
      modules: [
        {
          id: "ARCH-AUTH",
          name: "Auth Module",
          description: "",
          responsibilities: [],
          actors: [],
        },
      ],
      actors: [],
      entities: [],
      relationships: [],
      layers: [],
      technology_decisions: [],
      constraints: [],
      security_considerations: [],
      assumptions: [],
    },
    erd: {
      version: 1,
      database: "postgresql",
      summary: "",
      entities: [
        {
          name: "User",
          table_name: "users",
          description: "",
          columns: [],
        },
      ],
      relationships: [],
      indexes: [],
      constraints: [],
      assumptions: [],
    },
    dfd: {
      version: "1",
      title: "",
      description: "",
      process_mapping: [],
      data_store_mapping: [],
      assumptions: [],
      context: {
        level: "context",
        nodes: [{ id: "PROC-L0-1", name: "System", type: "process" }],
        flows: [],
      },
      level_1: {
        level: "level_1",
        nodes: [
          { id: "PROC-L1-1", name: "Auth Process", type: "process" },
          { id: "PROC-L1-2", name: "Other Process", type: "process" },
        ],
        flows: [],
      },
    },
    flowchart: {
      version: "1",
      title: "",
      description: "",
      processes: [],
      nodes: [
        { id: "FC-1", type: "start", label: "Start", description: "", process_code: "" },
        { id: "FC-2", type: "process", label: "Do Auth", description: "", process_code: "" },
      ],
      edges: [],
      assumptions: [],
    },
  };
}

function baseBlueprint(): ImplementationBlueprint {
  return {
    version: "1.0",
    title: "Test BP",
    description: "",
    project_summary: "",
    modules: [
      {
        id: "BP-MOD-1",
        code: "AUTH",
        name: "Auth Module",
        description: "",
        responsibility: "",
        requirement_ids: [],
        architecture_module_ids: ["ARCH-AUTH"],
        erd_entity_ids: ["User"],
        dfd_process_ids: ["PROC-L1-1"],
        flowchart_process_ids: ["FC-2"],
        frontend_tasks: ["Task 1"],
        backend_tasks: [],
        database_tasks: [],
        dependencies: [],
        priority: 1,
      },
    ],
    database_plan: {
      summary: "",
      tables: [
          {
            entity_id: "User",
            table_name: "users",
          purpose: "",
          primary_key: "id",
          foreign_keys: [],
          indexes: [],
          constraints: [],
          rls_required: true,
          audit_logging: false,
        },
      ],
      migration_steps: [],
      seed_data_plan: [],
    },
    api_plan: [
      {
        id: "API-1",
        module_id: "BP-MOD-1",
        method: "POST",
        route: "/auth/login",
        purpose: "",
        authentication_required: true,
        authorization_roles: ["admin"],
        input_schema_summary: "",
        response_description: "",
        error_cases: [],
        requirement_ids: [],
      },
    ],
    authentication_plan: {
      mechanism: "",
      session_strategy: "",
      protected_routes: [],
      public_routes: [],
      boundaries: [],
      security_considerations: [],
    },
    authorization_plan: {
      summary: "",
      roles: [],
      server_side_enforcement: [],
      ui_visibility_rules: [],
    },
    frontend_plan: {
      summary: "",
      pages: [
        {
          id: "PAGE-1",
          module_id: "BP-MOD-1",
          route: "/login",
          title: "Login",
          purpose: "",
          components: [],
          required_states: [],
          responsive_requirements: "",
        },
      ],
      reusable_components: [],
    },
    backend_plan: {
      summary: "",
      services: [],
      data_access_boundaries: [],
    },
    validation_plan: { rules: [] },
    security_plan: {
      summary: "",
      mitigations: [],
      sensitive_data_handling: [],
      audit_trail_requirements: [],
    },
    testing_plan: { summary: "", test_cases: [] },
    implementation_phases: [
      {
        id: "PHASE-1",
        phase_number: 1,
        name: "Phase 1",
        description: "",
        module_ids: ["BP-MOD-1"],
        exit_criteria: [],
      },
    ],
    dependencies: [],
    assumptions: [],
    traceability: {
      mappings: [
        {
          requirement_id: "REQ-1",
          blueprint_module_id: "BP-MOD-1",
        },
      ],
      uncovered_requirements: [],
      uncovered_dfd_processes: [],
    },
    _metadata: {
      generated_at: "",
      generator_version: "",
      upstream_artifact_ids: {
        requirements_id: "",
        architecture_id: "",
        erd_id: "",
        dfd_id: "",
        flowchart_id: "",
      },
    },
  };
}

function runTests() {
  console.log("Running blueprint deterministic validation tests...");

  // 1. Valid Blueprint
  const validBp = baseBlueprint();
  const validCtx = baseContext();
  const res1 = validateImplementationBlueprint(validBp, validCtx);
  check("Valid blueprint passes", res1.valid === true, res1.issues.length ? JSON.stringify(res1.issues) : "");

  // 2. Duplicate module ID
  const dupMod = baseBlueprint();
  dupMod.modules.push({ ...dupMod.modules[0] }); // identical ID
  const res2 = validateImplementationBlueprint(dupMod, validCtx);
  check("Duplicate module ID detected", res2.valid === false && res2.issues.some((i) => i.id.startsWith("dup-mod-id")));

  // 3. Duplicate module code
  const dupCode = baseBlueprint();
  dupCode.modules.push({ ...dupCode.modules[0], id: "BP-MOD-2" }); // different ID, same code
  const res3 = validateImplementationBlueprint(dupCode, validCtx);
  check("Duplicate module code detected", res3.valid === false && res3.issues.some((i) => i.id.startsWith("dup-mod-code")));

  // 4. Circular dependency
  const circBp = baseBlueprint();
  circBp.modules.push({ ...circBp.modules[0], id: "BP-MOD-2", code: "OTHER" });
  circBp.dependencies.push({ from_module_id: "BP-MOD-1", to_module_id: "BP-MOD-2", reason: "" });
  circBp.dependencies.push({ from_module_id: "BP-MOD-2", to_module_id: "BP-MOD-1", reason: "" });
  const res4 = validateImplementationBlueprint(circBp, validCtx);
  check("Circular dependency detected", res4.valid === false && res4.issues.some((i) => i.id.startsWith("circular-dependency")));

  // 5. Self dependency
  const selfDep = baseBlueprint();
  selfDep.dependencies.push({ from_module_id: "BP-MOD-1", to_module_id: "BP-MOD-1", reason: "" });
  const res5 = validateImplementationBlueprint(selfDep, validCtx);
  check("Self dependency detected", res5.valid === false && res5.issues.some((i) => i.id.startsWith("self-dep")));

  // 6. Invalid Architecture Reference
  const invArch = baseBlueprint();
  invArch.modules[0].architecture_module_ids.push("INVALID-ARCH");
  const res6 = validateImplementationBlueprint(invArch, validCtx);
  check("Invalid architecture reference detected", res6.valid === false && res6.issues.some((i) => i.id.startsWith("invalid-arch-ref")));

  // 7. Invalid ERD Reference
  const invErd = baseBlueprint();
  invErd.modules[0].erd_entity_ids.push("INVALID-ENT");
  const res7 = validateImplementationBlueprint(invErd, validCtx);
  check("Invalid ERD reference detected", res7.valid === false && res7.issues.some((i) => i.id.startsWith("invalid-erd-ref")));

  // 8. Missing phases
  const noPhase = baseBlueprint();
  noPhase.implementation_phases = [];
  const res8 = validateImplementationBlueprint(noPhase, validCtx);
  check("Missing phases detected", res8.valid === false && res8.issues.some((i) => i.id === "missing-phases"));

  // 9. API with missing module
  const apiMissingMod = baseBlueprint();
  apiMissingMod.api_plan[0].module_id = "INVALID-MOD";
  const res9 = validateImplementationBlueprint(apiMissingMod, validCtx);
  check("API with missing module detected", res9.valid === false && res9.issues.some((i) => i.id.startsWith("api-invalid-mod")));

  // 10. API without roles when auth required (warning)
  const apiNoRoles = baseBlueprint();
  apiNoRoles.api_plan[0].authentication_required = true;
  apiNoRoles.api_plan[0].authorization_roles = []; // should trigger warning
  const res10 = validateImplementationBlueprint(apiNoRoles, validCtx);
  check("Protected API without roles detected as warning", res10.issues.some((i) => i.id.startsWith("api-no-roles") && i.severity === "warning"));

  // 11. Module without tasks
  const noTaskMod = baseBlueprint();
  noTaskMod.modules[0].frontend_tasks = [];
  noTaskMod.modules[0].backend_tasks = [];
  noTaskMod.modules[0].database_tasks = [];
  const res11 = validateImplementationBlueprint(noTaskMod, validCtx);
  check("Module without tasks detected", res11.valid === false && res11.issues.some((i) => i.id.startsWith("no-tasks")));

  if (failures > 0) {
    console.error(`\nFAILED ${failures} tests.`);
    process.exit(1);
  } else {
    console.log("\nALL TESTS PASSED");
  }
}

runTests();
