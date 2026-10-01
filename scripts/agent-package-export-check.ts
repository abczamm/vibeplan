import {
  buildAgentPackageExport,
  validateAgentPackageExport,
  evaluateExportEligibility,
  sanitizeFileSlug,
  assignModuleFilePaths,
  serializeManifest,
  sha256Hex,
  exportManifestSchema,
  REQUIRED_EXPORT_FILES,
  EXPORT_FORMAT_VERSION,
  EXPORT_PACKAGE_TYPE,
  EXPORT_ROOT_DIR,
  type AgentPackageExport,
} from "../lib/ai/agent-package-export";
import { createAgentPackageZip, safeDownloadFileName } from "../lib/ai/agent-package-zip";
import { agentPackageDocumentSchema } from "../lib/ai/agent-package";
import type {
  AgentPackageDocument,
  AgentPackageUpstreamContext,
} from "../lib/ai/agent-package";
import JSZip from "jszip";

let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` â€” ${detail}` : ""}`);
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




function buildInput(exportedAt: string) {
  return {
    project_id: "PROJ-1",
    project_name: "Mock School System",
    document_id: "DOC-AP-1",
    exported_at: exportedAt,
    pkg: basePackage(),
    upstream: baseContext(),
  };
}

const EXPECTED_SOURCE_IDS = {
  requirements: "REQ-DOC",
  architecture: "ARCH-DOC",
  erd: "ERD-DOC",
  dfd: "DFD-DOC",
  flowchart: "FC-DOC",
  blueprint: "BP-DOC",
};

function findFile(exp: AgentPackageExport, path: string): string | undefined {
  return exp.files.find((f) => f.path === path)?.content;
}

async function runTests() {
  console.log("Running agent package export tests...");

  const exportedAt = "2026-10-01T12:00:00.000Z";
  const built = buildAgentPackageExport(buildInput(exportedAt));
  const builtAgain = buildAgentPackageExport(buildInput(exportedAt));
  const ctx = baseContext();

  // 1. Valid approved package produces a complete export
  check(
    "Valid approved package produces export",
    built.files.length > 0 && validateAgentPackageExport(built).valid,
    validateAgentPackageExport(built).issues.map((i) => i.id).join(", "),
  );

  // 2. Deterministic renderer: two runs are byte-identical
  const samePaths =
    built.files.length === builtAgain.files.length &&
    built.files.every((f, i) => f.path === builtAgain.files[i].path);
  const sameContents = built.files.every(
    (f, i) => f.content === builtAgain.files[i].content,
  );
  const sameManifest = serializeManifest(built.manifest) === serializeManifest(builtAgain.manifest);
  check(
    "Deterministic renderer (byte-identical double run)",
    samePaths && sameContents && sameManifest,
  );

  // 3. Required files present
  const paths = new Set(built.files.map((f) => f.path));
  const missing = REQUIRED_EXPORT_FILES.filter((r) => !paths.has(r));
  check("Required files present", missing.length === 0, missing.join(", "));

  // 4. Path sanitization
  const s1 = sanitizeFileSlug("../etc/passwd");
  const s2 = sanitizeFileSlug("Auth Module");
  const s3 = sanitizeFileSlug("...");
  check(
    "Path sanitization strips traversal and separators",
    !s1.includes("..") && !s1.includes("/") && s1.length >= 0 &&
      s2 === "auth-module" && s3 === "",
    `got '${s1}', '${s2}', '${s3}'`,
  );

  const modulePaths = assignModuleFilePaths(basePackage().modules).map((m) => m.path);
  check(
    "Module file paths are filesystem-safe",
    modulePaths.every((p) => /^modules\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(p)),
    modulePaths.join(", "),
  );

  // 5. Duplicate path detection
  const dup: AgentPackageExport = {
    manifest: built.manifest,
    files: [...built.files, { ...built.files[0] }],
  };
  const dupRes = validateAgentPackageExport(dup);
  check(
    "Duplicate path detected",
    !dupRes.valid && dupRes.issues.some((i) => i.id.startsWith("duplicate-path")),
  );

  // 6. Traversal rejection
  const trav: AgentPackageExport = {
    manifest: built.manifest,
    files: built.files.map((f, i) => (i === 0 ? { ...f, path: "modules/../AGENTS.md" } : f)),
  };
  const travRes = validateAgentPackageExport(trav);
  check(
    "Path traversal rejected",
    !travRes.valid && travRes.issues.some((i) => i.id.startsWith("traversal-")),
  );

  // 7. Absolute path rejection
  const abs: AgentPackageExport = {
    manifest: built.manifest,
    files: built.files.map((f, i) => (i === 0 ? { ...f, path: "/etc/passwd" } : f)),
  };
  const absRes = validateAgentPackageExport(abs);
  check(
    "Absolute path rejected",
    !absRes.valid && absRes.issues.some((i) => i.id.startsWith("absolute-path-")),
  );

  // 8. Secret detection
  const sec: AgentPackageExport = {
    manifest: built.manifest,
    files: [
      ...built.files,
      { path: "notes.md", content: "Example: token = \"abc123\" must not ship.\n", mime_type: "text/markdown" },
    ],
  };
  const secRes = validateAgentPackageExport(sec);
  check(
    "Secret pattern detected in export",
    !secRes.valid && secRes.issues.some((i) => i.id.startsWith("secret-pattern-")),
  );

  // 9. Manifest generation
  const manifestParse = exportManifestSchema.safeParse(built.manifest);
  check(
    "Manifest generated and schema-valid",
    manifestParse.success &&
      built.manifest.package_type === EXPORT_PACKAGE_TYPE &&
      built.manifest.format_version === EXPORT_FORMAT_VERSION &&
      built.manifest.project_id === "PROJ-1" &&
      built.manifest.agent_package_version === "1.0",
    manifestParse.success ? "" : "schema mismatch",
  );

  // 10. SHA-256 hashes
  const hashesOk = built.manifest.files.every((mf, i) => {
    const f = built.files[i];
    return (
      mf.path === f.path &&
      mf.sha256 === sha256Hex(f.content) &&
      mf.bytes === Buffer.byteLength(f.content, "utf8")
    );
  });
  check("SHA-256 hashes and byte sizes match content", hashesOk);

  // 11. Stable file ordering
  const sorted = [...built.manifest.files].every(
    (f, i, arr) => i === 0 || arr[i - 1].path < f.path,
  );
  const filesSorted = [...built.files].every(
    (f, i, arr) => i === 0 || arr[i - 1].path < f.path,
  );
  check("Stable file ordering by path", sorted && filesSorted);

  // 12. Invalid Agent Package rejected
  const invalidEligibility = evaluateExportEligibility({
    status: "approved",
    rawContent: { nonsense: true },
    context: ctx,
    documentId: "DOC-AP-1",
    expectedSourceDocumentIds: EXPECTED_SOURCE_IDS,
  });
  check("Invalid Agent Package rejected", !invalidEligibility.eligible);

  // 13. Draft rejected
  const draftEligibility = evaluateExportEligibility({
    status: "draft",
    rawContent: basePackage(),
    context: ctx,
    documentId: "DOC-AP-1",
    expectedSourceDocumentIds: EXPECTED_SOURCE_IDS,
  });
  check("Draft Agent Package rejected", !draftEligibility.eligible);

  // 14. Review rejected
  const reviewEligibility = evaluateExportEligibility({
    status: "review",
    rawContent: basePackage(),
    context: ctx,
    documentId: "DOC-AP-1",
    expectedSourceDocumentIds: EXPECTED_SOURCE_IDS,
  });
  check("Review Agent Package rejected", !reviewEligibility.eligible);

  // 15. Approved accepted
  const approvedEligibility = evaluateExportEligibility({
    status: "approved",
    rawContent: basePackage(),
    context: ctx,
    documentId: "DOC-AP-1",
    expectedSourceDocumentIds: EXPECTED_SOURCE_IDS,
  });
  check("Approved valid Agent Package accepted", approvedEligibility.eligible);

  // 15b. Source document ID mismatch rejected
  const mismatchEligibility = evaluateExportEligibility({
    status: "approved",
    rawContent: basePackage(),
    context: ctx,
    documentId: "DOC-AP-1",
    expectedSourceDocumentIds: { ...EXPECTED_SOURCE_IDS, erd: "ERD-OTHER" },
  });
  check("Source document ID mismatch rejected", !mismatchEligibility.eligible);

  // 16. Traceability preserved
  const trace = findFile(built, "traceability.md") ?? "";
  check(
    "Traceability IDs preserved",
    ["MOD-1", "REQ-1", "ARCH-AUTH", "User", "PROC-L1-1", "FC-2", "BP-MOD-1"].every(
      (id) => trace.includes(id),
    ),
  );

  // 17. Upstream IDs preserved in manifest
  const sids = built.manifest.source_document_ids;
  check(
    "Upstream source IDs preserved",
    sids.requirements === "REQ-DOC" &&
      sids.architecture === "ARCH-DOC" &&
      sids.erd === "ERD-DOC" &&
      sids.dfd === "DFD-DOC" &&
      sids.flowchart === "FC-DOC" &&
      sids.blueprint === "BP-DOC" &&
      sids.agent_package === "DOC-AP-1",
    JSON.stringify(sids),
  );

  // 18. Module files generated
  const moduleFile = built.files.find((f) => f.path.startsWith("modules/"));
  check(
    "Module files generated with content",
    !!moduleFile &&
      moduleFile.content.includes("MOD-1") &&
      moduleFile.content.includes("Auth Module"),
    moduleFile?.path ?? "no module file",
  );

  // 19. API export generated
  const apiMd = findFile(built, "api/api-contracts.md") ?? "";
  check(
    "API contracts exported",
    apiMd.includes("POST") && apiMd.includes("/api/auth/login") && apiMd.includes("API-1"),
  );

  // 20. Database export generated
  const dbMd = findFile(built, "database/database-plan.md") ?? "";
  check(
    "Database plan exported with authority note",
    dbMd.includes("users") &&
      dbMd.includes("authoritative") &&
      dbMd.includes("Do not silently change schema"),
  );

  // 21. Security export generated
  const secMd = findFile(built, "security/security-plan.md") ?? "";
  check(
    "Security plan exported",
    secMd.includes("RBAC") &&
      secMd.includes("environment variables") &&
      secMd.includes("RLS"),
  );

  // 22. Testing export generated
  const testMd = findFile(built, "testing/testing-plan.md") ?? "";
  check("Testing plan exported", testMd.includes("Cover AuthService.login"));

  // Extra: AGENTS.md contract + uncertainty protocol
  const agentsMd = findFile(built, "AGENTS.md") ?? "";
  check(
    "AGENTS.md contains contract, strategy, uncertainty STOP block, DoD",
    agentsMd.includes("## Agent Contract") &&
      agentsMd.includes("## Implementation Strategy") &&
      agentsMd.includes("STOP.") &&
      agentsMd.includes("Request a human decision.") &&
      agentsMd.includes("## Definition of Done"),
  );

  // Extra: DESIGN.md has no fabricated design system
  const designMd = findFile(built, "DESIGN.md") ?? "";
  check(
    "DESIGN.md states design system not finalized",
    designMd.includes("Design system is not yet finalized by VibePlan") &&
      !/#(?:[0-9a-fA-F]{3}){1,2}\b/.test(designMd),
  );

  // Extra: IMPLEMENTATION.md is guidance
  const implMd = findFile(built, "IMPLEMENTATION.md") ?? "";
  check(
    "IMPLEMENTATION.md contains implementation order and completion checks",
    implMd.includes("## Implementation Order") &&
      implMd.includes("## Completion Checks") &&
      implMd.includes("guidance, not generated source code"),
  );

  // Extra: upstream renders preserve IDs
  const erdMd = findFile(built, "architecture/erd.md") ?? "";
  const dfdMd = findFile(built, "architecture/dfd.md") ?? "";
  const fcMd = findFile(built, "architecture/flowchart.md") ?? "";
  check(
    "Upstream artifacts preserve identifiers",
    erdMd.includes("`users`") &&
      dfdMd.includes("PROC-L1-1") &&
      fcMd.includes("FC-2"),
  );

  // Extra: manifest does not include itself
  check(
    "Manifest excludes itself from file entries",
    !built.manifest.files.some((f) => f.path === "MANIFEST.json"),
  );

  // Extra: empty file rejected
  const emptyRes = validateAgentPackageExport({
    manifest: built.manifest,
    files: built.files.map((f, i) => (i === 0 ? { ...f, content: "   " } : f)),
  });
  check(
    "Empty critical file rejected",
    !emptyRes.valid && emptyRes.issues.some((i) => i.id.startsWith("empty-file-")),
  );

  // Extra: null byte in path rejected
  const nullRes = validateAgentPackageExport({
    manifest: built.manifest,
    files: built.files.map((f, i) => (i === 0 ? { ...f, path: f.path + "\0.md" } : f)),
  });
  check(
    "Null byte in path rejected",
    !nullRes.valid && nullRes.issues.some((i) => i.id.startsWith("null-byte-")),
  );

  // Extra: Zod validates the built package input
  check(
    "Fixture package satisfies Agent Package schema",
    agentPackageDocumentSchema.safeParse(basePackage()).success,
  );

  // ZIP generation
  const zipBuffer = await createAgentPackageZip(built);
  const reopened = await JSZip.loadAsync(zipBuffer);
  const entryNames = Object.keys(reopened.files);
  const hasRoot = entryNames.every((n) => n.startsWith(`${EXPORT_ROOT_DIR}/`));
  const hasAgents = !!reopened.file(`${EXPORT_ROOT_DIR}/AGENTS.md`);
  const manifestEntry = reopened.file(`${EXPORT_ROOT_DIR}/MANIFEST.json`);
  const manifestText = manifestEntry ? await manifestEntry.async("string") : "";
  const zipManifestOk =
    manifestText.length > 0 &&
    JSON.stringify(JSON.parse(manifestText)) === JSON.stringify(built.manifest);

  check(
    "ZIP generated with .agent-package root and valid MANIFEST",
    zipBuffer.byteLength > 0 && hasRoot && hasAgents && zipManifestOk,
    `root=${hasRoot} agents=${hasAgents} manifest=${zipManifestOk}`,
  );

  const requiredInZip = REQUIRED_EXPORT_FILES.every((r) =>
    !!reopened.file(`${EXPORT_ROOT_DIR}/${r}`),
  );
  check("ZIP contains all required files", requiredInZip);

  // ZIP byte determinism: two runs of identical input produce identical bytes
  const zipAgain = await createAgentPackageZip(builtAgain);
  const zipDeterministic =
    zipBuffer.byteLength === zipAgain.byteLength &&
    zipBuffer.equals(zipAgain);
  check("ZIP bytes are deterministic for identical input", zipDeterministic);

  // Safe download filename
  const fn1 = safeDownloadFileName("My School!! App");
  const fn2 = safeDownloadFileName("../../../etc/passwd");
  check(
    "Safe download filename",
    fn1 === "vibeplan-my-school-app-agent-package.zip" &&
      /^[\w.-]+\.zip$/.test(fn2) &&
      !fn2.includes("..") &&
      fn2.startsWith("vibeplan-"),
    `${fn1} / ${fn2}`,
  );

  // No AI imports in export modules (static guarantee)
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const exportModuleSource = readFileSync(
    join(process.cwd(), "lib", "ai", "agent-package-export.ts"),
    "utf8",
  );
  const zipModuleSource = readFileSync(
    join(process.cwd(), "lib", "ai", "agent-package-zip.ts"),
    "utf8",
  );
  const aiFree =
    !/openrouter|OpenRouter|AIProvider|generateDiscovery|generateRequirements|generateArchitecture|generateERD|generateDFD|generateFlowchart|generateImplementationBlueprint|generateAgentPackage/.test(
      exportModuleSource,
    ) && !/openrouter|OpenRouter|AIProvider/.test(zipModuleSource);
  check("No AI provider references in export modules", aiFree);

  if (failures > 0) {
    console.error(`\nFAILED ${failures} tests.`);
    process.exit(1);
  } else {
    console.log("\nALL TESTS PASSED");
  }
}

runTests();
