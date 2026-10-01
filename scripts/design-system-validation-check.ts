import {
  validateDesignSystemDocument,
  designSystemDocumentSchema,
  designSystemReviewSchema,
  designSystemReviewDecisionSchema,
  evaluateDesignSystemApproval,
  canMutateDesignSystem,
} from "../lib/ai/design-system";
import type {
  DesignSystemDocument,
  DesignSystemUpstreamContext,
  DesignSystemReview,
  DesignSystemReviewDecision,
} from "../lib/ai/design-system";

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

function baseContext(): DesignSystemUpstreamContext {
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
      nodes: [
        { id: "FC-1", type: "start", label: "Start", description: "", process_code: "" },
        { id: "FC-2", type: "process", label: "Do Auth", description: "", process_code: "" },
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
        summary: "",
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
        mechanism: "",
        session_strategy: "",
        protected_routes: [],
        public_routes: [],
        boundaries: [],
        security_considerations: [],
      },
      authorization_plan: {
        summary: "",
        roles: [
          { role: "admin", permissions: [], module_access: [] },
          { role: "member", permissions: [], module_access: [] },
        ],
        server_side_enforcement: [],
        ui_visibility_rules: [],
      },
      frontend_plan: {
        summary: "",
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

function baseDoc(): DesignSystemDocument {
  return {
    version: "1.0",
    title: "Mock Design System",
    description: "Design system for testing.",
    design_principles: [
      { id: "DP-1", principle: "Clarity", description: "Prefer clarity over novelty." },
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
        {
          id: "tok-bg",
          name: "Background",
          value: "#ffffff",
          usage: "Page background.",
          contrast_notes: "Base surface for text_primary.",
        },
        {
          id: "tok-text",
          name: "Text",
          value: "#111827",
          usage: "Body text.",
          contrast_notes: "15:1 against background.",
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
        { level: "display", font_size: "36px", line_height: "1.2", usage: "Page hero." },
        { level: "h1", font_size: "30px", line_height: "1.2", usage: "Page titles." },
        { level: "h2", font_size: "24px", line_height: "1.3", usage: "Section titles." },
        { level: "h3", font_size: "20px", line_height: "1.3", usage: "Subsection titles." },
      ],
      body_scale: [
        { level: "body", font_size: "16px", line_height: "1.5", usage: "Default text." },
        { level: "body_small", font_size: "14px", line_height: "1.5", usage: "Secondary text." },
      ],
      caption_scale: [
        { level: "caption", font_size: "12px", line_height: "1.4", usage: "Captions." },
        { level: "label", font_size: "12px", line_height: "1.4", usage: "Field labels." },
      ],
      font_weights: [
        { id: "regular", value: "400", usage: "Body text." },
        { id: "semibold", value: "600", usage: "Headings." },
      ],
      line_heights: [
        { id: "tight", value: "1.2", usage: "Headings." },
        { id: "normal", value: "1.5", usage: "Body." },
      ],
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
        {
          id: "background",
          token_id: "tok-bg",
          value: "#ffffff",
          usage: "Page background.",
          contrast_notes: "Base surface.",
        },
        {
          id: "text_primary",
          token_id: "tok-text",
          value: "#111827",
          usage: "Body text.",
          contrast_notes: "15:1 on background.",
        },
      ],
    },
    spacing_system: {
      scale: [
        { id: "xs", value: "4px", usage: "Tight gaps." },
        { id: "sm", value: "8px", usage: "Inline gaps." },
        { id: "md", value: "12px", usage: "Control padding." },
        { id: "lg", value: "16px", usage: "Card padding." },
        { id: "xl", value: "24px", usage: "Section gaps." },
        { id: "2xl", value: "32px", usage: "Block gaps." },
        { id: "3xl", value: "48px", usage: "Page section gaps." },
      ],
    },
    radius_system: {
      scale: [
        { id: "none", value: "0px", usage: "Flush edges." },
        { id: "sm", value: "4px", usage: "Inputs." },
        { id: "md", value: "8px", usage: "Buttons." },
        { id: "lg", value: "12px", usage: "Cards." },
        { id: "xl", value: "16px", usage: "Modals." },
        { id: "full", value: "9999px", usage: "Pills and avatars." },
      ],
    },
    elevation_system: {
      levels: [
        { id: "none", value: "none", usage: "Flat surfaces." },
        { id: "low", value: "0 1px 2px rgba(0,0,0,0.06)", usage: "Cards." },
        { id: "medium", value: "0 4px 8px rgba(0,0,0,0.08)", usage: "Dropdowns." },
        { id: "high", value: "0 12px 24px rgba(0,0,0,0.12)", usage: "Modals." },
        { id: "overlay", value: "0 24px 48px rgba(0,0,0,0.16)", usage: "Overlays." },
      ],
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
            "Must be keyboard operable using Tab.",
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
        { id: "mobile", width_range: "0-767px", behaviors: ["Single column stack."] },
        { id: "tablet", width_range: "768-1023px", behaviors: ["Two column layout."] },
        { id: "desktop", width_range: "1024px+", behaviors: ["Sidebar visible."] },
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
      breadcrumb_rules: ["Show breadcrumb on pages deeper than the root."],
      mobile_navigation: "Primary navigation becomes a hamburger drawer.",
      active_state: "Active item uses primary color and bold weight.",
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
      {
        id: "pattern-auth",
        name: "Auth Pattern",
        purpose: "Centered form page.",
        layout: "Centered single card.",
        required_sections: ["Form card"],
        optional_sections: [],
        responsive_behavior: "Full width on mobile.",
        accessibility: "Focus moves to the first field.",
        traceability: { blueprint_page_ids: ["BP-PAGE-LOGIN"] },
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
        sorting: { supported: true, rules: ["Sort by column header click."] },
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
        {
          id: "empty",
          visual_treatment: "Illustration with message.",
          message_rules: "Explain why it is empty.",
          user_action: "Offer a primary action.",
          accessibility: "Announce the empty region.",
        },
        {
          id: "error",
          visual_treatment: "Danger banner.",
          message_rules: "State what failed.",
          user_action: "Offer retry.",
          accessibility: "Use role alert.",
        },
        {
          id: "success",
          visual_treatment: "Success banner.",
          message_rules: "Confirm completion.",
          user_action: "Dismiss or continue.",
          accessibility: "Announce politely.",
        },
        {
          id: "warning",
          visual_treatment: "Warning banner.",
          message_rules: "Describe the risk.",
          user_action: "Acknowledge.",
          accessibility: "Announce politely.",
        },
        {
          id: "permission_denied",
          visual_treatment: "Neutral lock panel.",
          message_rules: "Explain missing permission.",
          user_action: "Return to home.",
          accessibility: "Focus the panel heading.",
        },
        {
          id: "not_found",
          visual_treatment: "404 panel.",
          message_rules: "Explain the item was not found.",
          user_action: "Return to home.",
          accessibility: "Focus the panel heading.",
        },
        {
          id: "offline_or_network_error",
          visual_treatment: "Persistent banner.",
          message_rules: "Explain connectivity loss.",
          user_action: "Retry when online.",
          accessibility: "Use role alert.",
        },
      ],
    },
    accessibility_rules: [
      { id: "keyboard_navigation", rule: "All actions reachable via keyboard.", category: "keyboard", applies_to: ["all"] },
      { id: "focus_visibility", rule: "Focus ring always visible.", category: "focus", applies_to: ["all"] },
      { id: "focus_order", rule: "Focus order follows visual order.", category: "focus", applies_to: ["all"] },
      { id: "color_contrast", rule: "Maintain 4.5:1 contrast for text.", category: "contrast", applies_to: ["all"] },
      { id: "semantic_html", rule: "Use semantic elements.", category: "markup", applies_to: ["all"] },
      { id: "form_labels", rule: "Every field has a label.", category: "forms", applies_to: ["forms"] },
      { id: "error_association", rule: "Errors linked via aria-describedby.", category: "forms", applies_to: ["forms"] },
      { id: "screen_reader_support", rule: "Live regions announce changes.", category: "sr", applies_to: ["all"] },
      { id: "touch_target_size", rule: "Targets at least 44 by 44 pixels.", category: "touch", applies_to: ["mobile"] },
      { id: "motion_preferences", rule: "Respect reduced motion preferences.", category: "motion", applies_to: ["all"] },
      { id: "reduced_motion", rule: "Disable non-essential animation.", category: "motion", applies_to: ["all"] },
      { id: "non_color_information", rule: "Never use color as the only signal.", category: "contrast", applies_to: ["all"] },
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
        layout_pattern: "pattern-auth",
        components: ["comp-button", "comp-input"],
        data_requirements: ["Credentials"],
        actions: ["Submit credentials"],
        states: ["idle", "error"],
        responsive_behavior: "Full width card on mobile.",
        accessibility: ["Focus starts on the email field."],
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
        {
          screen_id: "screen-login",
          requirement_ids: ["REQ-1"],
          architecture_module_ids: ["ARCH-AUTH"],
          erd_entity_ids: ["User"],
          dfd_process_ids: ["PROC-L1-1"],
          flowchart_process_ids: ["FC-P-1"],
          blueprint_module_ids: ["BP-MOD-1"],
          blueprint_page_ids: ["BP-PAGE-LOGIN"],
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
  };
}

function errorIds(res: { issues: { id: string; severity: string }[] }): string[] {
  return res.issues.filter((i) => i.severity === "error").map((i) => i.id);
}

function baseReview(): DesignSystemReview {
  return {
    summary: "Two issues found.",
    issues: [
      {
        id: "ISS-1",
        severity: "important",
        category: "consistency",
        title: "Issue one",
        description: "First issue.",
        evidence: "Evidence one.",
        source_references: ["BP-DOC"],
        suggested_resolution: "Fix it.",
        requires_user_decision: true,
      },
      {
        id: "ISS-2",
        severity: "minor",
        category: "layout",
        title: "Issue two",
        description: "Second issue.",
        evidence: "Evidence two.",
        source_references: [],
        suggested_resolution: "Adjust it.",
        requires_user_decision: false,
      },
    ],
    ready_for_approval: false,
  };
}

function allDecisions(): DesignSystemReviewDecision[] {
  return [
    {
      issue_id: "ISS-1",
      decision: "accept",
      resolved_at: "2026-10-01T00:00:00.000Z",
    },
    {
      issue_id: "ISS-2",
      decision: "ignore",
      rationale: "Not applicable.",
      resolved_at: "2026-10-01T00:00:00.000Z",
    },
  ];
}

function runTests() {
  const ctx = baseContext();

  // --- Schema-level tests ---
  const parseOk = designSystemDocumentSchema.safeParse(baseDoc());
  check(
    "Valid design system satisfies Zod schema",
    parseOk.success,
    parseOk.success ? "" : JSON.stringify(parseOk.error.issues.slice(0, 3)),
  );

  const badSource = baseDoc();
  (badSource._metadata as { source_of_truth: string }).source_of_truth = "design-systems";
  check(
    "Schema rejects invalid source_of_truth",
    !designSystemDocumentSchema.safeParse(badSource).success,
  );

  check(
    "Valid review satisfies review schema",
    designSystemReviewSchema.safeParse(baseReview()).success,
  );

  const customNoRationale = {
    issue_id: "ISS-1",
    decision: "custom",
    resolved_at: "2026-10-01T00:00:00.000Z",
  };
  check(
    "Custom decision without rationale is rejected",
    !designSystemReviewDecisionSchema.safeParse(customNoRationale).success,
  );
  check(
    "Custom decision with rationale is accepted",
    designSystemReviewDecisionSchema.safeParse({
      ...customNoRationale,
      rationale: "User chose a different resolution.",
    }).success,
  );

  // --- Validation tests ---
  const r1 = validateDesignSystemDocument(baseDoc(), ctx);
  check(
    "Valid document passes validation with context",
    r1.valid === true,
    errorIds(r1).join(", "),
  );

  const r2 = validateDesignSystemDocument(baseDoc());
  check(
    "Valid document passes validation without context",
    r2.valid === true,
    errorIds(r2).join(", "),
  );

  const t3 = baseDoc();
  t3.component_system.components.push(clone(t3.component_system.components[0]));
  const r3 = validateDesignSystemDocument(t3, ctx);
  check(
    "Duplicate component ID detected",
    !r3.valid && errorIds(r3).some((id) => id.startsWith("dup-component-")),
    errorIds(r3).join(", "),
  );

  const t4 = baseDoc();
  t4.screen_specifications.push(clone(t4.screen_specifications[0]));
  const r4 = validateDesignSystemDocument(t4, ctx);
  check(
    "Duplicate screen ID detected",
    !r4.valid && errorIds(r4).includes("dup-screen-screen-dashboard"),
    errorIds(r4).join(", "),
  );

  const t5 = baseDoc();
  t5.page_patterns.push(clone(t5.page_patterns[0]));
  const r5 = validateDesignSystemDocument(t5, ctx);
  check(
    "Duplicate page pattern ID detected",
    !r5.valid && errorIds(r5).includes("dup-page-pattern-pattern-dashboard"),
    errorIds(r5).join(", "),
  );

  const t6 = baseDoc();
  t6.design_tokens.colors.push(clone(t6.design_tokens.colors[0]));
  const r6 = validateDesignSystemDocument(t6, ctx);
  check(
    "Duplicate design token detected",
    !r6.valid && errorIds(r6).some((id) => id.startsWith("dup-token-")),
    errorIds(r6).join(", "),
  );

  const t7 = baseDoc();
  t7.screen_specifications[0].components = ["comp-ghost"];
  const r7 = validateDesignSystemDocument(t7, ctx);
  check(
    "Screen referencing unknown component detected",
    !r7.valid && errorIds(r7).includes("screen-unknown-component-screen-dashboard-comp-ghost"),
    errorIds(r7).join(", "),
  );

  const t8 = baseDoc();
  t8.screen_specifications[0].layout_pattern = "pattern-ghost";
  const r8 = validateDesignSystemDocument(t8, ctx);
  check(
    "Screen with unknown layout pattern detected",
    !r8.valid && errorIds(r8).includes("screen-no-layout-screen-dashboard"),
    errorIds(r8).join(", "),
  );

  const t9 = baseDoc();
  t9.screen_specifications[1].route = "/dashboard";
  const r9 = validateDesignSystemDocument(t9, ctx);
  check(
    "Duplicate screen route detected",
    !r9.valid && errorIds(r9).includes("dup-screen-route-/dashboard"),
    errorIds(r9).join(", "),
  );

  const t10 = baseDoc();
  t10.screen_specifications[1].route = "login";
  const r10 = validateDesignSystemDocument(t10, ctx);
  check(
    "Invalid screen route detected",
    !r10.valid && errorIds(r10).includes("screen-invalid-route-screen-login"),
    errorIds(r10).join(", "),
  );

  const t11 = baseDoc();
  t11.screen_specifications[1].route = "/ghost";
  const r11 = validateDesignSystemDocument(t11, ctx);
  check(
    "Invented route not in blueprint detected",
    !r11.valid && errorIds(r11).includes("invented-route-screen-login"),
    errorIds(r11).join(", "),
  );

  const t12 = baseDoc();
  t12.screen_specifications[0].user_roles = ["ghost-role"];
  const r12 = validateDesignSystemDocument(t12, ctx);
  check(
    "Screen referencing unknown role detected",
    !r12.valid && errorIds(r12).includes("screen-unknown-role-screen-dashboard-ghost-role"),
    errorIds(r12).join(", "),
  );

  const t13 = baseDoc();
  t13.traceability.screens[0].requirement_ids = ["REQ-1", "REQ-GHOST"];
  const r13 = validateDesignSystemDocument(t13, ctx);
  check(
    "Unknown requirement reference detected",
    !r13.valid && errorIds(r13).includes("unknown-requirement-screen-dashboard-REQ-GHOST"),
    errorIds(r13).join(", "),
  );

  const t14 = baseDoc();
  t14.traceability.screens[0].architecture_module_ids = ["ARCH-GHOST"];
  const r14 = validateDesignSystemDocument(t14, ctx);
  check(
    "Unknown architecture module reference detected",
    !r14.valid &&
      errorIds(r14).includes("unknown-architecture-module-screen-dashboard-ARCH-GHOST"),
    errorIds(r14).join(", "),
  );

  const t15 = baseDoc();
  t15.traceability.screens[0].erd_entity_ids = ["Ghost"];
  const r15 = validateDesignSystemDocument(t15, ctx);
  check(
    "Unknown ERD entity reference detected",
    !r15.valid && errorIds(r15).includes("unknown-ERD-entity-screen-dashboard-Ghost"),
    errorIds(r15).join(", "),
  );

  const t16 = baseDoc();
  t16.traceability.screens[0].dfd_process_ids = ["PROC-GHOST"];
  const r16 = validateDesignSystemDocument(t16, ctx);
  check(
    "Unknown DFD process reference detected",
    !r16.valid && errorIds(r16).includes("unknown-DFD-process-screen-dashboard-PROC-GHOST"),
    errorIds(r16).join(", "),
  );

  const t17 = baseDoc();
  t17.traceability.screens[0].flowchart_process_ids = ["FC-GHOST"];
  const r17 = validateDesignSystemDocument(t17, ctx);
  check(
    "Unknown flowchart reference detected",
    !r17.valid && errorIds(r17).includes("unknown-flowchart-node-screen-dashboard-FC-GHOST"),
    errorIds(r17).join(", "),
  );

  const t18 = baseDoc();
  t18.traceability.screens[0].blueprint_module_ids = ["BP-MOD-GHOST"];
  t18.traceability.screens[0].blueprint_page_ids = ["BP-PAGE-GHOST"];
  t18.traceability.screens[0].blueprint_api_ids = ["BP-API-GHOST"];
  const r18 = validateDesignSystemDocument(t18, ctx);
  check(
    "Unknown blueprint module, page, and API references detected",
    !r18.valid &&
      r18.issues.some((i) => i.id.startsWith("unknown-blueprint-module-")) &&
      r18.issues.some((i) => i.id.startsWith("unknown-blueprint-page-")) &&
      r18.issues.some((i) => i.id.startsWith("unknown-blueprint-API-")),
    errorIds(r18).join(", "),
  );

  const t19 = baseDoc();
  t19.accessibility_rules = t19.accessibility_rules.filter(
    (rule) => rule.id !== "keyboard_navigation",
  );
  const r19 = validateDesignSystemDocument(t19, ctx);
  check(
    "Missing accessibility rule detected",
    !r19.valid && errorIds(r19).includes("missing-accessibility-keyboard_navigation"),
    errorIds(r19).join(", "),
  );

  const t20 = baseDoc();
  const contrastRule = t20.accessibility_rules.find((r) => r.id === "color_contrast");
  if (contrastRule) contrastRule.rule = "Ensure text is legible on backgrounds.";
  const r20 = validateDesignSystemDocument(t20, ctx);
  check(
    "Missing contrast guidance detected",
    !r20.valid && errorIds(r20).includes("missing-contrast-guidance"),
    errorIds(r20).join(", "),
  );

  const t21 = baseDoc();
  t21.component_system.components[0].accessibility_requirements = [
    "Announce state changes via ARIA live region.",
  ];
  const r21 = validateDesignSystemDocument(t21, ctx);
  check(
    "Interactive component without keyboard behavior detected",
    !r21.valid && errorIds(r21).includes("interactive-no-keyboard-comp-button"),
    errorIds(r21).join(", "),
  );

  const t22 = baseDoc();
  t22.component_system.components[1].accessibility_requirements = [
    "Must be keyboard operable using Tab.",
  ];
  const r22 = validateDesignSystemDocument(t22, ctx);
  check(
    "Form component without label rules detected",
    !r22.valid && errorIds(r22).includes("form-component-no-labels-comp-input"),
    errorIds(r22).join(", "),
  );

  const t23 = baseDoc();
  t23.responsive_rules.breakpoints = t23.responsive_rules.breakpoints.filter(
    (bp) => bp.id !== "tablet",
  );
  const r23 = validateDesignSystemDocument(t23, ctx);
  check(
    "Missing responsive breakpoint detected",
    !r23.valid && errorIds(r23).includes("missing-breakpoint-tablet"),
    errorIds(r23).join(", "),
  );

  const t24 = baseDoc();
  t24.responsive_rules.breakpoints[0].behaviors = [];
  const r24 = validateDesignSystemDocument(t24, ctx);
  check(
    "Breakpoint without behavior detected",
    !r24.valid && errorIds(r24).includes("empty-breakpoint-mobile"),
    errorIds(r24).join(", "),
  );

  const t25 = baseDoc();
  t25.color_system.colors.push(clone(t25.color_system.colors[0]));
  const r25 = validateDesignSystemDocument(t25, ctx);
  check(
    "Duplicate semantic color detected",
    !r25.valid && errorIds(r25).includes("dup-semantic-color-primary"),
    errorIds(r25).join(", "),
  );

  const t26 = baseDoc();
  t26.color_system.colors[0].token_id = "tok-ghost";
  const r26 = validateDesignSystemDocument(t26, ctx);
  check(
    "Semantic color with unknown token detected",
    !r26.valid && errorIds(r26).includes("color-unknown-token-primary"),
    errorIds(r26).join(", "),
  );

  const t27 = baseDoc();
  t27.color_system.colors[0].contrast_notes = "";
  const r27 = validateDesignSystemDocument(t27, ctx);
  check(
    "Color role without contrast notes detected",
    !r27.valid && errorIds(r27).includes("color-no-contrast-primary"),
    errorIds(r27).join(", "),
  );

  const t28 = baseDoc();
  t28.typography.heading_scale.push({
    level: "body",
    font_size: "16px",
    line_height: "1.5",
    usage: "Conflict with body scale.",
  });
  const r28 = validateDesignSystemDocument(t28, ctx);
  check(
    "Typography scale conflict detected",
    !r28.valid && errorIds(r28).includes("typography-scale-conflict-body"),
    errorIds(r28).join(", "),
  );

  const t29 = baseDoc();
  t29.typography.heading_scale[0].font_size = "big";
  const r29 = validateDesignSystemDocument(t29, ctx);
  check(
    "Invalid font size detected",
    !r29.valid && errorIds(r29).includes("invalid-font-size-display"),
    errorIds(r29).join(", "),
  );

  const t30 = baseDoc();
  t30.typography.body_scale[0].line_height = "tall";
  const r30 = validateDesignSystemDocument(t30, ctx);
  check(
    "Invalid line height detected",
    !r30.valid && errorIds(r30).includes("invalid-line-height-body"),
    errorIds(r30).join(", "),
  );

  const t31 = baseDoc();
  t31.spacing_system.scale[0].value = "tight";
  const r31 = validateDesignSystemDocument(t31, ctx);
  check(
    "Invalid spacing value detected",
    !r31.valid && errorIds(r31).includes("invalid-spacing-value-xs"),
    errorIds(r31).join(", "),
  );

  const t32 = baseDoc();
  t32.spacing_system.scale[1].value = "2px";
  const r32 = validateDesignSystemDocument(t32, ctx);
  check(
    "Spacing ordering violation detected",
    !r32.valid && errorIds(r32).includes("spacing-order-sm"),
    errorIds(r32).join(", "),
  );

  const t33 = baseDoc();
  t33.traceability.screens = t33.traceability.screens.filter(
    (t) => t.screen_id !== "screen-dashboard",
  );
  const r33 = validateDesignSystemDocument(t33, ctx);
  check(
    "Orphan screen detected",
    !r33.valid && errorIds(r33).includes("orphan-screen-screen-dashboard"),
    errorIds(r33).join(", "),
  );

  const t34 = baseDoc();
  t34.traceability.screens.push({
    screen_id: "screen-ghost",
    requirement_ids: ["REQ-1"],
    architecture_module_ids: [],
    erd_entity_ids: [],
    dfd_process_ids: [],
    flowchart_process_ids: [],
    blueprint_module_ids: [],
    blueprint_page_ids: [],
    blueprint_api_ids: [],
  });
  const r34 = validateDesignSystemDocument(t34, ctx);
  check(
    "Traceability referencing unknown screen detected",
    !r34.valid && errorIds(r34).includes("traceability-unknown-screen-screen-ghost"),
    errorIds(r34).join(", "),
  );

  const t35 = baseDoc();
  const trace = t35.traceability.screens.find((t) => t.screen_id === "screen-login");
  if (trace) {
    trace.requirement_ids = [];
    trace.architecture_module_ids = [];
    trace.erd_entity_ids = [];
    trace.dfd_process_ids = [];
    trace.flowchart_process_ids = [];
    trace.blueprint_module_ids = [];
    trace.blueprint_page_ids = [];
    trace.blueprint_api_ids = [];
  }
  const r35 = validateDesignSystemDocument(t35, ctx);
  check(
    "Empty traceability detected",
    !r35.valid && errorIds(r35).includes("empty-traceability-screen-login"),
    errorIds(r35).join(", "),
  );

  const t36 = baseDoc();
  t36.page_patterns[1].traceability.blueprint_page_ids = [];
  const r36 = validateDesignSystemDocument(t36, ctx);
  check(
    "Untraceable page pattern detected",
    !r36.valid && errorIds(r36).includes("untraceable-page-pattern-auth"),
    errorIds(r36).join(", "),
  );

  const t37 = baseDoc();
  t37._metadata.requirements_document_id = "";
  const r37 = validateDesignSystemDocument(t37, ctx);
  check(
    "Empty metadata source ID detected",
    !r37.valid && errorIds(r37).includes("empty-metadata-requirements"),
    errorIds(r37).join(", "),
  );

  const t38 = baseDoc();
  (t38._metadata as { source_of_truth: string }).source_of_truth = "other";
  const r38 = validateDesignSystemDocument(t38, ctx);
  check(
    "Invalid metadata source_of_truth detected",
    !r38.valid && errorIds(r38).includes("invalid-metadata-source"),
    errorIds(r38).join(", "),
  );

  const t39 = baseDoc();
  t39.component_system.components[0].usage_rules = [];
  const r39 = validateDesignSystemDocument(t39, ctx);
  check(
    "Component without usage rules detected",
    !r39.valid && errorIds(r39).includes("component-no-usage-comp-button"),
    errorIds(r39).join(", "),
  );

  const t40 = baseDoc();
  t40.component_system.components[0].variants.push(
    clone(t40.component_system.components[0].variants[0]),
  );
  const r40 = validateDesignSystemDocument(t40, ctx);
  check(
    "Duplicate component variant detected",
    !r40.valid && errorIds(r40).includes("component-dup-variant-comp-button-primary"),
    errorIds(r40).join(", "),
  );

  const t41 = baseDoc();
  t41.navigation_system.secondary_navigation[0].route = "/ghost-nav";
  const r41 = validateDesignSystemDocument(t41, ctx);
  check(
    "Navigation route not in blueprint detected",
    !r41.valid && errorIds(r41).includes("nav-invented-route-nav-settings"),
    errorIds(r41).join(", "),
  );

  const t42 = baseDoc();
  t42.navigation_system.primary_navigation[0].blueprint_page_id = "BP-PAGE-GHOST";
  const r42 = validateDesignSystemDocument(t42, ctx);
  check(
    "Navigation referencing unknown blueprint page detected",
    !r42.valid && errorIds(r42).includes("nav-unknown-page-nav-dash"),
    errorIds(r42).join(", "),
  );

  const t43 = baseDoc();
  t43.form_patterns[0].traceability.blueprint_api_ids = ["BP-API-GHOST"];
  const r43 = validateDesignSystemDocument(t43, ctx);
  check(
    "Form pattern with unknown blueprint API detected",
    !r43.valid && errorIds(r43).includes("unknown-blueprint-API-form-login-BP-API-GHOST"),
    errorIds(r43).join(", "),
  );

  const t44 = baseDoc();
  t44.table_patterns[0].traceability.erd_entity_ids = ["Ghost"];
  const r44 = validateDesignSystemDocument(t44, ctx);
  check(
    "Table pattern with unknown ERD entity detected",
    !r44.valid && errorIds(r44).includes("unknown-ERD-entity-table-items-Ghost"),
    errorIds(r44).join(", "),
  );

  const t45 = baseDoc();
  t45.component_system.components[0].traceability.requirement_ids = ["REQ-GHOST"];
  const r45 = validateDesignSystemDocument(t45, ctx);
  check(
    "Component with unknown requirement reference detected",
    !r45.valid && errorIds(r45).includes("unknown-requirement-comp-button-REQ-GHOST"),
    errorIds(r45).join(", "),
  );

  const t46 = baseDoc();
  t46.assumptions = ["The client must never hardcode an api key = 'abc123'."];
  const r46 = validateDesignSystemDocument(t46, ctx);
  check(
    "Forbidden secret pattern detected",
    !r46.valid && errorIds(r46).includes("forbidden-secret-pattern"),
    errorIds(r46).join(", "),
  );

  const t47 = baseDoc();
  t47.feedback_states.states = t47.feedback_states.states.filter(
    (s) => s.id !== "offline_or_network_error",
  );
  const r47 = validateDesignSystemDocument(t47, ctx);
  check(
    "Missing feedback state is warning only",
    r47.valid === true &&
      r47.issues.some(
        (i) =>
          i.id === "missing-feedback-offline_or_network_error" && i.severity === "warning",
      ),
    r47.issues.map((i) => `${i.id}:${i.severity}`).join(", "),
  );

  // --- Approval lifecycle tests ---
  const baseInput = {
    isOwner: true,
    status: "review",
    reviewData: baseReview(),
    decisions: allDecisions(),
    validationValid: true,
    upstreamsComplete: true,
    sourceIdsMatch: true,
  };

  const a1 = evaluateDesignSystemApproval(baseInput);
  check(
    "Owner review with full decision coverage is approved",
    a1.approved === true,
    a1.reasons.join(", "),
  );

  const a2 = evaluateDesignSystemApproval({ ...baseInput, isOwner: false });
  check(
    "Non-owner approval is rejected",
    a2.approved === false && a2.reasons.some((r) => r.includes("owner")),
    a2.reasons.join(", "),
  );

  const a3 = evaluateDesignSystemApproval({ ...baseInput, status: "draft" });
  check(
    "Draft document approval is rejected",
    a3.approved === false && a3.reasons.some((r) => r.includes("review state")),
    a3.reasons.join(", "),
  );

  const a4 = evaluateDesignSystemApproval({ ...baseInput, status: "approved" });
  check(
    "Already approved document is rejected",
    a4.approved === false && a4.reasons.some((r) => r.includes("already approved")),
    a4.reasons.join(", "),
  );

  const a5 = evaluateDesignSystemApproval({ ...baseInput, reviewData: null });
  check(
    "Approval without AI review is rejected",
    a5.approved === false && a5.reasons.some((r) => r.includes("Run the AI review")),
    a5.reasons.join(", "),
  );

  const a6 = evaluateDesignSystemApproval({
    ...baseInput,
    decisions: [allDecisions()[0]],
  });
  check(
    "Incomplete decision coverage is rejected",
    a6.approved === false && a6.reasons.some((r) => r.includes("unresolved")),
    a6.reasons.join(", "),
  );

  const a7 = evaluateDesignSystemApproval({ ...baseInput, validationValid: false });
  check(
    "Invalid document approval is rejected",
    a7.approved === false && a7.reasons.some((r) => r.includes("validation")),
    a7.reasons.join(", "),
  );

  const a8 = evaluateDesignSystemApproval({ ...baseInput, upstreamsComplete: false });
  check(
    "Missing approved upstreams is rejected",
    a8.approved === false && a8.reasons.some((r) => r.includes("upstream")),
    a8.reasons.join(", "),
  );

  const a9 = evaluateDesignSystemApproval({ ...baseInput, sourceIdsMatch: false });
  check(
    "Mismatched source document IDs is rejected",
    a9.approved === false && a9.reasons.some((r) => r.includes("Source document IDs")),
    a9.reasons.join(", "),
  );

  check("Draft status can be mutated", canMutateDesignSystem("draft") === true);
  check("Review status can be mutated", canMutateDesignSystem("review") === true);
  check("Approved document cannot be mutated", canMutateDesignSystem("approved") === false);
  check(
    "Unknown status cannot be mutated",
    canMutateDesignSystem("archived") === false,
  );

  if (failures > 0) {
    console.error(`\nFAILED ${failures} tests.`);
    process.exit(1);
  } else {
    console.log("\nALL TESTS PASSED");
  }
}

runTests();
