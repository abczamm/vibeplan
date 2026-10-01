import {
  validateEngineeringPlanDocument,
  engineeringPlanDocumentSchema,
  engineeringReviewSchema,
  engineeringReviewDecisionSchema,
  evaluateEngineeringPlanApproval,
  canMutateEngineeringPlan,
} from "../lib/ai/engineering-plan";
import type {
  EngineeringPlanDocument,
  EngineeringPlanUpstreamContext,
  EngineeringReview,
  EngineeringReviewDecision,
} from "../lib/ai/types";

let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
}

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

function hasErrorId(res: { issues: { id: string; severity: string }[] }, id: string): boolean {
  return res.issues.some((i) => i.id === id && i.severity === "error");
}

function baseContext(): EngineeringPlanUpstreamContext {
  return {
    requirements: {
      overview: "Mock project overview.",
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
      overview: "Layered architecture with a single auth module.",
      architectural_style: "modular monolith",
      modules: [
        {
          id: "ARCH-AUTH",
          name: "Auth Module",
          description: "Handles authentication.",
          responsibilities: ["Login", "Session management"],
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
      summary: "Single users table.",
      entities: [
        {
          name: "User",
          table_name: "users",
          description: "Application user.",
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
      title: "Mock DFD",
      description: "Mock data flow diagram.",
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
      title: "Mock Flowchart",
      description: "Mock process flow.",
      nodes: [
        {
          id: "FC-1",
          type: "start",
          label: "Start",
          description: "",
          process_code: "",
        },
        {
          id: "FC-2",
          type: "process",
          label: "Do Auth",
          description: "",
          process_code: "",
        },
      ],
      processes: [
        {
          id: "FC-P-1",
          code: "P-AUTH",
          name: "Authenticate",
          purpose: "Authenticate the user.",
          node_ids: ["FC-1", "FC-2"],
          entry_node_id: "FC-1",
          exit_node_ids: ["FC-2"],
          requirement_ids: ["REQ-1"],
          architecture_module_ids: ["ARCH-AUTH"],
          dfd_process_ids: ["PROC-L1-1"],
        },
      ],
      edges: [],
      assumptions: [],
    },
    blueprint: {
      version: "1.0",
      title: "Test BP",
      description: "Blueprint fixture.",
      project_summary: "Mock blueprint.",
      modules: [
        {
          id: "BP-MOD-1",
          code: "AUTH",
          name: "Auth Module",
          description: "Authentication module.",
          responsibility: "Authenticate users.",
          requirement_ids: ["REQ-1"],
          architecture_module_ids: ["ARCH-AUTH"],
          erd_entity_ids: ["User"],
          dfd_process_ids: ["PROC-L1-1"],
          flowchart_process_ids: ["FC-P-1"],
          frontend_tasks: [],
          backend_tasks: [],
          database_tasks: [],
          dependencies: [],
          priority: 1,
        },
      ],
      database_plan: {
        summary: "Users table.",
        tables: [],
        migration_steps: [],
        seed_data_plan: [],
      },
      api_plan: [
        {
          id: "BP-API-1",
          module_id: "BP-MOD-1",
          method: "POST",
          route: "/api/auth/login",
          purpose: "Log a user in.",
          authentication_required: false,
          authorization_roles: ["admin"],
          input_schema_summary: "email, password",
          response_description: "Session",
          error_cases: ["Invalid credentials"],
          requirement_ids: ["REQ-1"],
          dfd_process_id: "PROC-L1-1",
          architecture_module_id: "ARCH-AUTH",
        },
      ],
      authentication_plan: {
        mechanism: "cookie session",
        session_strategy: "http-only cookie",
        protected_routes: ["/dashboard"],
        public_routes: ["/login"],
        boundaries: [],
        security_considerations: [],
      },
      authorization_plan: {
        summary: "Two roles.",
        roles: [
          { role: "admin", permissions: [], module_access: [] },
          { role: "member", permissions: [], module_access: [] },
        ],
        server_side_enforcement: [],
        ui_visibility_rules: [],
      },
      frontend_plan: {
        summary: "Three pages.",
        pages: [
          {
            id: "BP-PAGE-DASH",
            module_id: "BP-MOD-1",
            route: "/dashboard",
            title: "Dashboard",
            purpose: "Dashboard home.",
            components: [],
            required_states: ["default"],
            responsive_requirements: "",
          },
          {
            id: "BP-PAGE-LOGIN",
            module_id: "BP-MOD-1",
            route: "/login",
            title: "Login",
            purpose: "Sign in.",
            components: [],
            required_states: ["default"],
            responsive_requirements: "",
          },
          {
            id: "BP-PAGE-SETTINGS",
            module_id: "BP-MOD-1",
            route: "/settings",
            title: "Settings",
            purpose: "Account settings.",
            components: [],
            required_states: ["default"],
            responsive_requirements: "",
          },
        ],
        reusable_components: [],
      },
      backend_plan: { summary: "Services.", services: [], data_access_boundaries: [] },
      validation_plan: { rules: [] },
      security_plan: {
        summary: "Baseline security.",
        mitigations: [],
        sensitive_data_handling: [],
        audit_trail_requirements: [],
      },
      testing_plan: { summary: "Test plan.", test_cases: [] },
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
    agentPackage: {
      version: "1.0",
      title: "Test Agent Package",
      description: "Agent package fixture.",
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
      database_instructions: [],
      api_contracts: [],
      frontend_instructions: [],
      backend_instructions: [],
      authentication_instructions: [],
      authorization_instructions: [],
      validation_instructions: [],
      security_instructions: [],
      testing_instructions: [],
      forbidden_changes: [],
      uncertainty_protocol: {
        triggers: ["Requirement is ambiguous."],
        actions: ["Ask the user for clarification before coding."],
      },
      definition_of_done: [
        { category: "quality", criteria: ["Lint passes with zero errors."] },
      ],
      traceability: [],
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
    },
    designSystem: {
      version: "1.0",
      title: "Mock Design System",
      description: "Design system fixture.",
      design_principles: [
        {
          id: "DP-1",
          principle: "Clarity",
          description: "Prefer clarity over novelty.",
        },
      ],
      design_tokens: {
        colors: [
          {
            id: "tok-primary",
            name: "Primary",
            value: "#1d4ed8",
            usage: "Primary actions and links.",
            contrast_notes: "4.5:1 against white background.",
          },
        ],
      },
      typography: {
        font_family: {
          primary: "Inter",
          fallback: "system-ui, sans-serif",
          usage: "All interface text.",
        },
        heading_scale: [
          {
            level: "h1",
            font_size: "30px",
            line_height: "1.2",
            usage: "Page titles.",
          },
        ],
        body_scale: [
          {
            level: "body",
            font_size: "16px",
            line_height: "1.5",
            usage: "Default text.",
          },
        ],
        caption_scale: [
          {
            level: "caption",
            font_size: "12px",
            line_height: "1.4",
            usage: "Captions.",
          },
        ],
        font_weights: [{ id: "regular", value: "400", usage: "Body text." }],
        line_heights: [{ id: "normal", value: "1.5", usage: "Body text." }],
        letter_spacing: [{ id: "normal", value: "0", usage: "Default." }],
      },
      color_system: {
        colors: [
          {
            id: "primary",
            token_id: "tok-primary",
            value: "#1d4ed8",
            usage: "Primary buttons and links.",
            contrast_notes: "4.5:1 on white.",
          },
        ],
      },
      spacing_system: {
        scale: [{ id: "md", value: "12px", usage: "Control padding." }],
      },
      radius_system: {
        scale: [{ id: "md", value: "8px", usage: "Buttons." }],
      },
      elevation_system: {
        levels: [{ id: "low", value: "0 1px 2px rgba(0,0,0,0.06)", usage: "Cards." }],
      },
      component_system: {
        components: [
          {
            id: "comp-button",
            name: "Button",
            purpose: "Trigger an action.",
            interactive: true,
            variants: [{ name: "primary", description: "Primary emphasis." }],
            states: [{ name: "default", description: "Resting state." }],
            anatomy: [{ part: "label", description: "Action text." }],
            behavior: ["Press triggers the bound action."],
            accessibility_requirements: [
              "Must be keyboard operable using Tab and Enter.",
            ],
            usage_rules: ["Use one primary button per view."],
            forbidden_usage: ["Do not use for navigation."],
            traceability: {
              requirement_ids: ["REQ-1"],
              architecture_module_ids: ["ARCH-AUTH"],
              blueprint_page_ids: ["BP-PAGE-DASH"],
            },
          },
          {
            id: "comp-input",
            name: "Input Field",
            purpose: "Collect a text value.",
            interactive: true,
            variants: [{ name: "default", description: "Default field." }],
            states: [{ name: "default", description: "Resting state." }],
            anatomy: [{ part: "label", description: "Field label." }],
            behavior: ["Accepts keyboard input."],
            accessibility_requirements: [
              "Every input must have an associated label element.",
            ],
            usage_rules: ["Pair with a visible label."],
            forbidden_usage: [],
            traceability: {
              requirement_ids: ["REQ-1"],
              architecture_module_ids: ["ARCH-AUTH"],
              blueprint_page_ids: ["BP-PAGE-LOGIN"],
            },
          },
        ],
      },
      layout_rules: {
        container_strategy: "Centered max-width container.",
        content_width: "1200px",
        grid_rules: [
          {
            id: "grid-12",
            rule: "Use a 12-column grid.",
            applies_when: "Desktop layouts.",
          },
        ],
        column_rules: [
          {
            id: "col-stack",
            rule: "Collapse columns to a single stack.",
            applies_when: "Mobile widths.",
          },
        ],
        page_padding: "16px",
        section_spacing: "48px",
        sidebar_behavior: "Sidebar collapses below tablet width.",
        header_behavior: "Header stays sticky on scroll.",
      },
      responsive_rules: {
        breakpoints: [
          {
            id: "desktop",
            width_range: "1024px+",
            behaviors: ["Sidebar visible."],
          },
        ],
      },
      navigation_system: {
        primary_navigation: [
          {
            id: "nav-dash",
            label: "Dashboard",
            route: "/dashboard",
            blueprint_page_id: "BP-PAGE-DASH",
            visibility: "All authenticated users.",
          },
        ],
        secondary_navigation: [
          {
            id: "nav-settings",
            label: "Settings",
            route: "/settings",
            blueprint_page_id: "BP-PAGE-SETTINGS",
            visibility: "All authenticated users.",
          },
        ],
        breadcrumb_rules: ["Show breadcrumb on deeper pages."],
        mobile_navigation: "Primary navigation becomes a drawer.",
        active_state: "Active item uses primary color.",
        permission_visibility: "Items hide when the role lacks access.",
      },
      page_patterns: [
        {
          id: "pattern-dashboard",
          name: "Dashboard Pattern",
          purpose: "Overview with metrics.",
          layout: "Grid of cards.",
          required_sections: ["Header", "Metrics grid"],
          optional_sections: ["Activity feed"],
          responsive_behavior: "Cards stack on mobile.",
          accessibility: "Landmarks for header and main.",
          traceability: { blueprint_page_ids: ["BP-PAGE-DASH"] },
        },
      ],
      form_patterns: [
        {
          id: "form-login",
          name: "Login Form",
          field_layout: "Single column.",
          label_rules: ["Labels above fields."],
          help_text: "Show helper text under fields.",
          validation_display: "Inline under the field.",
          error_display: "Error text with aria-describedby.",
          required_field_indicator: "Asterisk on required fields.",
          submission_behavior: "Disable submit while pending.",
          loading_behavior: "Show spinner inside the button.",
          success_behavior: "Redirect to dashboard.",
          traceability: { blueprint_api_ids: ["BP-API-1"] },
        },
      ],
      table_patterns: [
        {
          id: "table-items",
          name: "Data Table",
          column_rules: ["Align numeric columns right."],
          sorting: { supported: true, rules: ["Sort by header click."] },
          filtering: { supported: true, rules: ["Filter by status."] },
          pagination: { supported: true, rules: ["25 rows per page."] },
          empty_state: "Show a helpful empty message.",
          loading_state: "Show skeleton rows.",
          error_state: "Show retry action.",
          responsive_behavior: "Horizontal scroll on mobile.",
          row_actions: ["Edit"],
          bulk_actions: [],
          traceability: { erd_entity_ids: ["User"] },
        },
      ],
      feedback_states: {
        states: [
          {
            id: "loading",
            visual_treatment: "Skeleton placeholders.",
            message_rules: "No message during loading.",
            user_action: "None while loading.",
            accessibility: "Announce busy state.",
          },
        ],
      },
      accessibility_rules: [
        {
          id: "keyboard_navigation",
          rule: "All actions reachable via keyboard.",
          category: "keyboard",
          applies_to: ["all"],
        },
      ],
      interaction_rules: {
        hover_behavior: "Hover raises elevation slightly.",
        focus_behavior: "Focus ring remains visible on all controls.",
        click_feedback: "Buttons depress on active.",
        loading_feedback: "Show inline spinners while pending.",
        transition_rules: "Transitions under 200ms.",
        modal_behavior: "Modals trap focus and close on Escape.",
        confirmation_rules: "Destructive actions require confirmation.",
        destructive_action_rules: "Delete requires typing the item name.",
        keyboard_behavior: "Enter submits forms, Escape closes overlays.",
      },
      screen_specifications: [
        {
          id: "screen-dashboard",
          name: "Dashboard",
          route: "/dashboard",
          purpose: "Show project overview metrics.",
          user_roles: ["admin", "member"],
          layout_pattern: "pattern-dashboard",
          components: ["comp-button"],
          data_requirements: ["Metrics summary"],
          actions: ["Open project"],
          states: ["ready", "loading", "error"],
          responsive_behavior: "Grid collapses to one column on mobile.",
          accessibility: ["Keyboard navigation supported."],
        },
        {
          id: "screen-login",
          name: "Login",
          route: "/login",
          purpose: "Authenticate the user.",
          user_roles: ["member"],
          layout_pattern: "pattern-dashboard",
          components: ["comp-button", "comp-input"],
          data_requirements: ["Credentials"],
          actions: ["Submit credentials"],
          states: ["idle", "error"],
          responsive_behavior: "Full width card on mobile.",
          accessibility: ["Focus starts on the first field."],
        },
      ],
      assumptions: ["Design uses the Inter typeface by default."],
      traceability: {
        screens: [
          {
            screen_id: "screen-dashboard",
            requirement_ids: ["REQ-1"],
            architecture_module_ids: ["ARCH-AUTH"],
            erd_entity_ids: ["User"],
            dfd_process_ids: ["PROC-L1-1"],
            flowchart_process_ids: ["FC-P-1"],
            blueprint_module_ids: ["BP-MOD-1"],
            blueprint_page_ids: ["BP-PAGE-DASH"],
            blueprint_api_ids: ["BP-API-1"],
          },
        ],
      },
      _metadata: {
        source_of_truth: "design-system",
        requirements_document_id: "REQ-DOC",
        architecture_document_id: "ARCH-DOC",
        erd_document_id: "ERD-DOC",
        dfd_document_id: "DFD-DOC",
        flowchart_document_id: "FC-DOC",
        blueprint_document_id: "BP-DOC",
      },
    },
  };
}

function basePlan(): EngineeringPlanDocument {
  const trace = {
    requirement_ids: ["REQ-1"],
    architecture_module_ids: ["ARCH-AUTH"],
    erd_entity_ids: ["User"],
    dfd_process_ids: ["PROC-L1-1"],
    flowchart_process_ids: ["FC-P-1"],
    blueprint_module_ids: ["BP-MOD-1"],
    agent_package_module_ids: ["MOD-1"],
    design_system_screen_ids: ["screen-login"],
    design_system_component_ids: ["comp-input"],
  };

  return {
    version: "1.0",
    title: "Mock Engineering Plan",
    description: "Engineering execution plan for testing.",
    project_summary: {
      project_name: "Mock Project",
      overview: "A mock project that authenticates users.",
      target_users: ["Admin"],
      primary_goals: ["Authenticate users"],
    },
    engineering_principles: [
      {
        id: "EP-1",
        principle: "Correctness before speed",
        description: "Prefer verified behavior over clever shortcuts.",
      },
    ],
    repository_strategy: {
      branching_model: "Trunk-based development.",
      commit_conventions: "Conventional commits.",
      review_process: "Pull request review by a second engineer.",
      release_strategy: "Semantic versioning.",
      structure_notes: ["Keep modules isolated."],
    },
    technology_stack: [
      {
        id: "STACK-1",
        category: "language",
        technology: "TypeScript",
        version: "5.9",
        justification: "Static typing catches refactors early.",
      },
    ],
    environment_requirements: {
      environments: [
        {
          id: "ENV-DEV",
          name: "Local",
          purpose: "Local development environment.",
          variables: [
            {
              name: "DATABASE_URL",
              description: "Postgres connection string.",
              secret: false,
            },
            {
              name: "SUPABASE_SERVICE_ROLE",
              description: "Service role credential for admin operations.",
              secret: true,
            },
          ],
        },
      ],
      local_setup: ["Install dependencies with npm install."],
      ci_requirements: ["Typecheck and lint must pass."],
    },
    directory_structure: {
      file_plan: {
        create: [
          {
            path: "src/auth/login.ts",
            purpose: "Login page component.",
            module_id: "MOD-AUTH",
          },
          {
            path: "src/auth/service.ts",
            purpose: "Authentication service.",
            module_id: "MOD-AUTH",
          },
        ],
        modify: [
          {
            path: "src/routes.ts",
            purpose: "Register auth routes.",
            module_id: "MOD-AUTH",
          },
        ],
        preserve: [
          {
            path: "src/core/app.ts",
            purpose: "Application bootstrap must stay stable.",
            module_id: "MOD-AUTH",
          },
        ],
      },
      conventions: ["Use strict TypeScript settings."],
    },
    modules: [
      {
        module_id: "MOD-AUTH",
        name: "Auth Module",
        purpose: "Handle authentication end to end.",
        frontend_work: ["Build the login page."],
        backend_work: ["Implement the auth service."],
        database_work: ["Query the users table."],
        api_work: ["Expose the login endpoint."],
        auth_work: ["Manage the session cookie."],
        validation_work: ["Validate the login payload."],
        testing_work: ["Cover login flows."],
        dependencies: [],
        implementation_order: 1,
        traceability: { ...trace },
      },
    ],
    database_implementation: {
      tables: [
        {
          entity_id: "User",
          table_name: "users",
          purpose: "Stores user accounts.",
          columns: [
            { name: "id", type: "uuid", constraints: ["primary key"] },
            { name: "email", type: "text", constraints: ["not null", "unique"] },
          ],
          relationships: [],
          indexes: [
            { name: "users_email_idx", columns: ["email"], unique: true },
          ],
          constraints: [],
          rls: [
            {
              policy_name: "users_read_own",
              mode: "read",
              description: "Users read their own rows.",
            },
          ],
        },
      ],
      migrations: [
        {
          id: "001_create_users",
          description: "Create the users table.",
          order: 1,
        },
      ],
      seed_requirements: ["Seed one admin user."],
    },
    api_implementation: [
      {
        id: "API-1",
        method: "POST",
        path: "/api/auth/login",
        purpose: "Log a user in.",
        module_id: "MOD-AUTH",
        authentication_required: false,
        authorization: { roles: ["admin"], permissions: ["auth:login"] },
        request: {
          description: "Email and password.",
          body_fields: ["email", "password"],
          query_params: [],
        },
        response: {
          description: "Session cookie and user summary.",
          body_fields: ["user"],
        },
        validation: ["Email must be valid."],
        errors: [
          {
            status: 401,
            condition: "Credentials do not match.",
            response_message: "Invalid email or password.",
          },
        ],
        database_operations: ["select user by email"],
        testing: ["Cover successful login."],
        traceability: {
          requirement_ids: ["REQ-1"],
          architecture_module_ids: ["ARCH-AUTH"],
          blueprint_module_ids: ["BP-MOD-1"],
        },
      },
    ],
    authentication_implementation: {
      flow: "Email and password login with a session cookie.",
      session_handling: {
        strategy: "Server-side session records.",
        storage: "http-only cookie",
        expiration: "7 days",
      },
      mechanisms: ["Session cookie"],
      protected_routes: ["/dashboard"],
      public_routes: ["/login"],
      implementation_notes: [],
    },
    authorization_implementation: {
      roles: [
        {
          role: "admin",
          permissions: ["admin:all"],
          module_access: ["MOD-AUTH"],
          source: "blueprint authorization_plan",
        },
        {
          role: "member",
          permissions: [],
          module_access: ["MOD-AUTH"],
          source: "blueprint authorization_plan",
        },
      ],
      route_protection: [
        { route: "/dashboard", methods: ["GET"], roles: ["admin", "member"] },
        { route: "/api/auth/login", methods: ["POST"], roles: ["admin"] },
      ],
      frontend_visibility: ["Hide admin-only actions from members."],
      server_enforcement: ["Check the role server-side on every request."],
    },
    frontend_implementation: {
      pages: [
        {
          id: "PAGE-DASH",
          route: "/dashboard",
          screen_id: "screen-dashboard",
          purpose: "Show the overview.",
          components: ["comp-button"],
          forms: [],
          tables: ["table-items"],
          states: {
            loading: "Skeleton rows.",
            empty: "No projects yet.",
            error: "Retry banner.",
            success: "Content rendered.",
          },
          responsive_behavior: "Cards stack on mobile.",
          accessibility: ["Use landmark regions."],
        },
        {
          id: "PAGE-LOGIN",
          route: "/login",
          screen_id: "screen-login",
          purpose: "Sign in.",
          components: ["comp-button", "comp-input"],
          forms: ["form-login"],
          tables: [],
          states: {
            loading: "Spinner in the button.",
            empty: "Not applicable.",
            error: "Inline field error.",
            success: "Redirect to dashboard.",
          },
          responsive_behavior: "Centered card on all sizes.",
          accessibility: ["Move focus to the first field."],
        },
      ],
      global_components: ["AppHeader"],
      navigation_notes: ["Primary navigation links to the dashboard."],
    },
    backend_implementation: {
      services: [
        {
          id: "SVC-AUTH",
          name: "AuthService",
          purpose: "Handle login and sessions.",
          module_id: "MOD-AUTH",
          responsibilities: ["Validate credentials"],
        },
      ],
      data_access: [
        {
          id: "DA-USERS",
          table: "users",
          operations: ["select"],
          service_id: "SVC-AUTH",
        },
      ],
      business_rules: [
        {
          id: "BR-1",
          rule: "Only active users may sign in.",
          source_requirement_id: "REQ-1",
          service_id: "SVC-AUTH",
        },
      ],
      transactions: [],
      error_boundaries: ["Map auth failures to HTTP 401."],
    },
    validation_strategy: {
      client_side: [
        {
          id: "VAL-CLIENT-LOGIN",
          target: "LoginForm",
          rules: ["Email must be valid."],
        },
      ],
      server_side: [
        {
          id: "VAL-SERVER-LOGIN",
          target: "LoginInput",
          rules: ["Reject malformed email addresses."],
        },
      ],
      shared_rules: ["Email format rule shared across layers."],
    },
    error_handling: {
      categories: [
        {
          id: "ERR-AUTH",
          category: "authentication",
          http_status: 401,
          user_message: "Invalid email or password.",
          logging: "warn",
        },
      ],
      retry_policies: [
        {
          id: "RETRY-DB",
          target: "database",
          strategy: "Retry twice with backoff.",
        },
      ],
      global_handlers: ["Central error handler maps known errors."],
    },
    security_implementation: {
      secrets_handling: ["Read configuration values from environment variables only."],
      input_sanitization: ["Trim and validate all user input."],
      rls_strategy: [{ table: "users", policies: ["users_read_own"] }],
      rate_limiting: [],
      security_headers: ["Strict-Transport-Security"],
      audit_logging: ["Log login attempts."],
    },
    testing_strategy: {
      levels: [
        {
          id: "unit",
          approach: "Pure function tests.",
          tools: ["vitest"],
          scope: ["validation rules"],
        },
        {
          id: "integration",
          approach: "Service and database tests.",
          tools: ["vitest"],
          scope: ["auth service"],
        },
        {
          id: "api",
          approach: "HTTP endpoint tests.",
          tools: ["vitest"],
          scope: ["login endpoint"],
        },
        {
          id: "auth",
          approach: "Session lifecycle tests.",
          tools: ["vitest"],
          scope: ["login and logout"],
        },
        {
          id: "rbac",
          approach: "Role enforcement tests.",
          tools: ["vitest"],
          scope: ["route protection"],
        },
        {
          id: "database_rls",
          approach: "Row level security tests.",
          tools: ["vitest"],
          scope: ["users table policies"],
        },
      ],
      coverage_expectations: ["Critical paths are covered by automated tests."],
      required_suites: ["auth-suite"],
    },
    implementation_phases: [
      {
        id: "P-FOUNDATION",
        name: "Foundation",
        kind: "foundation",
        order: 1,
        tasks: ["T-1"],
        dependencies: [],
        completion_checks: ["Tooling configured."],
      },
      {
        id: "P-DATABASE",
        name: "Database",
        kind: "database",
        order: 2,
        tasks: [],
        dependencies: ["P-FOUNDATION"],
        completion_checks: ["Migrations applied."],
      },
      {
        id: "P-AUTH",
        name: "Authentication",
        kind: "authentication",
        order: 3,
        tasks: ["T-2"],
        dependencies: ["P-DATABASE"],
        completion_checks: ["Login works locally."],
      },
      {
        id: "P-RBAC",
        name: "Authorization",
        kind: "authorization",
        order: 4,
        tasks: [],
        dependencies: ["P-AUTH"],
        completion_checks: ["Roles enforced."],
      },
      {
        id: "P-BACKEND",
        name: "Backend",
        kind: "backend",
        order: 5,
        tasks: [],
        dependencies: ["P-RBAC"],
        completion_checks: ["Services unit tested."],
      },
      {
        id: "P-API",
        name: "API",
        kind: "api",
        order: 6,
        tasks: ["T-3"],
        dependencies: ["P-BACKEND"],
        completion_checks: ["Endpoint contract tested."],
      },
      {
        id: "P-FRONTEND",
        name: "Frontend",
        kind: "frontend",
        order: 7,
        tasks: [],
        dependencies: ["P-API"],
        completion_checks: ["Pages render."],
      },
      {
        id: "P-INTEGRATION",
        name: "Integration",
        kind: "integration",
        order: 8,
        tasks: [],
        dependencies: ["P-FRONTEND"],
        completion_checks: ["End to end flow passes."],
      },
      {
        id: "P-TESTING",
        name: "Testing",
        kind: "testing",
        order: 9,
        tasks: [],
        dependencies: ["P-INTEGRATION"],
        completion_checks: ["All suites green."],
      },
      {
        id: "P-HARDENING",
        name: "Hardening",
        kind: "hardening",
        order: 10,
        tasks: [],
        dependencies: ["P-TESTING"],
        completion_checks: ["Security checks pass."],
      },
    ],
    implementation_tasks: [
      {
        id: "T-1",
        title: "Configure project tooling",
        description: "Set up linting, formatting, and typecheck scripts.",
        phase: "P-FOUNDATION",
        module_id: "MOD-AUTH",
        priority: "critical",
        implementation_order: 1,
        dependencies: [],
        files_to_create: ["src/auth/login.ts"],
        files_to_modify: [],
        files_not_to_modify: ["src/core/app.ts"],
        acceptance_criteria: ["npm run lint passes."],
        test_requirements: ["Tooling smoke test exists."],
        traceability: { ...trace },
      },
      {
        id: "T-2",
        title: "Implement login service",
        description: "Validate credentials and open a session.",
        phase: "P-AUTH",
        module_id: "MOD-AUTH",
        priority: "high",
        implementation_order: 2,
        dependencies: ["T-1"],
        files_to_create: ["src/auth/service.ts"],
        files_to_modify: [],
        files_not_to_modify: [],
        acceptance_criteria: ["Login returns a session cookie."],
        test_requirements: ["Cover invalid credentials."],
        traceability: { ...trace },
      },
      {
        id: "T-3",
        title: "Register auth routes",
        description: "Wire the login endpoint into the router.",
        phase: "P-API",
        module_id: "MOD-AUTH",
        priority: "medium",
        implementation_order: 3,
        dependencies: ["T-2"],
        files_to_create: [],
        files_to_modify: ["src/routes.ts"],
        files_not_to_modify: [],
        acceptance_criteria: ["POST /api/auth/login responds."],
        test_requirements: ["Cover the endpoint contract."],
        traceability: { ...trace },
      },
    ],
    dependencies: [],
    forbidden_changes: [
      {
        id: "do_not_change_requirements",
        rule: "Do not change approved requirements.",
        rationale: "Scope stability protects the delivery plan.",
      },
      {
        id: "do_not_change_architecture",
        rule: "Do not change approved architecture.",
        rationale: "Structural drift invalidates downstream artifacts.",
      },
      {
        id: "do_not_alter_erd",
        rule: "Do not alter the approved ERD.",
        rationale: "The database baseline must stay authoritative.",
      },
      {
        id: "do_not_alter_rbac",
        rule: "Do not alter role definitions.",
        rationale: "Authorization must match the approved model.",
      },
      {
        id: "do_not_expose_secrets",
        rule: "Never commit credentials or tokens.",
        rationale: "Leaked secrets compromise the deployment.",
      },
      {
        id: "do_not_disable_rls",
        rule: "Do not disable row level security.",
        rationale: "Data isolation depends on RLS.",
      },
      {
        id: "do_not_bypass_authentication",
        rule: "Do not bypass authentication checks.",
        rationale: "Every protected route must verify the session.",
      },
      {
        id: "do_not_remove_tests",
        rule: "Do not delete existing tests.",
        rationale: "Coverage protects against regressions.",
      },
      {
        id: "do_not_modify_unrelated_files",
        rule: "Do not touch files outside the plan.",
        rationale: "Unrelated edits enlarge the review surface.",
      },
      {
        id: "do_not_rewrite_working_modules",
        rule: "Do not rewrite modules that already work.",
        rationale: "Unnecessary rewrites introduce risk.",
      },
    ],
    completion_checks: [
      { id: "typecheck", description: "TypeScript must pass.", command: "npm run typecheck", blocking: true },
      { id: "lint", description: "Lint must pass.", command: "npm run lint", blocking: true },
      { id: "build", description: "Production build must succeed.", command: "npm run build", blocking: true },
      { id: "unit_tests", description: "Unit tests must pass.", command: "npm run test:unit", blocking: true },
      { id: "integration_tests", description: "Integration tests must pass.", command: "npm run test:integration", blocking: true },
      { id: "api_tests", description: "API tests must pass.", command: "npm run test:api", blocking: true },
      { id: "auth_tests", description: "Auth tests must pass.", command: "npm run test:auth", blocking: true },
      { id: "rbac_tests", description: "RBAC tests must pass.", command: "npm run test:rbac", blocking: true },
      { id: "database_rls_tests", description: "RLS tests must pass.", command: "npm run test:rls", blocking: true },
      { id: "security_checks", description: "Security scan must pass.", command: "npm run scan:security", blocking: true },
      { id: "responsive_checks", description: "Responsive layout reviewed.", command: "npm run check:responsive", blocking: false },
      { id: "accessibility_checks", description: "Accessibility reviewed.", command: "npm run check:a11y", blocking: false },
    ],
    uncertainty_protocol: {
      protocol:
        "STOP immediately and ask the user whenever an upstream artifact conflicts with this plan or required information is missing. Never guess security-relevant behavior.",
      stop_triggers: [
        { id: "requirement_conflict", trigger: "Requirements contradict each other.", action: "STOP and ask which requirement wins." },
        { id: "architecture_conflict", trigger: "A change conflicts with the architecture.", action: "STOP and escalate before coding." },
        { id: "erd_conflict", trigger: "Schema work conflicts with the ERD.", action: "STOP and confirm the data model." },
        { id: "missing_api_contract", trigger: "An endpoint has no contract.", action: "STOP and request the contract." },
        { id: "missing_permission", trigger: "A permission is undefined.", action: "STOP and ask which role is required." },
        { id: "missing_security_decision", trigger: "A security decision is missing.", action: "STOP and escalate to the owner." },
        { id: "missing_design_decision", trigger: "A UX decision is missing.", action: "STOP and ask for direction." },
        { id: "ambiguous_business_rule", trigger: "A business rule is ambiguous.", action: "STOP and ask for clarification." },
        { id: "destructive_change", trigger: "A change could destroy data.", action: "STOP and request explicit approval." },
        { id: "unexpected_repository_state", trigger: "The repository state is unexpected.", action: "STOP and report the state." },
      ],
    },
    traceability: {
      tasks: [
        { task_id: "T-1", ...trace },
        { task_id: "T-2", ...trace },
        { task_id: "T-3", ...trace },
      ],
    },
    _metadata: {
      source_of_truth: "engineering-plan",
      requirements_document_id: "REQ-DOC",
      architecture_document_id: "ARCH-DOC",
      erd_document_id: "ERD-DOC",
      dfd_document_id: "DFD-DOC",
      flowchart_document_id: "FC-DOC",
      blueprint_document_id: "BP-DOC",
      agent_package_document_id: "AP-DOC",
      design_system_document_id: "DS-DOC",
      generated_at: "2026-10-01T00:00:00Z",
    },
  };
}

function baseReview(): EngineeringReview {
  return {
    summary: "Three findings across security and testing.",
    issues: [
      {
        id: "ISS-1",
        severity: "critical",
        category: "security",
        title: "Session expiry is too long",
        description: "The session lasts far longer than policy allows.",
        evidence: "session_handling.expiration is set to 7 days.",
        suggested_resolution: "Reduce the expiry to 24 hours.",
        source_references: ["BP-DOC"],
      },
      {
        id: "ISS-2",
        severity: "important",
        category: "testing",
        title: "Missing rate limit coverage",
        description: "Login attempts are not covered by a test suite.",
        evidence: "testing_strategy has no attempt limit scenario.",
        suggested_resolution: "Add an attempt limit test.",
        source_references: [],
      },
      {
        id: "ISS-3",
        severity: "minor",
        category: "complexity",
        title: "Verbose phase description",
        description: "Phase wording repeats the completion checks.",
        evidence: "P-TESTING completion checks duplicate the name.",
        suggested_resolution: "Shorten the wording.",
        source_references: [],
      },
    ],
    ready_for_approval: false,
  };
}

function allDecisions(): EngineeringReviewDecision[] {
  return [
    {
      issue_id: "ISS-1",
      decision: "accept",
      resolved_at: "2026-10-01T01:00:00Z",
    },
    {
      issue_id: "ISS-2",
      decision: "accept",
      resolved_at: "2026-10-01T01:01:00Z",
    },
    {
      issue_id: "ISS-3",
      decision: "ignore",
      resolved_at: "2026-10-01T01:02:00Z",
    },
  ];
}

/* ============================================
   SCHEMA TESTS
   ============================================ */

const ctx = baseContext();

const schemaParse = engineeringPlanDocumentSchema.safeParse(clone(basePlan()));
check("plan passes Zod schema", schemaParse.success);

const schemaMissingField = engineeringPlanDocumentSchema.safeParse({
  ...clone(basePlan()),
  implementation_phases: [],
});
check(
  "plan schema rejects empty implementation_phases",
  !schemaMissingField.success,
);

const reviewParse = engineeringReviewSchema.safeParse(clone(baseReview()));
check("review passes Zod schema", reviewParse.success);

const reviewMissingEvidence = engineeringReviewSchema.safeParse({
  summary: "s",
  issues: [
    {
      id: "X",
      severity: "minor",
      category: "complexity",
      title: "t",
      description: "d",
      suggested_resolution: "fix",
      source_references: [],
    },
  ],
  ready_for_approval: false,
});
check("review schema rejects issue without evidence", !reviewMissingEvidence.success);

const customNoRationale = engineeringReviewDecisionSchema.safeParse({
  issue_id: "ISS-1",
  decision: "custom",
  resolved_at: "2026-10-01T01:00:00Z",
});
check("decision schema rejects custom without rationale", !customNoRationale.success);

const customWithRationale = engineeringReviewDecisionSchema.safeParse({
  issue_id: "ISS-1",
  decision: "custom",
  rationale: "Ship as-is per owner decision.",
  resolved_at: "2026-10-01T01:00:00Z",
});
check("decision schema accepts custom with rationale", customWithRationale.success);

const acceptNoRationale = engineeringReviewDecisionSchema.safeParse({
  issue_id: "ISS-1",
  decision: "accept",
  resolved_at: "2026-10-01T01:00:00Z",
});
check("decision schema accepts accept without rationale", acceptNoRationale.success);

/* ============================================
   VALIDATOR: BASELINE
   ============================================ */

const baseRes = validateEngineeringPlanDocument(clone(basePlan()), ctx);
check(
  "valid plan passes with full upstream context",
  baseRes.valid && baseRes.issues.length === 0,
  JSON.stringify(baseRes.issues.map((i) => i.id)),
);

const noCtxRes = validateEngineeringPlanDocument(clone(basePlan()));
check(
  "valid plan passes without context",
  noCtxRes.valid && noCtxRes.issues.length === 0,
  JSON.stringify(noCtxRes.issues.map((i) => i.id)),
);

/* ============================================
   VALIDATOR: METADATA / IDENTITY
   ============================================ */

{
  const p = clone(basePlan());
  (p._metadata as { source_of_truth: string }).source_of_truth = "engineering-plan-doc";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("invalid metadata source detected", hasErrorId(r, "invalid-metadata-source"));
}

{
  const p = clone(basePlan());
  p._metadata.agent_package_document_id = " ";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("empty metadata agent_package id detected", hasErrorId(r, "empty-metadata-agent_package"));
}

{
  const p = clone(basePlan());
  p.modules.push(clone(p.modules[0]));
  const r = validateEngineeringPlanDocument(p, ctx);
  check("duplicate module id detected", hasErrorId(r, "dup-module-MOD-AUTH"));
}

{
  const p = clone(basePlan());
  p.implementation_tasks.push(clone(p.implementation_tasks[0]));
  const r = validateEngineeringPlanDocument(p, ctx);
  check("duplicate task id detected", hasErrorId(r, "dup-task-T-1"));
}

{
  const p = clone(basePlan());
  p.implementation_tasks[1].implementation_order = 1;
  const r = validateEngineeringPlanDocument(p, ctx);
  check("duplicate task implementation order detected", hasErrorId(r, "dup-task-order-1"));
}

{
  const p = clone(basePlan());
  p.database_implementation.tables.push(clone(p.database_implementation.tables[0]));
  const r = validateEngineeringPlanDocument(p, ctx);
  check("duplicate table name detected", hasErrorId(r, "dup-table-users"));
}

{
  const p = clone(basePlan());
  p.implementation_phases[9].kind = "database";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("duplicate phase kind detected", hasErrorId(r, "duplicate-phase-kind-database"));
}

{
  const p = clone(basePlan());
  p.engineering_principles.push(clone(p.engineering_principles[0]));
  const r = validateEngineeringPlanDocument(p, ctx);
  check("duplicate principle id detected", hasErrorId(r, "dup-principle-EP-1"));
}

/* ============================================
   VALIDATOR: PHASES
   ============================================ */

{
  const p = clone(basePlan());
  p.implementation_phases = p.implementation_phases.filter(
    (ph) => ph.kind !== "hardening",
  );
  const r = validateEngineeringPlanDocument(p, ctx);
  check("missing canonical phase detected", hasErrorId(r, "missing-phase-hardening"));
}

{
  const p = clone(basePlan());
  p.implementation_phases[1].dependencies = [];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "phase missing prerequisite detected",
    hasErrorId(r, "phase-missing-prerequisite-P-DATABASE"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_phases[1].dependencies = ["P-NOPE"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown phase dependency detected",
    hasErrorId(r, "unknown-phase-dependency-P-DATABASE-P-NOPE"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_phases[0].dependencies = ["P-HARDENING"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "circular phase dependency detected",
    r.issues.some((i) => i.id.startsWith("circular-phase-dependency-")),
  );
}

{
  const p = clone(basePlan());
  p.implementation_phases[0].dependencies = ["P-FOUNDATION"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "self phase dependency detected",
    hasErrorId(r, "self-phase-dependency-P-FOUNDATION"),
  );
}

/* ============================================
   VALIDATOR: MODULES
   ============================================ */

{
  const p = clone(basePlan());
  p.modules[0].dependencies = ["MOD-AUTH"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check("self module dependency detected", hasErrorId(r, "self-module-dependency-MOD-AUTH"));
}

{
  const p = clone(basePlan());
  p.modules[0].dependencies = ["MOD-X"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown module dependency detected",
    hasErrorId(r, "unknown-module-dependency-MOD-AUTH-MOD-X"),
  );
}

{
  const p = clone(basePlan());
  const second = clone(p.modules[0]);
  second.module_id = "MOD-X";
  second.dependencies = ["MOD-AUTH"];
  p.modules.push(second);
  p.modules[0].dependencies = ["MOD-X"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "circular module dependency detected",
    r.issues.some((i) => i.id.startsWith("circular-module-dependency-")),
  );
}

{
  const p = clone(basePlan());
  p.modules[0].traceability.blueprint_module_ids = [];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "module without blueprint source detected",
    hasErrorId(r, "module-no-blueprint-source-MOD-AUTH"),
  );
}

/* ============================================
   VALIDATOR: FILE PLAN
   ============================================ */

{
  const p = clone(basePlan());
  p.directory_structure.file_plan.create[0].module_id = "MOD-X";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "file plan unknown module detected",
    hasErrorId(r, "file-unknown-module-src/auth/login.ts"),
  );
}

{
  const p = clone(basePlan());
  p.directory_structure.file_plan.modify.push(
    clone(p.directory_structure.file_plan.create[0]),
  );
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "file create/modify conflict detected",
    hasErrorId(r, "file-create-modify-conflict-src/auth/login.ts"),
  );
}

{
  const p = clone(basePlan());
  p.directory_structure.file_plan.create.push(
    clone(p.directory_structure.file_plan.create[0]),
  );
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "duplicate file plan entry detected",
    hasErrorId(r, "dup-file-create-src/auth/login.ts"),
  );
}

/* ============================================
   VALIDATOR: TASKS
   ============================================ */

{
  const p = clone(basePlan());
  p.implementation_tasks[0].phase = "P-X";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("task unknown phase detected", hasErrorId(r, "task-unknown-phase-T-1"));
}

{
  const p = clone(basePlan());
  p.implementation_phases[0].tasks = [];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "task not listed in phase detected",
    hasErrorId(r, "task-not-listed-in-phase-T-1"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].module_id = "MOD-Z";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("task unknown module detected", hasErrorId(r, "task-unknown-module-T-1"));
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].dependencies = ["T-1"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check("self task dependency detected", hasErrorId(r, "self-task-dependency-T-1"));
}

{
  const p = clone(basePlan());
  p.implementation_tasks[2].dependencies = ["T-9"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown task dependency detected",
    hasErrorId(r, "unknown-task-dependency-T-3-T-9"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[1].dependencies = [];
  p.implementation_tasks[0].dependencies = ["T-2"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "dependency after dependent detected",
    hasErrorId(r, "dependency-after-dependent-T-1-T-2"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].dependencies = ["T-2"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "circular task dependency detected",
    r.issues.some((i) => i.id.startsWith("circular-task-dependency-")),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].files_to_create.push("src/ghost.ts");
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "task create not in file plan detected",
    hasErrorId(r, "task-create-not-in-plan-T-1-src/ghost.ts"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].files_to_modify.push("src/ghost2.ts");
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "task modify not in file plan detected",
    hasErrorId(r, "task-modify-not-in-plan-T-1-src/ghost2.ts"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].files_not_to_modify.push("src/routes.ts");
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "task preserve conflict detected",
    hasErrorId(r, "task-preserve-conflict-T-1-src/routes.ts"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[1].traceability = {
    requirement_ids: [],
    architecture_module_ids: [],
    erd_entity_ids: [],
    dfd_process_ids: [],
    flowchart_process_ids: [],
    blueprint_module_ids: [],
    agent_package_module_ids: [],
    design_system_screen_ids: [],
    design_system_component_ids: [],
  };
  const r = validateEngineeringPlanDocument(p, ctx);
  check("empty task traceability detected", hasErrorId(r, "empty-task-traceability-T-2"));
}

{
  const p = clone(basePlan());
  p.implementation_phases[0].tasks.push("T-9");
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "phase unknown task detected",
    hasErrorId(r, "phase-unknown-task-P-FOUNDATION-T-9"),
  );
}

/* ============================================
   VALIDATOR: EXTERNAL DEPENDENCIES
   ============================================ */

{
  const p = clone(basePlan());
  p.dependencies.push({
    id: "EXT-1",
    type: "package",
    name: "example-lib",
    version: "1.0.0",
    purpose: "Provides helper utilities.",
    required_by: ["T-9"],
  });
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "external dependency unknown task detected",
    hasErrorId(r, "external-dependency-unknown-task-EXT-1-T-9"),
  );
}

/* ============================================
   VALIDATOR: DATABASE / SECURITY
   ============================================ */

{
  const p = clone(basePlan());
  p.database_implementation.tables[0].relationships.push({
    from_column: "id",
    to_table: "ghost",
    to_column: "id",
    type: "one-to-many",
  });
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "relationship unknown table detected",
    hasErrorId(r, "unknown-related-table-users-ghost"),
  );
}

{
  const p = clone(basePlan());
  p.security_implementation.rls_strategy.push({
    table: "ghost",
    policies: ["p"],
  });
  const r = validateEngineeringPlanDocument(p, ctx);
  check("rls unknown table detected", hasErrorId(r, "rls-unknown-table-ghost"));
}

{
  const p = clone(basePlan());
  p.security_implementation.rls_strategy = [];
  const r = validateEngineeringPlanDocument(p, ctx);
  check("missing rls strategy detected", hasErrorId(r, "missing-rls-strategy-users"));
}

{
  const p = clone(basePlan());
  p.security_implementation.secrets_handling = [];
  const r = validateEngineeringPlanDocument(p, ctx);
  check("missing secrets handling detected", hasErrorId(r, "missing-secrets-handling"));
}

{
  const p = clone(basePlan());
  p.security_implementation.input_sanitization = [];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "missing input sanitization detected",
    hasErrorId(r, "missing-input-sanitization"),
  );
}

/* ============================================
   VALIDATOR: API / AUTH / BACKEND
   ============================================ */

{
  const p = clone(basePlan());
  p.api_implementation[0].module_id = "MOD-Z";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("api unknown module detected", hasErrorId(r, "api-unknown-module-API-1"));
}

{
  const p = clone(basePlan());
  p.api_implementation[0].traceability = {
    requirement_ids: [],
    architecture_module_ids: [],
    blueprint_module_ids: [],
  };
  const r = validateEngineeringPlanDocument(p, ctx);
  check("empty api traceability detected", hasErrorId(r, "empty-api-traceability-API-1"));
}

{
  const p = clone(basePlan());
  p.authorization_implementation.roles[0].source = "";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("role without source detected", hasErrorId(r, "role-no-source-admin"));
}

{
  const p = clone(basePlan());
  p.authorization_implementation.route_protection[0].route = "dashboard";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("invalid protected route detected", hasErrorId(r, "invalid-protected-route-dashboard"));
}

{
  const p = clone(basePlan());
  p.authorization_implementation.route_protection[0].roles = [];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "protected route without roles detected",
    hasErrorId(r, "protected-route-no-roles-/dashboard"),
  );
}

{
  const p = clone(basePlan());
  p.backend_implementation.data_access[0].table = "ghost";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "data access unknown table detected",
    hasErrorId(r, "data-access-unknown-table-DA-USERS"),
  );
}

{
  const p = clone(basePlan());
  p.backend_implementation.data_access[0].service_id = "SVC-X";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "data access unknown service detected",
    hasErrorId(r, "data-access-unknown-service-DA-USERS"),
  );
}

{
  const p = clone(basePlan());
  p.backend_implementation.services[0].module_id = "MOD-Z";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "service unknown module detected",
    hasErrorId(r, "service-unknown-module-SVC-AUTH"),
  );
}

{
  const p = clone(basePlan());
  p.backend_implementation.business_rules[0].service_id = "SVC-X";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "business rule unknown service detected",
    hasErrorId(r, "business-rule-unknown-service-BR-1"),
  );
}

/* ============================================
   VALIDATOR: TESTING / UNCERTAINTY / FORBIDDEN / COMPLETION
   ============================================ */

{
  const p = clone(basePlan());
  p.testing_strategy.levels = p.testing_strategy.levels.filter(
    (l) => l.id !== "rbac",
  );
  const r = validateEngineeringPlanDocument(p, ctx);
  check("missing test level detected", hasErrorId(r, "missing-test-level-rbac"));
}

{
  const p = clone(basePlan());
  p.uncertainty_protocol.protocol = "Ask when unsure.";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "uncertainty protocol missing STOP detected",
    hasErrorId(r, "uncertainty-protocol-missing-stop"),
  );
}

{
  const p = clone(basePlan());
  p.uncertainty_protocol.stop_triggers =
    p.uncertainty_protocol.stop_triggers.filter((t) => t.id !== "erd_conflict");
  const r = validateEngineeringPlanDocument(p, ctx);
  check("missing stop trigger detected", hasErrorId(r, "missing-stop-trigger-erd_conflict"));
}

{
  const p = clone(basePlan());
  p.forbidden_changes = p.forbidden_changes.filter(
    (f) => f.id !== "do_not_disable_rls",
  );
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "missing forbidden change detected",
    hasErrorId(r, "missing-forbidden-change-do_not_disable_rls"),
  );
}

{
  const p = clone(basePlan());
  p.completion_checks = p.completion_checks.filter((c) => c.id !== "typecheck");
  const r = validateEngineeringPlanDocument(p, ctx);
  check("missing completion check detected", hasErrorId(r, "missing-completion-check-typecheck"));
}

/* ============================================
   VALIDATOR: TRACEABILITY ROLLUP
   ============================================ */

{
  const p = clone(basePlan());
  p.traceability.tasks = p.traceability.tasks.filter((t) => t.task_id !== "T-3");
  const r = validateEngineeringPlanDocument(p, ctx);
  check("orphan task traceability detected", hasErrorId(r, "orphan-task-traceability-T-3"));
}

{
  const p = clone(basePlan());
  p.traceability.tasks.push({
    task_id: "T-9",
    requirement_ids: ["REQ-1"],
    architecture_module_ids: [],
    erd_entity_ids: [],
    dfd_process_ids: [],
    flowchart_process_ids: [],
    blueprint_module_ids: [],
    agent_package_module_ids: [],
    design_system_screen_ids: [],
    design_system_component_ids: [],
  });
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "traceability unknown task detected",
    hasErrorId(r, "traceability-unknown-task-T-9"),
  );
}

{
  const p = clone(basePlan());
  p.traceability.tasks[0] = {
    task_id: "T-1",
    requirement_ids: [],
    architecture_module_ids: [],
    erd_entity_ids: [],
    dfd_process_ids: [],
    flowchart_process_ids: [],
    blueprint_module_ids: [],
    agent_package_module_ids: [],
    design_system_screen_ids: [],
    design_system_component_ids: [],
  };
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "empty rollup traceability detected",
    hasErrorId(r, "empty-rollup-traceability-T-1"),
  );
}

/* ============================================
   VALIDATOR: SECRET PATTERNS
   ============================================ */

{
  const p = clone(basePlan());
  (p as unknown as Record<string, unknown>).password = "hunter2";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("forbidden secret pattern detected", hasErrorId(r, "forbidden-secret-pattern"));
}

/* ============================================
   VALIDATOR: UPSTREAM CROSS-CHECKS (context)
   ============================================ */

{
  const p = clone(basePlan());
  p.implementation_tasks[0].traceability.requirement_ids = ["REQ-9"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown requirement reference detected",
    hasErrorId(r, "unknown-requirement-T-1-REQ-9"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].traceability.architecture_module_ids = ["ARCH-X"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown architecture module reference detected",
    hasErrorId(r, "unknown-architecture-module-T-1-ARCH-X"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].traceability.erd_entity_ids = ["Ghost"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown ERD entity reference detected",
    hasErrorId(r, "unknown-ERD-entity-T-1-Ghost"),
  );
}

{
  const p = clone(basePlan());
  p.implementation_tasks[0].traceability.agent_package_module_ids = ["MOD-9"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown agent package module reference detected",
    hasErrorId(r, "unknown-agent-package-module-T-1-MOD-9"),
  );
}

{
  const p = clone(basePlan());
  p.modules[0].traceability.design_system_screen_ids = ["screen-ghost"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "unknown design system screen reference on module detected",
    hasErrorId(r, "unknown-design-system-screen-MOD-AUTH-screen-ghost"),
  );
}

{
  const p = clone(basePlan());
  p.database_implementation.tables[0].entity_id = "Ghost";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "table unknown ERD entity detected",
    hasErrorId(r, "unknown-erd-entity-users-Ghost"),
  );
}

{
  const p = clone(basePlan());
  p.database_implementation.tables[0].entity_id = "Ghost";
  p.database_implementation.tables[0].assumption = "Not yet in the ERD.";
  const r = validateEngineeringPlanDocument(p, ctx);
  const warned = r.issues.some(
    (i) => i.id === "table-assumed-entity-users" && i.severity === "warning",
  );
  check(
    "assumed entity downgraded to warning",
    warned && r.valid,
    JSON.stringify(r.issues.map((i) => i.id)),
  );
}

{
  const p = clone(basePlan());
  p.api_implementation[0].path = "/api/ghost";
  const r = validateEngineeringPlanDocument(p, ctx);
  check("api not in blueprint detected", hasErrorId(r, "unknown-blueprint-api-API-1"));
}

{
  const p = clone(basePlan());
  p.api_implementation[0].authorization.roles = ["ghost"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check("api unknown role detected", hasErrorId(r, "api-unknown-role-API-1-ghost"));
}

{
  const p = clone(basePlan());
  p.api_implementation[0].traceability.blueprint_module_ids = ["BP-X"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "api unknown blueprint module detected",
    hasErrorId(r, "unknown-blueprint-module-API-1-BP-X"),
  );
}

{
  const p = clone(basePlan());
  p.authorization_implementation.roles.push({
    role: "ghost",
    permissions: [],
    module_access: [],
    source: "blueprint",
  });
  const r = validateEngineeringPlanDocument(p, ctx);
  check("authorization unknown role detected", hasErrorId(r, "unknown-role-ghost"));
}

{
  const p = clone(basePlan());
  p.authorization_implementation.route_protection.push({
    route: "/ghost",
    methods: ["GET"],
    roles: ["admin"],
  });
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "protected route not in blueprint detected",
    hasErrorId(r, "unknown-protected-route-/ghost"),
  );
}

{
  const p = clone(basePlan());
  p.authorization_implementation.route_protection[0].roles = ["ghost"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "protected route unknown role detected",
    hasErrorId(r, "protected-route-unknown-role-/dashboard-ghost"),
  );
}

{
  const p = clone(basePlan());
  p.frontend_implementation.pages[0].route = "/ghost";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "frontend route not in blueprint detected",
    hasErrorId(r, "unknown-frontend-route-PAGE-DASH"),
  );
}

{
  const p = clone(basePlan());
  p.frontend_implementation.pages[0].screen_id = "screen-ghost";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "page unknown design system screen detected",
    hasErrorId(r, "unknown-design-system-screen-PAGE-DASH-screen-ghost"),
  );
}

{
  const p = clone(basePlan());
  p.frontend_implementation.pages[0].components = ["comp-ghost"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "page unknown design system component detected",
    hasErrorId(r, "unknown-design-system-component-PAGE-DASH-comp-ghost"),
  );
}

{
  const p = clone(basePlan());
  p.frontend_implementation.pages[1].forms = ["form-ghost"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "page unknown design system form pattern detected",
    hasErrorId(r, "unknown-design-system-form-PAGE-LOGIN-form-ghost"),
  );
}

{
  const p = clone(basePlan());
  p.frontend_implementation.pages[0].tables = ["table-ghost"];
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "page unknown design system table pattern detected",
    hasErrorId(r, "unknown-design-system-table-PAGE-DASH-table-ghost"),
  );
}

{
  const p = clone(basePlan());
  p.backend_implementation.business_rules[0].source_requirement_id = "REQ-9";
  const r = validateEngineeringPlanDocument(p, ctx);
  check(
    "business rule unknown requirement detected",
    hasErrorId(r, "unknown-business-rule-requirement-BR-1-REQ-9"),
  );
}

/* ============================================
   APPROVAL / REVIEW LIFECYCLE
   ============================================ */

function approve(overrides: Partial<Parameters<typeof evaluateEngineeringPlanApproval>[0]> = {}) {
  return evaluateEngineeringPlanApproval({
    isOwner: true,
    status: "review",
    reviewData: baseReview(),
    decisions: allDecisions(),
    validationValid: true,
    upstreamsComplete: true,
    sourceIdsMatch: true,
    ...overrides,
  });
}

{
  const res = approve();
  check(
    "review lifecycle: full coverage + valid doc approves",
    res.approved,
    res.reasons.join(" | "),
  );
}

{
  const res = approve({ isOwner: false });
  check(
    "review lifecycle: non-owner rejected",
    !res.approved && res.reasons.some((r) => r.includes("owner")),
  );
}

{
  const res = approve({ status: "draft" });
  check(
    "review lifecycle: draft status rejected",
    !res.approved && res.reasons.some((r) => r.includes("review")),
  );
}

{
  const res = approve({ status: "approved" });
  check(
    "review lifecycle: already approved rejected",
    !res.approved && res.reasons.some((r) => r.includes("already approved")),
  );
}

{
  const res = approve({ reviewData: null, decisions: [] });
  check(
    "review lifecycle: missing review rejected",
    !res.approved && res.reasons.some((r) => r.includes("No review data")),
  );
}

{
  const res = approve({ decisions: allDecisions().slice(0, 2) });
  check(
    "review lifecycle: incomplete decisions rejected",
    !res.approved && res.reasons.some((r) => r.includes("unresolved")),
  );
}

{
  const decisions: EngineeringReviewDecision[] = allDecisions().map((d) =>
    d.issue_id === "ISS-1" ? { ...d, decision: "ignore" } : d,
  );
  const res = approve({ decisions });
  check(
    "review lifecycle: critical issue ignored blocks approval",
    !res.approved && res.reasons.some((r) => r.includes("critical")),
    res.reasons.join(" | "),
  );
}

{
  const res = approve({ validationValid: false });
  check(
    "review lifecycle: invalid document rejected",
    !res.approved && res.reasons.some((r) => r.includes("validation")),
  );
}

{
  const res = approve({ upstreamsComplete: false });
  check(
    "review lifecycle: missing upstreams rejected",
    !res.approved && res.reasons.some((r) => r.includes("upstream")),
  );
}

{
  const res = approve({ sourceIdsMatch: false });
  check(
    "review lifecycle: stale source ids rejected",
    !res.approved && res.reasons.some((r) => r.toLowerCase().includes("source document ids")),
  );
}

{
  const emptyReview: EngineeringReview = {
    summary: "No issues.",
    issues: [],
    ready_for_approval: true,
  };
  const res = approve({ reviewData: emptyReview, decisions: [] });
  check(
    "review lifecycle: empty review approves",
    res.approved,
    res.reasons.join(" | "),
  );
}

check("mutation allowed in draft", canMutateEngineeringPlan("draft"));
check("mutation allowed in review", canMutateEngineeringPlan("review"));
check("mutation blocked when approved", !canMutateEngineeringPlan("approved"));

/* ============================================
   SUMMARY
   ============================================ */

console.log(
  failures === 0
    ? "\nAll engineering plan validation checks passed."
    : `\n${failures} check(s) FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
