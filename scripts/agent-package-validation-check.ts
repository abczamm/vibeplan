import {
  validateAgentPackageDocument,
  agentPackageDocumentSchema,
} from "../lib/ai/agent-package";
import type {
  AgentPackageDocument,
  AgentPackageUpstreamContext,
} from "../lib/ai/agent-package";

let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function baseContext(): AgentPackageUpstreamContext {
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
    blueprint: {
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
          requirement_ids: ["REQ-1"],
          architecture_module_ids: ["ARCH-AUTH"],
          erd_entity_ids: ["ENT-USER"],
          dfd_process_ids: ["PROC-L1-1"],
          flowchart_process_ids: ["FC-2"],
          frontend_tasks: [],
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
            entity_id: "ENT-USER",
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
      api_plan: [],
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
      frontend_plan: { summary: "", pages: [], reusable_components: [] },
      backend_plan: { summary: "", services: [], data_access_boundaries: [] },
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
        mappings: [{ requirement_id: "REQ-1", blueprint_module_id: "BP-MOD-1" }],
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
    },
  };
}

function basePackage(): AgentPackageDocument {
  return {
    version: "1.0",
    title: "Test Agent Package",
    description: "Agent package for testing.",
    project_context: {
      project_name: "Mock Project",
      project_summary: "A mock project.",
      target_users: ["Admin"],
      primary_goals: ["Authenticate users"],
    },
    source_of_truth: {
      requirements_document_id: "REQ-DOC",
      architecture_document_id: "ARCH-DOC",
      erd_document_id: "ERD-DOC",
      dfd_document_id: "DFD-DOC",
      flowchart_document_id: "FC-DOC",
      blueprint_document_id: "BP-DOC",
    },
    agent_contract: {
      objective: "Implement the auth module.",
      must: ["Follow the ERD schema exactly."],
      must_not: ["Never modify approved upstream documents."],
      allowed_changes: ["Add tests."],
      prohibited_changes: ["Change authentication mechanism."],
      required_checks: ["Run lint and typecheck."],
      escalation_rules: ["Ask the user when requirements are ambiguous."],
      completion_rules: ["All tests pass."],
    },
    project_rules: [
      { id: "RULE-1", category: "style", description: "Use TypeScript strict mode." },
    ],
    implementation_strategy: {
      phases: [{ id: "PHASE-1", name: "Phase 1", modules: ["MOD-1"] }],
      dependency_order: ["MOD-1"],
    },
    modules: [
      {
        id: "MOD-1",
        code: "AUTH",
        name: "Auth Module",
        purpose: "Handle authentication.",
        requirements: ["REQ-1"],
        architecture_modules: ["ARCH-AUTH"],
        erd_entities: ["User"],
        dfd_processes: ["PROC-L1-1"],
        flowchart_processes: ["FC-2"],
        blueprint_module_id: "BP-MOD-1",
        frontend: { pages: ["/login"], components: ["LoginForm"], states: ["idle"] },
        backend: { services: ["AuthService"], operations: ["login"] },
        api_ids: ["API-1"],
        database_entities: ["User"],
        authorization: { roles: ["admin"], permissions: ["auth:login"] },
        validation_rules: ["Email must be valid."],
        security_requirements: ["Enforce RLS on users table."],
        testing_requirements: ["Cover login happy path."],
        dependencies: [],
        implementation_order: 1,
      },
    ],
    database_instructions: [
      {
        table_name: "users",
        source_entity_id: "User",
        columns: ["id", "email"],
        primary_key: "id",
        foreign_keys: [],
        unique_constraints: [],
        check_constraints: [],
        indexes: [],
        timestamps_required: true,
        audit_requirements: [],
        rls_requirements: ["Only owners can read their rows."],
        seed_requirements: [],
      },
    ],
    api_contracts: [
      {
        id: "API-1",
        method: "POST",
        route: "/api/auth/login",
        purpose: "Log a user in.",
        module_id: "MOD-1",
        authentication_required: true,
        authorization: { roles: ["admin"], permissions: [] },
        input: "email, password",
        validation: ["Email required."],
        response: "Session cookie",
        error_cases: ["Invalid credentials"],
        security_requirements: ["Rate limit attempts."],
        traceability: {
          requirement_ids: ["REQ-1"],
          architecture_module_ids: ["ARCH-AUTH"],
          dfd_process_ids: ["PROC-L1-1"],
          blueprint_item_ids: ["BP-MOD-1"],
        },
      },
    ],
    frontend_instructions: [
      { module_id: "MOD-1", instructions: ["Render validation errors inline."] },
    ],
    backend_instructions: [
      { module_id: "MOD-1", instructions: ["Hash passwords with bcrypt."] },
    ],
    authentication_instructions: [
      { component: "Login", instruction: "Use secure session cookies." },
    ],
    authorization_instructions: [
      { role_or_permission: "admin", instruction: "Admin can access all modules." },
    ],
    validation_instructions: [
      { target: "LoginInput", instruction: "Reject malformed email addresses." },
    ],
    security_instructions: [
      { category: "secrets", instruction: "Never hardcode credentials in source." },
    ],
    testing_instructions: [
      {
        module_id: "MOD-1",
        category: "unit",
        instruction: "Cover AuthService.login.",
      },
    ],
    forbidden_changes: [
      { category: "auth", description: "Do not switch identity providers." },
    ],
    uncertainty_protocol: {
      triggers: ["Requirement is ambiguous."],
      actions: ["Ask the user for clarification before coding."],
    },
    definition_of_done: [
      { category: "quality", criteria: ["Lint passes with zero errors."] },
    ],
    traceability: [
      {
        module_id: "MOD-1",
        upstream_links: {
          requirement_ids: ["REQ-1"],
          architecture_module_ids: ["ARCH-AUTH"],
          erd_entity_names: ["User"],
          dfd_process_ids: ["PROC-L1-1"],
          flowchart_process_ids: ["FC-2"],
          blueprint_module_id: "BP-MOD-1",
        },
      },
    ],
    assumptions: ["PostgreSQL is available."],
    _metadata: {
      generated_at: "2026-10-01T00:00:00Z",
      source_document_ids: {
        requirements_id: "REQ-DOC",
        architecture_id: "ARCH-DOC",
        erd_id: "ERD-DOC",
        dfd_id: "DFD-DOC",
        flowchart_id: "FC-DOC",
        blueprint_id: "BP-DOC",
      },
      generator_version: "test",
    },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function errorIds(result: ReturnType<typeof validateAgentPackageDocument>): string[] {
  return result.issues.filter((i) => i.severity === "error").map((i) => i.id);
}

function runTests() {
  console.log("Running agent package deterministic validation tests...");

  const ctx = baseContext();

  // 1. Base package passes Zod schema
  const parseResult = agentPackageDocumentSchema.safeParse(basePackage());
  check(
    "Valid package satisfies Zod schema",
    parseResult.success,
    parseResult.success ? "" : JSON.stringify(parseResult.error.issues.slice(0, 3)),
  );

  // 2. Valid package passes deterministic validation (with upstream context)
  const res1 = validateAgentPackageDocument(basePackage(), ctx);
  check(
    "Valid package passes validation with context",
    res1.valid === true,
    errorIds(res1).join(", "),
  );

  // 3. Valid package passes without upstream context
  const res2 = validateAgentPackageDocument(basePackage());
  check(
    "Valid package passes validation without context",
    res2.valid === true,
    errorIds(res2).join(", "),
  );

  // 4. Missing must rules
  const t4 = basePackage();
  t4.agent_contract.must = [];
  const r4 = validateAgentPackageDocument(t4, ctx);
  check(
    "Missing contract must rules detected",
    !r4.valid && errorIds(r4).includes("contract-missing-must"),
  );

  // 5. Missing must_not rules
  const t5 = basePackage();
  t5.agent_contract.must_not = [];
  const r5 = validateAgentPackageDocument(t5, ctx);
  check(
    "Missing contract must_not rules detected",
    !r5.valid && errorIds(r5).includes("contract-missing-must-not"),
  );

  // 6. Missing escalation rules
  const t6 = basePackage();
  t6.agent_contract.escalation_rules = [];
  const r6 = validateAgentPackageDocument(t6, ctx);
  check(
    "Missing escalation rules detected",
    !r6.valid && errorIds(r6).includes("contract-missing-escalation"),
  );

  // 7. Missing uncertainty protocol
  const t7 = basePackage();
  t7.uncertainty_protocol.triggers = [];
  const r7 = validateAgentPackageDocument(t7, ctx);
  check(
    "Missing uncertainty protocol detected",
    !r7.valid && errorIds(r7).includes("missing-uncertainty-protocol"),
  );

  // 8. Missing definition of done
  const t8 = basePackage();
  t8.definition_of_done = [];
  const r8 = validateAgentPackageDocument(t8, ctx);
  check(
    "Missing definition of done detected",
    !r8.valid && errorIds(r8).includes("missing-dod"),
  );

  // 9. Duplicate module ID
  const t9 = basePackage();
  t9.modules.push({ ...clone(t9.modules[0]), implementation_order: 2 });
  const r9 = validateAgentPackageDocument(t9, ctx);
  check(
    "Duplicate module ID detected",
    !r9.valid && errorIds(r9).some((id) => id.startsWith("dup-mod-id-")),
  );

  // 10. Duplicate implementation order
  const t10 = basePackage();
  t10.modules.push({
    ...clone(t10.modules[0]),
    id: "MOD-2",
    blueprint_module_id: "BP-MOD-1",
  });
  const r10 = validateAgentPackageDocument(t10, ctx);
  check(
    "Duplicate implementation order detected",
    !r10.valid && errorIds(r10).some((id) => id.startsWith("dup-mod-order-")),
  );

  // 11. Module without security requirements
  const t11 = basePackage();
  t11.modules[0].security_requirements = [];
  const r11 = validateAgentPackageDocument(t11, ctx);
  check(
    "Module without security requirements detected",
    !r11.valid && errorIds(r11).some((id) => id.startsWith("mod-no-security-")),
  );

  // 12. Duplicate API ID
  const t12 = basePackage();
  t12.api_contracts.push(clone(t12.api_contracts[0]));
  const r12 = validateAgentPackageDocument(t12, ctx);
  check(
    "Duplicate API ID detected",
    !r12.valid && errorIds(r12).some((id) => id.startsWith("dup-api-id-")),
  );

  // 13. API referencing unknown module
  const t13 = basePackage();
  t13.api_contracts[0].module_id = "MOD-UNKNOWN";
  const r13 = validateAgentPackageDocument(t13, ctx);
  check(
    "API with unknown module detected",
    !r13.valid && errorIds(r13).some((id) => id.startsWith("api-no-module-")),
  );

  // 14. Protected API without authorization roles
  const t14 = basePackage();
  t14.api_contracts[0].authorization.roles = [];
  const r14 = validateAgentPackageDocument(t14, ctx);
  check(
    "Protected API without authorization roles detected",
    !r14.valid && errorIds(r14).some((id) => id.startsWith("api-no-authz-")),
  );

  // 15. Empty implementation strategy
  const t15 = basePackage();
  t15.implementation_strategy.phases = [];
  const r15 = validateAgentPackageDocument(t15, ctx);
  check(
    "Empty implementation strategy detected",
    !r15.valid && errorIds(r15).includes("strategy-no-phases"),
  );

  // 16. Database instruction without source entity
  const t16 = basePackage();
  t16.database_instructions[0].source_entity_id = "";
  const r16 = validateAgentPackageDocument(t16, ctx);
  check(
    "Database instruction without source entity detected",
    !r16.valid && errorIds(r16).some((id) => id.startsWith("db-no-source-")),
  );

  // 17. Dependency on unknown module
  const t17 = basePackage();
  t17.modules[0].dependencies = ["MOD-GHOST"];
  const r17 = validateAgentPackageDocument(t17, ctx);
  check(
    "Dependency on unknown module detected",
    !r17.valid && errorIds(r17).some((id) => id.startsWith("mod-unknown-dep-")),
  );

  // 18. Circular dependency
  const t18 = basePackage();
  t18.modules.push({
    ...clone(t18.modules[0]),
    id: "MOD-2",
    implementation_order: 2,
    dependencies: ["MOD-1"],
  });
  t18.modules[0].dependencies = ["MOD-2"];
  const r18 = validateAgentPackageDocument(t18, ctx);
  check(
    "Circular dependency detected",
    !r18.valid && errorIds(r18).some((id) => id.startsWith("circular-dependency-")),
  );

  // 19. Forbidden secret pattern
  const t19 = basePackage();
  t19.assumptions = ["Debug output must never print process.env.SECRET."];
  const r19 = validateAgentPackageDocument(t19, ctx);
  check(
    "Forbidden secret pattern detected",
    !r19.valid && errorIds(r19).includes("forbidden-secret-pattern"),
  );

  // 20. Missing authentication instructions is a warning (not an error)
  const t20 = basePackage();
  t20.authentication_instructions = [];
  const r20 = validateAgentPackageDocument(t20, ctx);
  check(
    "Missing authentication instructions is warning only",
    r20.valid === true &&
      r20.issues.some((i) => i.id === "no-auth-instructions" && i.severity === "warning"),
  );

  // 21. Orphan module (missing traceability entry)
  const t21 = basePackage();
  t21.traceability = [];
  const r21 = validateAgentPackageDocument(t21, ctx);
  check(
    "Orphan module detected",
    !r21.valid && errorIds(r21).some((id) => id.startsWith("orphan-module-")),
  );

  // 22. Invalid upstream traceability reference (with context)
  const t22 = basePackage();
  t22.traceability[0].upstream_links.requirement_ids = ["REQ-GHOST"];
  const r22 = validateAgentPackageDocument(t22, ctx);
  check(
    "Invalid requirement traceability reference detected",
    !r22.valid && errorIds(r22).some((id) => id.startsWith("invalid-req-trace-")),
  );

  // 23. Invalid blueprint module traceability reference (with context)
  const t23 = basePackage();
  t23.traceability[0].upstream_links.blueprint_module_id = "BP-GHOST";
  const r23 = validateAgentPackageDocument(t23, ctx);
  check(
    "Invalid blueprint traceability reference detected",
    !r23.valid && errorIds(r23).some((id) => id.startsWith("invalid-bp-trace-")),
  );

  if (failures > 0) {
    console.error(`\nFAILED ${failures} tests.`);
    process.exit(1);
  } else {
    console.log("\nALL TESTS PASSED");
  }
}

runTests();
