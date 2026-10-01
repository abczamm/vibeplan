export type BadgeTone =
  | "neutral"
  | "draft"
  | "review"
  | "approved"
  | "completed"
  | "blocked";

export type BadgeView = {
  label: string;
  className: string;
};

const DOC_STATUS_VIEW: Record<string, BadgeView> = {
  draft: { label: "Draft", className: "badge badge-draft" },
  review: { label: "In review", className: "badge badge-review" },
  approved: { label: "Approved", className: "badge badge-approved" },
};

export function docStatusBadge(
  status: string | null | undefined,
  blocked?: { label: string },
): BadgeView {
  if (blocked) {
    return { label: blocked.label, className: "badge badge-blocked" };
  }
  if (!status) {
    return { label: "Not started", className: "badge badge-neutral" };
  }
  return (
    DOC_STATUS_VIEW[status] ?? {
      label: status,
      className: "badge badge-neutral",
    }
  );
}

const PHASE_LABELS: Record<string, string> = {
  idea: "Idea",
  discovery: "Discovery",
  requirements: "Requirements",
  architecture: "Architecture",
  erd: "ERD",
  dfd: "DFD",
  flowchart: "Flowchart",
  blueprint: "Implementation Blueprint",
  design: "Design",
  design_system: "Design System",
  engineering_plan: "Engineering Plan",
  engineering: "Engineering",
  agent_package: "Agent Package",
};

export function phaseLabel(phase: string | null | undefined): string {
  if (!phase) return "—";
  return PHASE_LABELS[phase] ?? phase;
}

const DISCOVERY_PHASE_VIEW: Record<string, BadgeView> = {
  initial: { label: "Discovery started", className: "badge badge-draft" },
  clarifying: { label: "In progress", className: "badge badge-draft" },
  synthesis: { label: "Synthesis", className: "badge badge-review" },
  approval: { label: "Awaiting approval", className: "badge badge-review" },
  completed: { label: "Completed", className: "badge badge-completed" },
};

export function discoveryPhaseBadge(phase: string | null): BadgeView {
  if (!phase) return { label: "Not started", className: "badge badge-neutral" };
  return (
    DISCOVERY_PHASE_VIEW[phase] ?? {
      label: phase,
      className: "badge badge-neutral",
    }
  );
}

export function projectStatusLabel(status: string | null | undefined): string {
  if (!status) return "Active";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function formatUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
