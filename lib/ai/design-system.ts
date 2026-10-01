import { z } from "zod";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
} from "./types";

/* ============================================
   DESIGN SYSTEM ZOD SCHEMAS & TYPES
   ============================================ */

export const designPrincipleSchema = z.object({
  id: z.string().min(1),
  principle: z.string().min(1),
  description: z.string().min(1),
});

export const designTokenColorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.string().min(1),
  usage: z.string().min(1),
  contrast_notes: z.string().min(1),
});

export const designTokensSchema = z.object({
  colors: z.array(designTokenColorSchema).min(1),
});

export const typeScaleLevelSchema = z.enum([
  "display",
  "h1",
  "h2",
  "h3",
  "body",
  "body_small",
  "caption",
  "label",
]);

export const typeScaleEntrySchema = z.object({
  level: typeScaleLevelSchema,
  font_size: z.string().min(1),
  line_height: z.string().min(1),
  usage: z.string().min(1),
});

export const namedTokenSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  usage: z.string().min(1),
});

export const typographySchema = z.object({
  font_family: z.object({
    primary: z.string().min(1),
    fallback: z.string().min(1),
    usage: z.string().min(1),
  }),
  heading_scale: z.array(typeScaleEntrySchema).min(1),
  body_scale: z.array(typeScaleEntrySchema).min(1),
  caption_scale: z.array(typeScaleEntrySchema).min(1),
  font_weights: z.array(namedTokenSchema).min(1),
  line_heights: z.array(namedTokenSchema).min(1),
  letter_spacing: z.array(namedTokenSchema),
});

export const colorRoleSchema = z.enum([
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "surface_muted",
  "text_primary",
  "text_secondary",
  "text_muted",
  "border",
  "success",
  "warning",
  "danger",
  "info",
]);

export const colorRoleEntrySchema = z.object({
  id: colorRoleSchema,
  token_id: z.string().min(1),
  value: z.string().min(1),
  usage: z.string().min(1),
  contrast_notes: z.string().min(1),
});

export const colorSystemSchema = z.object({
  colors: z.array(colorRoleEntrySchema).min(1),
});

export const spacingScaleIdSchema = z.enum(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"]);

export const spacingTokenSchema = z.object({
  id: spacingScaleIdSchema,
  value: z.string().min(1),
  usage: z.string().min(1),
});

export const spacingSystemSchema = z.object({
  scale: z.array(spacingTokenSchema).min(1),
});

export const radiusScaleIdSchema = z.enum(["none", "sm", "md", "lg", "xl", "full"]);

export const radiusTokenSchema = z.object({
  id: radiusScaleIdSchema,
  value: z.string().min(1),
  usage: z.string().min(1),
});

export const radiusSystemSchema = z.object({
  scale: z.array(radiusTokenSchema).min(1),
});

export const elevationLevelIdSchema = z.enum([
  "none",
  "low",
  "medium",
  "high",
  "overlay",
]);

export const elevationTokenSchema = z.object({
  id: elevationLevelIdSchema,
  value: z.string().min(1),
  usage: z.string().min(1),
});

export const elevationSystemSchema = z.object({
  levels: z.array(elevationTokenSchema).min(1),
});

export const componentTraceabilitySchema = z.object({
  requirement_ids: z.array(z.string()),
  architecture_module_ids: z.array(z.string()),
  blueprint_page_ids: z.array(z.string()),
});

export const componentVariantSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export const componentStateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export const componentAnatomyPartSchema = z.object({
  part: z.string().min(1),
  description: z.string().min(1),
});

export const designComponentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string().min(1),
  interactive: z.boolean(),
  variants: z.array(componentVariantSchema),
  states: z.array(componentStateSchema),
  anatomy: z.array(componentAnatomyPartSchema),
  behavior: z.array(z.string()),
  accessibility_requirements: z.array(z.string()),
  usage_rules: z.array(z.string()).min(1),
  forbidden_usage: z.array(z.string()),
  traceability: componentTraceabilitySchema,
});

export const componentSystemSchema = z.object({
  components: z.array(designComponentSchema).min(1),
});

export const layoutRuleSchema = z.object({
  id: z.string().min(1),
  rule: z.string().min(1),
  applies_when: z.string().min(1),
});

export const layoutRulesSchema = z.object({
  container_strategy: z.string().min(1),
  content_width: z.string().min(1),
  grid_rules: z.array(layoutRuleSchema),
  column_rules: z.array(layoutRuleSchema),
  page_padding: z.string().min(1),
  section_spacing: z.string().min(1),
  sidebar_behavior: z.string().min(1),
  header_behavior: z.string().min(1),
});

export const breakpointIdSchema = z.enum(["mobile", "tablet", "desktop", "wide"]);

export const breakpointSchema = z.object({
  id: breakpointIdSchema,
  width_range: z.string().min(1),
  behaviors: z.array(z.string()).min(1),
});

export const responsiveRulesSchema = z.object({
  breakpoints: z.array(breakpointSchema).min(1),
});

export const navItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  route: z.string().min(1),
  blueprint_page_id: z.string().optional(),
  visibility: z.string().min(1),
});

export const navigationSystemSchema = z.object({
  primary_navigation: z.array(navItemSchema).min(1),
  secondary_navigation: z.array(navItemSchema),
  breadcrumb_rules: z.array(z.string()),
  mobile_navigation: z.string().min(1),
  active_state: z.string().min(1),
  permission_visibility: z.string().min(1),
});

export const pagePatternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string().min(1),
  layout: z.string().min(1),
  required_sections: z.array(z.string()).min(1),
  optional_sections: z.array(z.string()),
  responsive_behavior: z.string().min(1),
  accessibility: z.string().min(1),
  traceability: z.object({
    blueprint_page_ids: z.array(z.string()).min(1),
  }),
});

export const formPatternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  field_layout: z.string().min(1),
  label_rules: z.array(z.string()).min(1),
  help_text: z.string().min(1),
  validation_display: z.string().min(1),
  error_display: z.string().min(1),
  required_field_indicator: z.string().min(1),
  submission_behavior: z.string().min(1),
  loading_behavior: z.string().min(1),
  success_behavior: z.string().min(1),
  traceability: z.object({
    blueprint_api_ids: z.array(z.string()),
  }),
});

export const capabilityPlanSchema = z.object({
  supported: z.boolean(),
  rules: z.array(z.string()),
});

export const tablePatternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  column_rules: z.array(z.string()).min(1),
  sorting: capabilityPlanSchema,
  filtering: capabilityPlanSchema,
  pagination: capabilityPlanSchema,
  empty_state: z.string().min(1),
  loading_state: z.string().min(1),
  error_state: z.string().min(1),
  responsive_behavior: z.string().min(1),
  row_actions: z.array(z.string()),
  bulk_actions: z.array(z.string()),
  traceability: z.object({
    erd_entity_ids: z.array(z.string()),
  }),
});

export const feedbackStateIdSchema = z.enum([
  "loading",
  "empty",
  "error",
  "success",
  "warning",
  "permission_denied",
  "not_found",
  "offline_or_network_error",
]);

export const feedbackStateSchema = z.object({
  id: feedbackStateIdSchema,
  visual_treatment: z.string().min(1),
  message_rules: z.string().min(1),
  user_action: z.string().min(1),
  accessibility: z.string().min(1),
});

export const feedbackStateSystemSchema = z.object({
  states: z.array(feedbackStateSchema).min(1),
});

export const accessibilityRuleIdSchema = z.enum([
  "keyboard_navigation",
  "focus_visibility",
  "focus_order",
  "color_contrast",
  "semantic_html",
  "form_labels",
  "error_association",
  "screen_reader_support",
  "touch_target_size",
  "motion_preferences",
  "reduced_motion",
  "non_color_information",
]);

export const accessibilityRuleSchema = z.object({
  id: accessibilityRuleIdSchema,
  rule: z.string().min(1),
  category: z.string().min(1),
  applies_to: z.array(z.string()),
});

export const accessibilitySystemSchema = z.array(accessibilityRuleSchema).min(1);

export const interactionRulesSchema = z.object({
  hover_behavior: z.string().min(1),
  focus_behavior: z.string().min(1),
  click_feedback: z.string().min(1),
  loading_feedback: z.string().min(1),
  transition_rules: z.string().min(1),
  modal_behavior: z.string().min(1),
  confirmation_rules: z.string().min(1),
  destructive_action_rules: z.string().min(1),
  keyboard_behavior: z.string().min(1),
});

export const screenSpecificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  route: z.string().min(1),
  purpose: z.string().min(1),
  user_roles: z.array(z.string()),
  layout_pattern: z.string().min(1),
  components: z.array(z.string()).min(1),
  data_requirements: z.array(z.string()),
  actions: z.array(z.string()),
  states: z.array(z.string()).min(1),
  responsive_behavior: z.string().min(1),
  accessibility: z.array(z.string()).min(1),
});

export const screenTraceabilitySchema = z.object({
  screen_id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  architecture_module_ids: z.array(z.string()),
  erd_entity_ids: z.array(z.string()),
  dfd_process_ids: z.array(z.string()),
  flowchart_process_ids: z.array(z.string()),
  blueprint_module_ids: z.array(z.string()),
  blueprint_page_ids: z.array(z.string()),
  blueprint_api_ids: z.array(z.string()),
});

export const designTraceabilitySchema = z.object({
  screens: z.array(screenTraceabilitySchema).min(1),
});

export const designSystemMetadataSchema = z.object({
  source_of_truth: z.literal("design-system"),
  requirements_document_id: z.string(),
  architecture_document_id: z.string(),
  erd_document_id: z.string(),
  dfd_document_id: z.string(),
  flowchart_document_id: z.string(),
  blueprint_document_id: z.string(),
  generated_at: z.string().optional(),
});

export const designSystemDocumentSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  design_principles: z.array(designPrincipleSchema).min(1),
  design_tokens: designTokensSchema,
  typography: typographySchema,
  color_system: colorSystemSchema,
  spacing_system: spacingSystemSchema,
  radius_system: radiusSystemSchema,
  elevation_system: elevationSystemSchema,
  component_system: componentSystemSchema,
  layout_rules: layoutRulesSchema,
  responsive_rules: responsiveRulesSchema,
  navigation_system: navigationSystemSchema,
  page_patterns: z.array(pagePatternSchema).min(1),
  form_patterns: z.array(formPatternSchema),
  table_patterns: z.array(tablePatternSchema),
  feedback_states: feedbackStateSystemSchema,
  accessibility_rules: accessibilitySystemSchema,
  interaction_rules: interactionRulesSchema,
  screen_specifications: z.array(screenSpecificationSchema).min(1),
  assumptions: z.array(z.string()),
  traceability: designTraceabilitySchema,
  _metadata: designSystemMetadataSchema,
});

export type DesignPrinciple = z.infer<typeof designPrincipleSchema>;
export type DesignTokenColor = z.infer<typeof designTokenColorSchema>;
export type DesignTokens = z.infer<typeof designTokensSchema>;
export type TypeScaleLevel = z.infer<typeof typeScaleLevelSchema>;
export type TypeScaleEntry = z.infer<typeof typeScaleEntrySchema>;
export type NamedToken = z.infer<typeof namedTokenSchema>;
export type TypographySystem = z.infer<typeof typographySchema>;
export type ColorRole = z.infer<typeof colorRoleSchema>;
export type ColorRoleEntry = z.infer<typeof colorRoleEntrySchema>;
export type ColorSystem = z.infer<typeof colorSystemSchema>;
export type SpacingScaleId = z.infer<typeof spacingScaleIdSchema>;
export type SpacingToken = z.infer<typeof spacingTokenSchema>;
export type SpacingSystem = z.infer<typeof spacingSystemSchema>;
export type RadiusScaleId = z.infer<typeof radiusScaleIdSchema>;
export type RadiusToken = z.infer<typeof radiusTokenSchema>;
export type RadiusSystem = z.infer<typeof radiusSystemSchema>;
export type ElevationLevelId = z.infer<typeof elevationLevelIdSchema>;
export type ElevationToken = z.infer<typeof elevationTokenSchema>;
export type ElevationSystem = z.infer<typeof elevationSystemSchema>;
export type ComponentTraceability = z.infer<typeof componentTraceabilitySchema>;
export type ComponentVariant = z.infer<typeof componentVariantSchema>;
export type ComponentState = z.infer<typeof componentStateSchema>;
export type ComponentAnatomyPart = z.infer<typeof componentAnatomyPartSchema>;
export type DesignComponent = z.infer<typeof designComponentSchema>;
export type ComponentSystem = z.infer<typeof componentSystemSchema>;
export type LayoutRule = z.infer<typeof layoutRuleSchema>;
export type LayoutRules = z.infer<typeof layoutRulesSchema>;
export type BreakpointId = z.infer<typeof breakpointIdSchema>;
export type Breakpoint = z.infer<typeof breakpointSchema>;
export type ResponsiveRules = z.infer<typeof responsiveRulesSchema>;
export type NavItem = z.infer<typeof navItemSchema>;
export type NavigationSystem = z.infer<typeof navigationSystemSchema>;
export type PagePattern = z.infer<typeof pagePatternSchema>;
export type FormPattern = z.infer<typeof formPatternSchema>;
export type CapabilityPlan = z.infer<typeof capabilityPlanSchema>;
export type TablePattern = z.infer<typeof tablePatternSchema>;
export type FeedbackStateId = z.infer<typeof feedbackStateIdSchema>;
export type FeedbackState = z.infer<typeof feedbackStateSchema>;
export type FeedbackStateSystem = z.infer<typeof feedbackStateSystemSchema>;
export type AccessibilityRuleId = z.infer<typeof accessibilityRuleIdSchema>;
export type AccessibilityRule = z.infer<typeof accessibilityRuleSchema>;
export type InteractionRules = z.infer<typeof interactionRulesSchema>;
export type ScreenSpecification = z.infer<typeof screenSpecificationSchema>;
export type ScreenTraceability = z.infer<typeof screenTraceabilitySchema>;
export type DesignTraceability = z.infer<typeof designTraceabilitySchema>;
export type DesignSystemMetadata = z.infer<typeof designSystemMetadataSchema>;
export type DesignSystemDocument = z.infer<typeof designSystemDocumentSchema>;

/* ============================================
   DESIGN SYSTEM REVIEW SCHEMAS & TYPES
   ============================================ */

export const designSystemReviewSeveritySchema = z.enum(["important", "minor"]);

export const designSystemReviewCategorySchema = z.enum([
  "requirements_alignment",
  "architecture_alignment",
  "blueprint_alignment",
  "accessibility",
  "responsive",
  "component_system",
  "layout",
  "navigation",
  "interaction",
  "traceability",
  "consistency",
  "feasibility",
  "complexity",
]);

export const designSystemReviewIssueSchema = z.object({
  id: z.string().min(1),
  severity: designSystemReviewSeveritySchema,
  category: designSystemReviewCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().min(1),
  source_references: z.array(z.string()),
  suggested_resolution: z.string().min(1),
  requires_user_decision: z.boolean(),
});

export const designSystemReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(designSystemReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export const designSystemReviewDecisionActionSchema = z.enum([
  "accept",
  "ignore",
  "custom",
]);

export const designSystemReviewDecisionSchema = z
  .object({
    issue_id: z.string().min(1),
    decision: designSystemReviewDecisionActionSchema,
    rationale: z.string().optional(),
    resolved_at: z.string().min(1),
  })
  .superRefine((val, ctx) => {
    if (val.decision === "custom" && !val.rationale?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "A custom decision requires a non-empty rationale.",
        path: ["rationale"],
      });
    }
  });

export type DesignSystemReviewSeverity = z.infer<
  typeof designSystemReviewSeveritySchema
>;
export type DesignSystemReviewCategory = z.infer<
  typeof designSystemReviewCategorySchema
>;
export type DesignSystemReviewIssue = z.infer<typeof designSystemReviewIssueSchema>;
export type DesignSystemReview = z.infer<typeof designSystemReviewSchema>;
export type DesignSystemReviewDecisionAction = z.infer<
  typeof designSystemReviewDecisionActionSchema
>;
export type DesignSystemReviewDecision = z.infer<
  typeof designSystemReviewDecisionSchema
>;

/* ============================================
   UPSTREAM CONTEXT & DETERMINISTIC VALIDATOR
   ============================================ */

export type DesignSystemUpstreamContext = {
  requirements: RequirementsDraft;
  architecture: ArchitectureDocument;
  erd: ERDDocument;
  dfd: DFDDocument;
  flowchart: FlowchartDocument;
  blueprint: ImplementationBlueprint;
};

export type DesignSystemValidationCategory =
  | "identity"
  | "references"
  | "screens"
  | "components"
  | "accessibility"
  | "responsive"
  | "consistency"
  | "traceability"
  | "navigation"
  | "metadata";

export type DesignSystemValidationIssue = {
  id: string;
  severity: "error" | "warning";
  category: DesignSystemValidationCategory;
  title: string;
  description: string;
  item_id?: string;
};

export type DesignSystemValidationResult = {
  valid: boolean;
  issues: DesignSystemValidationIssue[];
};

const REQUIRED_ACCESSIBILITY_RULES: AccessibilityRuleId[] = [
  "keyboard_navigation",
  "focus_visibility",
  "focus_order",
  "color_contrast",
  "semantic_html",
  "form_labels",
  "error_association",
  "screen_reader_support",
  "touch_target_size",
  "motion_preferences",
  "reduced_motion",
  "non_color_information",
];

const REQUIRED_FEEDBACK_IDS: FeedbackStateId[] = [
  "loading",
  "empty",
  "error",
  "success",
  "warning",
  "permission_denied",
  "not_found",
  "offline_or_network_error",
];

const REQUIRED_BREAKPOINTS: BreakpointId[] = ["mobile", "tablet", "desktop"];

const FONT_SIZE_PATTERN = /^\d+(\.\d+)?(px|rem|em)$/;
const LINE_HEIGHT_PATTERN = /^(\d+(\.\d+)?|(normal)|(px|rem|em))$/;

const FORM_COMPONENT_PATTERN = /\b(input|textarea|select|checkbox|radio|field|form)\b/i;

function parsePx(value: string): number | null {
  const match = value.match(/^(\d+(\.\d+)?)(px|rem|em)$/);
  if (!match) return null;
  return parseFloat(match[1]);
}

function checkDuplicates(
  items: { id: string }[],
  kind: string,
  issues: DesignSystemValidationIssue[],
  title: string,
) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      issues.push({
        id: `dup-${kind}-${item.id}`,
        severity: "error",
        category: "identity",
        title,
        description: `Duplicate ${kind} id '${item.id}' detected.`,
        item_id: item.id,
      });
    }
    seen.add(item.id);
  }
}

/**
 * Deterministic validator for Design System documents.
 * Structural checks always run; upstream reference checks run when context is given.
 */
export function validateDesignSystemDocument(
  doc: DesignSystemDocument,
  context?: DesignSystemUpstreamContext,
): DesignSystemValidationResult {
  const issues: DesignSystemValidationIssue[] = [];

  // --- 1. METADATA ---
  if (doc._metadata.source_of_truth !== "design-system") {
    issues.push({
      id: "invalid-metadata-source",
      severity: "error",
      category: "metadata",
      title: "Invalid Metadata Source Of Truth",
      description:
        "Metadata source_of_truth must be exactly 'design-system'.",
    });
  }
  const metadataIds: [string, string][] = [
    ["requirements", doc._metadata.requirements_document_id],
    ["architecture", doc._metadata.architecture_document_id],
    ["erd", doc._metadata.erd_document_id],
    ["dfd", doc._metadata.dfd_document_id],
    ["flowchart", doc._metadata.flowchart_document_id],
    ["blueprint", doc._metadata.blueprint_document_id],
  ];
  for (const [name, id] of metadataIds) {
    if (!id || !id.trim()) {
      issues.push({
        id: `empty-metadata-${name}`,
        severity: "error",
        category: "metadata",
        title: "Empty Metadata Source ID",
        description: `Metadata ${name} document id must not be empty.`,
      });
    }
  }

  // --- 2. IDENTITY / DUPLICATES ---
  checkDuplicates(
    doc.component_system.components,
    "component",
    issues,
    "Duplicate Component ID",
  );
  checkDuplicates(doc.page_patterns, "page-pattern", issues, "Duplicate Page Pattern ID");
  checkDuplicates(doc.form_patterns, "form-pattern", issues, "Duplicate Form Pattern ID");
  checkDuplicates(doc.table_patterns, "table-pattern", issues, "Duplicate Table Pattern ID");
  checkDuplicates(doc.screen_specifications, "screen", issues, "Duplicate Screen ID");
  checkDuplicates(doc.design_tokens.colors, "token", issues, "Duplicate Token ID");
  checkDuplicates(
    doc.color_system.colors as { id: string }[],
    "semantic-color",
    issues,
    "Duplicate Semantic Color",
  );
  checkDuplicates(
    doc.spacing_system.scale as { id: string }[],
    "spacing",
    issues,
    "Duplicate Spacing Token",
  );
  checkDuplicates(
    doc.navigation_system.primary_navigation,
    "nav",
    issues,
    "Duplicate Navigation ID",
  );
  checkDuplicates(
    doc.navigation_system.secondary_navigation,
    "nav",
    issues,
    "Duplicate Navigation ID",
  );
  checkDuplicates(
    doc.responsive_rules.breakpoints as { id: string }[],
    "breakpoint",
    issues,
    "Duplicate Breakpoint",
  );
  checkDuplicates(
    doc.feedback_states.states as { id: string }[],
    "feedback",
    issues,
    "Duplicate Feedback State",
  );
  checkDuplicates(
    doc.accessibility_rules as { id: string }[],
    "accessibility",
    issues,
    "Duplicate Accessibility Rule",
  );

  // --- 3. SCREENS ---
  const componentIds = new Set(doc.component_system.components.map((c) => c.id));
  const pagePatternIds = new Set(doc.page_patterns.map((p) => p.id));
  const screenRoutes = new Map<string, string>();
  const screenIds = new Set<string>();

  for (const screen of doc.screen_specifications) {
    if (screenIds.has(screen.id)) {
      issues.push({
        id: `dup-screen-route-id-${screen.id}`,
        severity: "error",
        category: "screens",
        title: "Duplicate Screen ID",
        description: `Screen id '${screen.id}' is duplicated.`,
        item_id: screen.id,
      });
    }
    screenIds.add(screen.id);

    if (!screen.purpose.trim()) {
      issues.push({
        id: `screen-no-purpose-${screen.id}`,
        severity: "error",
        category: "screens",
        title: "Screen Without Purpose",
        description: `Screen '${screen.id}' has no purpose.`,
        item_id: screen.id,
      });
    }
    if (!screen.layout_pattern.trim() || !pagePatternIds.has(screen.layout_pattern)) {
      issues.push({
        id: `screen-no-layout-${screen.id}`,
        severity: "error",
        category: "screens",
        title: "Screen Without Valid Layout",
        description: `Screen '${screen.id}' does not reference a known page pattern (got '${screen.layout_pattern}').`,
        item_id: screen.id,
      });
    }

    if (!screen.route.startsWith("/") || screen.route.includes(" ")) {
      issues.push({
        id: `screen-invalid-route-${screen.id}`,
        severity: "error",
        category: "screens",
        title: "Invalid Screen Route",
        description: `Screen '${screen.id}' route '${screen.route}' is not a valid path (must start with '/').`,
        item_id: screen.id,
      });
    } else if (screenRoutes.has(screen.route)) {
      issues.push({
        id: `dup-screen-route-${screen.route}`,
        severity: "error",
        category: "screens",
        title: "Duplicate Screen Route",
        description: `Route '${screen.route}' is used by both '${screenRoutes.get(screen.route)}' and '${screen.id}'.`,
        item_id: screen.id,
      });
    } else {
      screenRoutes.set(screen.route, screen.id);
    }

    for (const compId of screen.components) {
      if (!componentIds.has(compId)) {
        issues.push({
          id: `screen-unknown-component-${screen.id}-${compId}`,
          severity: "error",
          category: "screens",
          title: "Screen References Unknown Component",
          description: `Screen '${screen.id}' references unknown component '${compId}'.`,
          item_id: screen.id,
        });
      }
    }
  }

  // --- 4. COMPONENTS ---
  for (const comp of doc.component_system.components) {
    if (!comp.purpose.trim()) {
      issues.push({
        id: `component-no-purpose-${comp.id}`,
        severity: "error",
        category: "components",
        title: "Component Without Purpose",
        description: `Component '${comp.id}' has no purpose.`,
        item_id: comp.id,
      });
    }
    if (comp.usage_rules.length === 0) {
      issues.push({
        id: `component-no-usage-${comp.id}`,
        severity: "error",
        category: "components",
        title: "Component Without Usage Rules",
        description: `Component '${comp.id}' has no usage rules.`,
        item_id: comp.id,
      });
    }
    const variantNames = new Set<string>();
    for (const v of comp.variants) {
      if (variantNames.has(v.name)) {
        issues.push({
          id: `component-dup-variant-${comp.id}-${v.name}`,
          severity: "error",
          category: "components",
          title: "Duplicate Component Variant",
          description: `Component '${comp.id}' has duplicate variant '${v.name}'.`,
          item_id: comp.id,
        });
      }
      variantNames.add(v.name);
    }
    const stateNames = new Set<string>();
    for (const s of comp.states) {
      if (stateNames.has(s.name)) {
        issues.push({
          id: `component-dup-state-${comp.id}-${s.name}`,
          severity: "error",
          category: "components",
          title: "Duplicate Component State",
          description: `Component '${comp.id}' has duplicate state '${s.name}'.`,
          item_id: comp.id,
        });
      }
      stateNames.add(s.name);
    }

    if (comp.interactive) {
      const mentionsKeyboard = comp.accessibility_requirements.some((a) =>
        /keyboard|tab|enter|escape|space/i.test(a),
      );
      if (!mentionsKeyboard) {
        issues.push({
          id: `interactive-no-keyboard-${comp.id}`,
          severity: "error",
          category: "accessibility",
          title: "Interactive Component Without Keyboard Behavior",
          description: `Interactive component '${comp.id}' does not define keyboard behavior.`,
          item_id: comp.id,
        });
      }
    }

    if (FORM_COMPONENT_PATTERN.test(comp.name) || FORM_COMPONENT_PATTERN.test(comp.id)) {
      const mentionsLabels = comp.accessibility_requirements.some((a) =>
        /label/i.test(a),
      );
      if (!mentionsLabels) {
        issues.push({
          id: `form-component-no-labels-${comp.id}`,
          severity: "error",
          category: "accessibility",
          title: "Form Component Without Label Rules",
          description: `Form component '${comp.id}' does not define label requirements.`,
          item_id: comp.id,
        });
      }
    }
  }

  // --- 5. ACCESSIBILITY ---
  const accessibilityIds = new Set(doc.accessibility_rules.map((r) => r.id));
  for (const requiredId of REQUIRED_ACCESSIBILITY_RULES) {
    if (!accessibilityIds.has(requiredId)) {
      issues.push({
        id: `missing-accessibility-${requiredId}`,
        severity: "error",
        category: "accessibility",
        title: "Missing Accessibility Rule",
        description: `Required accessibility rule '${requiredId}' is missing.`,
      });
    }
  }
  for (const rule of doc.accessibility_rules) {
    if (!rule.rule.trim()) {
      issues.push({
        id: `empty-accessibility-${rule.id}`,
        severity: "error",
        category: "accessibility",
        title: "Empty Accessibility Rule",
        description: `Accessibility rule '${rule.id}' has no actionable guidance.`,
        item_id: rule.id,
      });
    }
  }
  const hasContrastGuidance = doc.accessibility_rules.some(
    (r) => r.id === "color_contrast" && /contrast/i.test(r.rule),
  );
  if (!hasContrastGuidance) {
    issues.push({
      id: "missing-contrast-guidance",
      severity: "error",
      category: "accessibility",
      title: "Missing Contrast Guidance",
      description:
        "Color contrast guidance must be defined in the color_contrast accessibility rule.",
    });
  }

  // Interaction rules must define focus behavior
  if (!doc.interaction_rules.focus_behavior.trim()) {
    issues.push({
      id: "missing-focus-behavior",
      severity: "error",
      category: "accessibility",
      title: "Missing Focus Behavior",
      description: "Interaction rules must define focus behavior.",
    });
  }

  // --- 6. RESPONSIVE ---
  const breakpointIds = new Set(doc.responsive_rules.breakpoints.map((b) => b.id));
  for (const requiredId of REQUIRED_BREAKPOINTS) {
    if (!breakpointIds.has(requiredId)) {
      issues.push({
        id: `missing-breakpoint-${requiredId}`,
        severity: "error",
        category: "responsive",
        title: "Missing Responsive Rule",
        description: `Required '${requiredId}' responsive behavior is missing.`,
      });
    }
  }
  for (const bp of doc.responsive_rules.breakpoints) {
    if (bp.behaviors.length === 0) {
      issues.push({
        id: `empty-breakpoint-${bp.id}`,
        severity: "error",
        category: "responsive",
        title: "Breakpoint Without Behavior",
        description: `Breakpoint '${bp.id}' does not describe behavioral changes.`,
        item_id: bp.id,
      });
    }
  }

  // --- 7. DESIGN CONSISTENCY ---
  const tokenIds = new Set<string>();
  for (const token of doc.design_tokens.colors) {
    if (tokenIds.has(token.id)) {
      issues.push({
        id: `dup-token-${token.id}`,
        severity: "error",
        category: "consistency",
        title: "Duplicate Token ID",
        description: `Design token '${token.id}' is duplicated.`,
        item_id: token.id,
      });
    }
    tokenIds.add(token.id);
    if (!token.usage.trim()) {
      issues.push({
        id: `raw-color-no-purpose-${token.id}`,
        severity: "error",
        category: "consistency",
        title: "Raw Color Without Semantic Purpose",
        description: `Color token '${token.id}' has no semantic usage defined.`,
        item_id: token.id,
      });
    }
  }
  const semanticUsages = new Map<string, string>();
  for (const color of doc.color_system.colors) {
    if (semanticUsages.has(color.id)) {
      issues.push({
        id: `dup-semantic-color-${color.id}`,
        severity: "error",
        category: "consistency",
        title: "Duplicate Semantic Color",
        description: `Semantic color '${color.id}' is defined more than once.`,
        item_id: color.id,
      });
    }
    semanticUsages.set(color.id, color.usage);
    if (!tokenIds.has(color.token_id)) {
      issues.push({
        id: `color-unknown-token-${color.id}`,
        severity: "error",
        category: "references",
        title: "Semantic Color References Unknown Token",
        description: `Semantic color '${color.id}' references unknown token '${color.token_id}'.`,
        item_id: color.id,
      });
    }
    if (!color.contrast_notes.trim()) {
      issues.push({
        id: `color-no-contrast-${color.id}`,
        severity: "error",
        category: "accessibility",
        title: "Color Role Without Contrast Guidance",
        description: `Semantic color '${color.id}' has no contrast notes.`,
        item_id: color.id,
      });
    }
  }

  // Typography scale conflicts: same level everywhere, valid sizes
  const levelOwner = new Map<string, string>();
  const allScales: [string, TypeScaleEntry[]][] = [
    ["heading_scale", doc.typography.heading_scale],
    ["body_scale", doc.typography.body_scale],
    ["caption_scale", doc.typography.caption_scale],
  ];
  for (const [scaleName, entries] of allScales) {
    for (const entry of entries) {
      if (levelOwner.has(entry.level)) {
        issues.push({
          id: `typography-scale-conflict-${entry.level}`,
          severity: "error",
          category: "consistency",
          title: "Typography Scale Conflict",
          description: `Typography level '${entry.level}' appears in both '${levelOwner.get(entry.level)}' and '${scaleName}'.`,
          item_id: entry.level,
        });
      } else {
        levelOwner.set(entry.level, scaleName);
      }
      if (!FONT_SIZE_PATTERN.test(entry.font_size)) {
        issues.push({
          id: `invalid-font-size-${entry.level}`,
          severity: "error",
          category: "consistency",
          title: "Invalid Typography Scale",
          description: `Typography level '${entry.level}' has invalid font size '${entry.font_size}' (expected e.g. '16px' or '1rem').`,
          item_id: entry.level,
        });
      }
      if (!LINE_HEIGHT_PATTERN.test(entry.line_height.replace(/\s/g, ""))) {
        issues.push({
          id: `invalid-line-height-${entry.level}`,
          severity: "error",
          category: "consistency",
          title: "Invalid Typography Scale",
          description: `Typography level '${entry.level}' has invalid line height '${entry.line_height}'.`,
          item_id: entry.level,
        });
      }
      if (!entry.usage.trim()) {
        issues.push({
          id: `typography-no-usage-${entry.level}`,
          severity: "error",
          category: "consistency",
          title: "Typography Level Without Usage",
          description: `Typography level '${entry.level}' does not explain intended usage.`,
          item_id: entry.level,
        });
      }
    }
  }

  // Spacing ordering: strictly increasing px/rem values
  let previousSpacing: number | null = null;
  let previousId = "";
  for (const token of doc.spacing_system.scale) {
    const value = parsePx(token.value);
    if (value === null) {
      issues.push({
        id: `invalid-spacing-value-${token.id}`,
        severity: "error",
        category: "consistency",
        title: "Invalid Spacing Token",
        description: `Spacing token '${token.id}' has invalid value '${token.value}'.`,
        item_id: token.id,
      });
      continue;
    }
    if (previousSpacing !== null && value <= previousSpacing) {
      issues.push({
        id: `spacing-order-${token.id}`,
        severity: "error",
        category: "consistency",
        title: "Invalid Spacing Ordering",
        description: `Spacing token '${token.id}' (${token.value}) must be larger than '${previousId}'.`,
        item_id: token.id,
      });
    }
    previousSpacing = value;
    previousId = token.id;
  }

  // --- 8. NAVIGATION ---
  for (const nav of [
    ...doc.navigation_system.primary_navigation,
    ...doc.navigation_system.secondary_navigation,
  ]) {
    if (nav.blueprint_page_id !== undefined && nav.blueprint_page_id !== "") {
      // validated against blueprint in context block below
    }
    if (!nav.route.startsWith("/") || nav.route.includes(" ")) {
      issues.push({
        id: `invalid-nav-route-${nav.id}`,
        severity: "error",
        category: "navigation",
        title: "Invalid Navigation Route",
        description: `Navigation item '${nav.id}' has invalid route '${nav.route}'.`,
        item_id: nav.id,
      });
    }
  }

  // --- 9. TRACEABILITY ---
  const traceByScreen = new Map(doc.traceability.screens.map((t) => [t.screen_id, t]));
  for (const screen of doc.screen_specifications) {
    const trace = traceByScreen.get(screen.id);
    if (!trace) {
      issues.push({
        id: `orphan-screen-${screen.id}`,
        severity: "error",
        category: "traceability",
        title: "Orphan Screen",
        description: `Screen '${screen.id}' has no traceability mapping.`,
        item_id: screen.id,
      });
      continue;
    }
    const totalRefs =
      trace.requirement_ids.length +
      trace.architecture_module_ids.length +
      trace.erd_entity_ids.length +
      trace.dfd_process_ids.length +
      trace.flowchart_process_ids.length +
      trace.blueprint_module_ids.length +
      trace.blueprint_page_ids.length +
      trace.blueprint_api_ids.length;
    if (totalRefs === 0) {
      issues.push({
        id: `empty-traceability-${screen.id}`,
        severity: "error",
        category: "traceability",
        title: "Missing Upstream References",
        description: `Screen '${screen.id}' traceability has no upstream references.`,
        item_id: screen.id,
      });
    }
  }
  for (const trace of doc.traceability.screens) {
    if (!screenIds.has(trace.screen_id)) {
      issues.push({
        id: `traceability-unknown-screen-${trace.screen_id}`,
        severity: "error",
        category: "traceability",
        title: "Traceability References Unknown Screen",
        description: `Traceability entry references unknown screen '${trace.screen_id}'.`,
        item_id: trace.screen_id,
      });
    }
  }
  for (const pattern of doc.page_patterns) {
    if (pattern.traceability.blueprint_page_ids.length === 0) {
      issues.push({
        id: `untraceable-page-${pattern.id}`,
        severity: "error",
        category: "traceability",
        title: "Untraceable Page Pattern",
        description: `Page pattern '${pattern.id}' does not reference any blueprint page.`,
        item_id: pattern.id,
      });
    }
  }

  // --- 10. FEEDBACK ---
  const feedbackIds = new Set(doc.feedback_states.states.map((s) => s.id));
  for (const requiredId of REQUIRED_FEEDBACK_IDS) {
    if (!feedbackIds.has(requiredId)) {
      issues.push({
        id: `missing-feedback-${requiredId}`,
        severity: "warning",
        category: "consistency",
        title: "Missing Feedback State",
        description: `Feedback state '${requiredId}' is not defined.`,
      });
    }
  }

  // --- 11. SECRET PATTERNS ---
  const secretPatterns = [
    /\b(password|secret|key|token|credentials)["']?\s*[:=]\s*["'][^"']+["']/i,
    /process\.env\.(API_KEY|SECRET|PASSWORD|TOKEN)/i,
    /Authorization:\s*["']Bearer\s+[a-zA-Z0-9\-\._]+["']/i,
  ];
  const docString = JSON.stringify(doc);
  for (const pattern of secretPatterns) {
    if (pattern.test(docString)) {
      issues.push({
        id: "forbidden-secret-pattern",
        severity: "error",
        category: "consistency",
        title: "Forbidden Secret Pattern Detected",
        description:
          "Design System contains text that resembles hardcoded secrets or credentials.",
      });
      break;
    }
  }

  // --- 12. UPSTREAM REFERENCES (context required) ---
  if (context) {
    const validRequirementIds = new Set<string>([
      ...context.blueprint.modules.flatMap((m) => m.requirement_ids),
      ...context.blueprint.api_plan.flatMap((a) => a.requirement_ids),
      ...context.blueprint.traceability.mappings.map((m) => m.requirement_id),
      ...context.flowchart.processes.flatMap((p) => p.requirement_ids),
    ]);
    const validArchModules = new Set(context.architecture.modules.map((m) => m.id));
    const validErdEntities = new Set(context.erd.entities.map((e) => e.name));
    const validDfdProcesses = new Set([
      ...context.dfd.context.nodes.filter((n) => n.type === "process").map((n) => n.id),
      ...context.dfd.level_1.nodes.filter((n) => n.type === "process").map((n) => n.id),
    ]);
    const validFlowchartIds = new Set([
      ...context.flowchart.nodes.map((n) => n.id),
      ...context.flowchart.processes.map((p) => p.id),
    ]);
    const validBlueprintModules = new Set(context.blueprint.modules.map((m) => m.id));
    const validBlueprintPages = new Set(
      context.blueprint.frontend_plan.pages.map((p) => p.id),
    );
    const validBlueprintRoutes = new Set(
      context.blueprint.frontend_plan.pages.map((p) => p.route),
    );
    const validBlueprintApis = new Set(context.blueprint.api_plan.map((a) => a.id));
    const validRoles = new Set(
      context.blueprint.authorization_plan.roles.map((r) => r.role),
    );

    // Screen routes must exist in the approved blueprint
    for (const screen of doc.screen_specifications) {
      if (screen.route.startsWith("/") && !validBlueprintRoutes.has(screen.route)) {
        issues.push({
          id: `invented-route-${screen.id}`,
          severity: "error",
          category: "screens",
          title: "Invented Route Not Found In Blueprint",
          description: `Screen '${screen.id}' route '${screen.route}' does not exist in the approved blueprint frontend plan.`,
          item_id: screen.id,
        });
      }
      for (const role of screen.user_roles) {
        if (!validRoles.has(role)) {
          issues.push({
            id: `screen-unknown-role-${screen.id}-${role}`,
            severity: "error",
            category: "screens",
            title: "Screen References Unknown Role",
            description: `Screen '${screen.id}' references unknown role '${role}'.`,
            item_id: screen.id,
          });
        }
      }
    }

    // Navigation routes must exist in the approved blueprint
    for (const nav of [
      ...doc.navigation_system.primary_navigation,
      ...doc.navigation_system.secondary_navigation,
    ]) {
      if (nav.route.startsWith("/") && !validBlueprintRoutes.has(nav.route)) {
        issues.push({
          id: `nav-invented-route-${nav.id}`,
          severity: "error",
          category: "navigation",
          title: "Navigation Route Not Found In Blueprint",
          description: `Navigation item '${nav.id}' route '${nav.route}' does not exist in the approved blueprint frontend plan.`,
          item_id: nav.id,
        });
      }
      if (
        nav.blueprint_page_id !== undefined &&
        nav.blueprint_page_id !== "" &&
        !validBlueprintPages.has(nav.blueprint_page_id)
      ) {
        issues.push({
          id: `nav-unknown-page-${nav.id}`,
          severity: "error",
          category: "references",
          title: "Navigation References Unknown Blueprint Page",
          description: `Navigation item '${nav.id}' references unknown blueprint page '${nav.blueprint_page_id}'.`,
          item_id: nav.id,
        });
      }
    }

    const referenceChecks: {
      entries: { owner: string; refs: string[] }[];
      valid: Set<string>;
      kind: string;
      category: DesignSystemValidationCategory;
    }[] = [
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.requirement_ids,
        })),
        valid: validRequirementIds,
        kind: "requirement",
        category: "references",
      },
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.architecture_module_ids,
        })),
        valid: validArchModules,
        kind: "architecture module",
        category: "references",
      },
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.erd_entity_ids,
        })),
        valid: validErdEntities,
        kind: "ERD entity",
        category: "references",
      },
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.dfd_process_ids,
        })),
        valid: validDfdProcesses,
        kind: "DFD process",
        category: "references",
      },
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.flowchart_process_ids,
        })),
        valid: validFlowchartIds,
        kind: "flowchart node",
        category: "references",
      },
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.blueprint_module_ids,
        })),
        valid: validBlueprintModules,
        kind: "blueprint module",
        category: "references",
      },
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.blueprint_page_ids,
        })),
        valid: validBlueprintPages,
        kind: "blueprint page",
        category: "references",
      },
      {
        entries: doc.traceability.screens.map((t) => ({
          owner: t.screen_id,
          refs: t.blueprint_api_ids,
        })),
        valid: validBlueprintApis,
        kind: "blueprint API",
        category: "references",
      },
      {
        entries: doc.component_system.components.map((c) => ({
          owner: c.id,
          refs: c.traceability.requirement_ids,
        })),
        valid: validRequirementIds,
        kind: "requirement",
        category: "references",
      },
      {
        entries: doc.component_system.components.map((c) => ({
          owner: c.id,
          refs: c.traceability.architecture_module_ids,
        })),
        valid: validArchModules,
        kind: "architecture module",
        category: "references",
      },
      {
        entries: doc.component_system.components.map((c) => ({
          owner: c.id,
          refs: c.traceability.blueprint_page_ids,
        })),
        valid: validBlueprintPages,
        kind: "blueprint page",
        category: "references",
      },
      {
        entries: doc.page_patterns.map((p) => ({
          owner: p.id,
          refs: p.traceability.blueprint_page_ids,
        })),
        valid: validBlueprintPages,
        kind: "blueprint page",
        category: "references",
      },
      {
        entries: doc.form_patterns.map((f) => ({
          owner: f.id,
          refs: f.traceability.blueprint_api_ids,
        })),
        valid: validBlueprintApis,
        kind: "blueprint API",
        category: "references",
      },
      {
        entries: doc.table_patterns.map((t) => ({
          owner: t.id,
          refs: t.traceability.erd_entity_ids,
        })),
        valid: validErdEntities,
        kind: "ERD entity",
        category: "references",
      },
    ];

    for (const check of referenceChecks) {
      for (const entry of check.entries) {
        for (const ref of entry.refs) {
          if (!check.valid.has(ref)) {
            issues.push({
              id: `unknown-${check.kind.replace(/\s+/g, "-")}-${entry.owner}-${ref}`,
              severity: "error",
              category: check.category,
              title: `Unknown ${check.kind} reference`,
              description: `'${entry.owner}' references unknown ${check.kind} '${ref}'.`,
              item_id: entry.owner,
            });
          }
        }
      }
    }
  }

  const hasError = issues.some((i) => i.severity === "error");
  return { valid: !hasError, issues };
}

/* ============================================
   APPROVAL EVALUATOR (shared by route & tests)
   ============================================ */

export type DesignSystemApprovalInput = {
  isOwner: boolean;
  status: string;
  reviewData: DesignSystemReview | null;
  decisions: DesignSystemReviewDecision[];
  validationValid: boolean;
  upstreamsComplete: boolean;
  sourceIdsMatch: boolean;
};

export type DesignSystemApprovalResult = {
  approved: boolean;
  reasons: string[];
};

/**
 * Deterministic approval gate. Server-authoritative: the approve route
 * delegates its decision logic here so tests exercise the real path.
 */
export function evaluateDesignSystemApproval(
  input: DesignSystemApprovalInput,
): DesignSystemApprovalResult {
  const reasons: string[] = [];

  if (!input.isOwner) {
    reasons.push("Only the project owner can approve documents.");
  }
  if (input.status === "approved") {
    reasons.push("Document is already approved.");
  } else if (input.status !== "review") {
    reasons.push("Document must be in review state before approval.");
  }
  if (!input.reviewData) {
    reasons.push("No review data found. Run the AI review first.");
  } else {
    const resolvedIds = new Set(input.decisions.map((d) => d.issue_id));
    const unresolved = input.reviewData.issues.filter((i) => !resolvedIds.has(i.id));
    if (unresolved.length > 0) {
      reasons.push(
        `All review issues must have a decision before approval (${unresolved.length} unresolved).`,
      );
    }
  }
  if (!input.validationValid) {
    reasons.push("Document failed deterministic validation.");
  }
  if (!input.upstreamsComplete) {
    reasons.push("Missing required approved upstream artifacts.");
  }
  if (!input.sourceIdsMatch) {
    reasons.push(
      "Source document IDs do not match the current approved upstream documents.",
    );
  }

  return { approved: reasons.length === 0, reasons };
}

/**
 * Approved documents are immutable; only draft/review may be mutated.
 */
export function canMutateDesignSystem(status: string): boolean {
  return status === "draft" || status === "review";
}
