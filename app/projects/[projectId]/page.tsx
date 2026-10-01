import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  docStatusBadge,
  formatUpdatedAt,
  projectStatusLabel,
} from "@/lib/ui/status";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const PHASE_STEPS = [
  { key: "idea", label: "Idea" },
  { key: "discovery", label: "Discovery" },
  { key: "requirements", label: "Requirements" },
  { key: "architecture", label: "Architecture" },
  { key: "erd", label: "ERD" },
  { key: "dfd", label: "DFD" },
  { key: "flowchart", label: "Flowchart" },
  { key: "blueprint", label: "Implementation Blueprint" },
  { key: "agent_package", label: "Agent Package" },
  { key: "design_system", label: "Design System" },
  { key: "engineering_plan", label: "Engineering Plan" },
  { key: "coding_agent", label: "Coding Agent Engine" },
  { key: "human_merge", label: "Review & Merge" },
];

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `id, name, description, status, current_phase, created_at, updated_at, owner_id`,
    )
    .eq("id", projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  const pid = project.id;

  const [discoverySessionResult, requirementsDocResult, archDocResult] =
    await Promise.all([
      supabase
        .from("discovery_sessions")
        .select("id, phase, turn_count")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, status, approved_at")
        .eq("project_id", projectId)
        .eq("document_type", "requirements")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, status, approved_at")
        .eq("project_id", projectId)
        .eq("document_type", "architecture")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const [erdDocResult, dfdDocResult, flowchartDocResult, blueprintDocResult, agentPackageDocResult, designSystemDocResult, engineeringPlanDocResult] = await Promise.all([
    supabase
      .from("project_documents")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("document_type", "erd")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("project_documents")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("document_type", "dfd")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("project_documents")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("document_type", "flowchart")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("project_documents")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("document_type", "blueprint")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("project_documents")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("document_type", "agent_package")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("project_documents")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("document_type", "design_system")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("project_documents")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("document_type", "engineering_plan")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const discoverySession = discoverySessionResult.data;
  const requirementsDoc = requirementsDocResult.data;
  const archDoc = archDocResult.data;
  const erdDoc = erdDocResult.data;
  const dfdDoc = dfdDocResult.data;
  const flowchartDoc = flowchartDocResult.data;
  const blueprintDoc = blueprintDocResult.data;
  const agentPackageDoc = agentPackageDocResult.data;
  const designSystemDoc = designSystemDocResult.data;
  const engineeringPlanDoc = engineeringPlanDocResult.data;

  const discoveryPhase = discoverySession?.phase ?? null;
  const discoveryDone =
    discoveryPhase === "approval" ||
    discoveryPhase === "completed" ||
    !!requirementsDoc;

  const requirementsStatus = requirementsDoc?.status ?? null;
  const requirementsApproved = requirementsStatus === "approved";
  const archStatus = archDoc?.status ?? null;
  const archApproved = archStatus === "approved";
  const erdStatus = erdDoc?.status ?? null;
  const erdApproved = erdStatus === "approved";
  const dfdStatus = dfdDoc?.status ?? null;
  const dfdApproved = dfdStatus === "approved";
  const archDone = !!archDoc;
  const erdDone = !!erdDoc;
  const dfdDone = !!dfdDoc;
  const flowchartStatus = flowchartDoc?.status ?? null;
  const flowchartApproved = flowchartStatus === "approved";
  const flowchartDone = !!flowchartDoc;
  const blueprintStatus = blueprintDoc?.status ?? null;
  const blueprintApproved = blueprintStatus === "approved";
  const blueprintDone = !!blueprintDoc;
  const agentPackageStatus = agentPackageDoc?.status ?? null;
  const agentPackageApproved = agentPackageStatus === "approved";
  const agentPackageDone = !!agentPackageDoc;
  const designSystemStatus = designSystemDoc?.status ?? null;
  const designSystemApproved = designSystemStatus === "approved";
  const designSystemDone = !!designSystemDoc;
  const engineeringPlanStatus = engineeringPlanDoc?.status ?? null;
  const engineeringPlanApproved = engineeringPlanStatus === "approved";
  const engineeringPlanDone = !!engineeringPlanDoc;

  // Since Coding Agent is stateful, we check its session
  const { data: codingAgentSessionResult } = await supabase
    .from("coding_agent_sessions")
    .select("status")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const codingAgentStatus = codingAgentSessionResult?.status ?? null;
  const codingAgentDone = codingAgentStatus === "completed";
  const projectStatus = (project.status as string | null) ?? "active";

  type StageRender = {
    done: boolean;
    badge?: { label: string; className: string } | undefined;
    action?: { href: string; label: string; primary: boolean };
    hint?: string;
  };

  function stageRender(key: string): StageRender {
    switch (key) {
      case "discovery":
        return {
          done: discoveryDone,
          action: {
            href: `/projects/${pid}/discovery`,
            label: discoveryDone ? "View" : "Start",
            primary: !discoveryDone,
          },
        };
      case "requirements":
        return {
          done: requirementsApproved,
          badge: docStatusBadge(requirementsStatus),
          action: requirementsDoc
            ? {
                href: `/projects/${pid}/requirements`,
                label:
                  requirementsStatus === "approved"
                    ? "View"
                    : requirementsStatus === "review"
                      ? "Review"
                      : "Review",
                primary: requirementsStatus !== "approved",
              }
            : undefined,
        };
      case "architecture":
        return {
          done: archApproved,
          badge: archDoc ? docStatusBadge(archStatus) : undefined,
          action: archDoc
            ? {
                href: `/projects/${pid}/architecture`,
                label: archStatus === "approved" ? "View" : "Review",
                primary: archStatus !== "approved",
              }
            : undefined,
          hint: archDoc
            ? undefined
            : requirementsApproved
              ? "Ready to generate"
              : "Locked until requirements approval",
        };
      case "erd":
        return {
          done: erdApproved,
          badge: erdDoc ? docStatusBadge(erdStatus) : undefined,
          action: erdDoc
            ? {
                href: `/projects/${pid}/erd`,
                label: erdStatus === "approved" ? "View" : "Review",
                primary: erdStatus !== "approved",
              }
            : undefined,
          hint: erdDoc
            ? undefined
            : archApproved
              ? "Ready to generate"
              : "Locked until architecture approval",
        };
      case "dfd":
        return {
          done: dfdApproved,
          badge: dfdDoc ? docStatusBadge(dfdStatus) : undefined,
          action: dfdDoc
            ? {
                href: `/projects/${pid}/dfd`,
                label: dfdStatus === "approved" ? "View" : "Review",
                primary: dfdStatus !== "approved",
              }
            : undefined,
          hint: dfdDoc
            ? undefined
            : erdApproved
              ? "Ready to generate"
              : "Locked until ERD approval",
        };
      case "flowchart":
        return {
          done: flowchartApproved,
          badge: flowchartDoc ? docStatusBadge(flowchartStatus) : undefined,
          action: flowchartDoc
            ? {
                href: `/projects/${pid}/flowchart`,
                label: flowchartStatus === "approved" ? "View" : "Review",
                primary: flowchartStatus !== "approved",
              }
            : undefined,
          hint: flowchartDoc
            ? undefined
            : dfdApproved
              ? "Ready to generate"
              : "Locked until DFD approval",
        };
      case "blueprint":
        return {
          done: blueprintApproved,
          badge: blueprintDoc ? docStatusBadge(blueprintStatus) : undefined,
          action: blueprintDoc
            ? {
                href: `/projects/${pid}/blueprint`,
                label: blueprintStatus === "approved" ? "View" : "Review",
                primary: blueprintStatus !== "approved",
              }
            : undefined,
          hint: blueprintDoc
            ? undefined
            : flowchartApproved
              ? "Ready to generate"
              : "Locked until Flowchart approval",
        };
      case "agent_package":
        return {
          done: agentPackageApproved,
          badge: agentPackageDoc ? docStatusBadge(agentPackageStatus) : undefined,
          action: agentPackageDoc
            ? {
                href: `/projects/${pid}/agent-package`,
                label: agentPackageStatus === "approved" ? "View" : "Review",
                primary: agentPackageStatus !== "approved",
              }
            : undefined,
          hint: agentPackageDoc
            ? undefined
            : blueprintApproved
              ? "Ready to generate"
              : "Locked until Blueprint approval",
        };
      case "design_system":
        return {
          done: designSystemApproved,
          badge: designSystemDoc ? docStatusBadge(designSystemStatus) : undefined,
          action: designSystemDoc
            ? {
                href: `/projects/${pid}/design-system`,
                label: designSystemStatus === "approved" ? "View" : "Review",
                primary: designSystemStatus !== "approved",
              }
            : undefined,
          hint: designSystemDoc
            ? undefined
            : blueprintApproved
              ? "Ready to generate"
              : "Locked until Blueprint approval",
        };
      case "engineering_plan":
        return {
          done: engineeringPlanApproved,
          badge: engineeringPlanDoc ? docStatusBadge(engineeringPlanStatus) : undefined,
          action: engineeringPlanDoc
            ? {
                href: `/projects/${pid}/engineering-plan`,
                label:
                  engineeringPlanStatus === "approved" ? "View" : "Review",
                primary: engineeringPlanStatus !== "approved",
              }
            : undefined,
          hint: engineeringPlanDoc
            ? "Approve Engineering Plan to proceed"
            : undefined,
        };
      case "coding_agent":
        return {
          done: codingAgentDone,
          badge: codingAgentStatus ? (
            { label: codingAgentStatus.toUpperCase(), className: "badge badge-neutral" }
          ) : undefined,
          action: engineeringPlanApproved
            ? {
                href: `/projects/${pid}/coding-agent`,
                label: codingAgentStatus ? "View Execution" : "Start Execution",
                primary: !codingAgentStatus || codingAgentStatus === "created" || codingAgentStatus === "paused",
              }
            : undefined,
            hint: !engineeringPlanApproved ? "Requires approved Engineering Plan" : undefined,
          };
        case "human_merge":
          return {
            done: false, // This is the final state
            badge: codingAgentDone ? { label: "READY", className: "badge badge-primary" } : undefined,
            action: codingAgentDone
              ? {
                  href: `/projects/${pid}/merge`,
                  label: "Review & Merge",
                  primary: true,
                }
              : undefined,
            hint: !codingAgentDone ? "Requires completed Coding Agent execution" : undefined,
          };
        default:
          return { done: false };
    }
  }

  // Next action cascade — same order of precedence as before
  type NextAction = { text: string; href: string; cta: string };
  let nextAction: NextAction;
  
  if (codingAgentStatus) {
    if (codingAgentDone) {
      nextAction = {
        text: "Coding Agent execution is complete.",
        href: `/projects/${pid}/coding-agent`,
        cta: "View Final Status",
      };
    } else {
      nextAction = {
        text: `Coding Agent execution is ${codingAgentStatus}.`,
        href: `/projects/${pid}/coding-agent`,
        cta: "Go to Execution",
      };
    }
  } else if (engineeringPlanApproved) {
    nextAction = {
      text: "Engineering Plan is approved. Ready to start Coding Agent execution.",
      href: `/projects/${pid}/coding-agent`,
      cta: "Start Execution",
    };
  } else if (designSystemApproved && engineeringPlanDone) {
    nextAction = {
      text: "An Engineering Plan draft exists. Run the AI review and resolve all decisions to proceed.",
      href: `/projects/${pid}/engineering-plan`,
      cta: "Review Engineering Plan",
    };
  } else if (designSystemApproved) {
    nextAction = {
      text: "Design System is approved — ready to generate the Engineering Plan.",
      href: `/projects/${pid}/engineering-plan`,
      cta: "Generate Engineering Plan",
    };
  } else if (agentPackageApproved && designSystemDone) {
    nextAction = {
      text: "A Design System draft exists. Run the AI review and resolve all decisions to proceed.",
      href: `/projects/${pid}/design-system`,
      cta: "Review Design System",
    };
  } else if (agentPackageApproved && blueprintApproved) {
    nextAction = {
      text: "Agent Package is approved — ready to generate the Design System.",
      href: `/projects/${pid}/design-system`,
      cta: "Generate Design System",
    };
  } else if (agentPackageApproved) {
    nextAction = {
      text: "Agent Package is approved — ready to generate the Design System.",
      href: `/projects/${pid}/design-system`,
      cta: "Generate Design System",
    };
  } else if (blueprintApproved && agentPackageDone) {
    nextAction = {
      text: "An Agent Package draft exists. Run the AI review and resolve decisions to proceed.",
      href: `/projects/${pid}/agent-package`,
      cta: "Review Agent Package",
    };
  } else if (blueprintApproved) {
    nextAction = {
      text: "Implementation Blueprint is approved — ready to generate the Agent Package.",
      href: `/projects/${pid}/agent-package`,
      cta: "Generate Agent Package",
    };
  } else if (flowchartApproved && blueprintDone) {
    nextAction = {
      text: "A Blueprint draft exists. Review and approve the implementation plan.",
      href: `/projects/${pid}/blueprint`,
      cta: "Review Blueprint",
    };
  } else if (flowchartApproved) {
    nextAction = {
      text: "Flowchart is approved — ready to generate Implementation Blueprint.",
      href: `/projects/${pid}/blueprint`,
      cta: "Generate Blueprint",
    };
  } else if (dfdApproved && flowchartDone) {
    nextAction = {
      text: "A flowchart draft exists. Validate the business process flow against the approved artifacts.",
      href: `/projects/${pid}/flowchart`,
      cta: "Review Flowchart",
    };
  } else if (dfdApproved) {
    nextAction = {
      text: "DFD is approved — ready to model business process flow, decisions, and error paths.",
      href: `/projects/${pid}/flowchart`,
      cta: "Generate Flowchart",
    };
  } else if (erdApproved && dfdDone) {
    nextAction = {
      text: "A DFD draft exists. Review and approve it to finalize the system data flow baseline.",
      href: `/projects/${pid}/dfd`,
      cta: dfdStatus === "review" ? "Continue DFD Review" : "Review DFD",
    };
  } else if (erdApproved) {
    nextAction = {
      text: "ERD is approved — ready to map system data flows (DFD).",
      href: `/projects/${pid}/dfd`,
      cta: "Generate DFD",
    };
  } else if (archApproved && erdDone) {
    nextAction = {
      text: "An ERD draft exists. Review and approve it to finalize the database baseline.",
      href: `/projects/${pid}/erd`,
      cta: erdStatus === "review" ? "Continue ERD Review" : "Review ERD",
    };
  } else if (archApproved) {
    nextAction = {
      text: "Architecture is approved — ready for database entity modeling.",
      href: `/projects/${pid}/erd`,
      cta: "Generate ERD",
    };
  } else if (requirementsApproved && archDone) {
    nextAction = {
      text: "An architecture draft exists. Review and approve it to proceed to system modeling.",
      href: `/projects/${pid}/architecture`,
      cta:
        archStatus === "review"
          ? "Continue Architecture Review"
          : "Review Architecture",
    };
  } else if (requirementsApproved) {
    nextAction = {
      text: "Requirements are approved. Ready to generate system architecture.",
      href: `/projects/${pid}/architecture`,
      cta: "Generate Architecture",
    };
  } else if (requirementsDoc) {
    nextAction = {
      text: "A requirements draft exists. Review and approve it to proceed.",
      href: `/projects/${pid}/requirements`,
      cta: "Review Requirements",
    };
  } else {
    nextAction = {
      text: "Define the initial idea and let VibePlan guide the discovery process.",
      href: `/projects/${pid}/discovery`,
      cta: "Start Discovery",
    };
  }

  const summaryDocs = [
    {
      key: "discovery",
      name: "Discovery",
      badge: discoveryDone
        ? { label: "Completed", className: "badge badge-completed" }
        : discoveryPhase
          ? { label: "In progress", className: "badge badge-draft" }
          : { label: "Not started", className: "badge badge-neutral" },
      href: `/projects/${pid}/discovery`,
      exists: true,
    },
    {
      key: "requirements",
      name: "Requirements",
      badge: docStatusBadge(requirementsStatus),
      href: `/projects/${pid}/requirements`,
      exists: !!requirementsDoc,
    },
    {
      key: "architecture",
      name: "Architecture",
      badge: archDoc
        ? docStatusBadge(archStatus)
        : docStatusBadge(
            null,
            requirementsApproved ? undefined : { label: "Blocked" },
          ),
      href: `/projects/${pid}/architecture`,
      exists: !!archDoc,
      ready: requirementsApproved,
    },
    {
      key: "erd",
      name: "ERD",
      badge: erdDoc
        ? docStatusBadge(erdStatus)
        : docStatusBadge(null, archApproved ? undefined : { label: "Blocked" }),
      href: `/projects/${pid}/erd`,
      exists: !!erdDoc,
      ready: archApproved,
    },
    {
      key: "dfd",
      name: "DFD",
      badge: dfdDoc
        ? docStatusBadge(dfdStatus)
        : docStatusBadge(null, erdApproved ? undefined : { label: "Blocked" }),
      href: `/projects/${pid}/dfd`,
      exists: !!dfdDoc,
      ready: erdApproved,
    },
    {
      key: "flowchart",
      name: "Flowchart",
      badge: flowchartDoc
        ? docStatusBadge(flowchartStatus)
        : docStatusBadge(
            null,
            dfdApproved ? undefined : { label: "Blocked" },
          ),
      href: `/projects/${pid}/flowchart`,
      exists: !!flowchartDoc,
      ready: dfdApproved,
    },
    {
      key: "blueprint",
      name: "Blueprint",
      badge: blueprintDoc
        ? docStatusBadge(blueprintStatus)
        : docStatusBadge(
            null,
            flowchartApproved ? undefined : { label: "Blocked" },
          ),
      href: `/projects/${pid}/blueprint`,
      exists: !!blueprintDoc,
      ready: flowchartApproved,
    },
    {
      key: "agent_package",
      name: "Agent Package",
      badge: agentPackageDoc
        ? docStatusBadge(agentPackageStatus)
        : docStatusBadge(
            null,
            blueprintApproved ? undefined : { label: "Blocked" },
          ),
      href: `/projects/${pid}/agent-package`,
      exists: !!agentPackageDoc,
      ready: blueprintApproved,
    },
    {
      key: "design_system",
      name: "Design System",
      badge: designSystemDoc
        ? docStatusBadge(designSystemStatus)
        : docStatusBadge(
            null,
            blueprintApproved ? undefined : { label: "Blocked" },
          ),
      href: `/projects/${pid}/design-system`,
      exists: !!designSystemDoc,
      ready: blueprintApproved,
    },
    {
      key: "engineering_plan",
      name: "Engineering Plan",
      badge: engineeringPlanDoc
        ? docStatusBadge(engineeringPlanStatus)
        : docStatusBadge(
            null,
            designSystemApproved ? undefined : { label: "Blocked" },
          ),
      href: `/projects/${pid}/engineering-plan`,
      exists: !!engineeringPlanDoc,
      ready: designSystemApproved,
    },
    {
      key: "coding_agent",
      name: "Coding Agent Engine",
      badge: codingAgentStatus ? (
        { label: codingAgentStatus.toUpperCase(), className: "badge badge-neutral" }
      ) : docStatusBadge(
            null,
            engineeringPlanApproved ? undefined : { label: "Blocked" },
      ),
      href: `/projects/${pid}/coding-agent`,
      exists: !!codingAgentStatus,
      ready: engineeringPlanApproved,
    },
  ];

  return (
    <div className="vp-page">
      <nav className="vp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <Link href="/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{project.name}</span>
      </nav>

      <header className="vp-page-header">
        <div>
          <p className="vp-eyebrow">VibePlan Project</p>
          <h1 className="vp-page-title">{project.name}</h1>
          {project.description && (
            <p className="vp-page-desc">{project.description}</p>
          )}
        </div>
        <div className="vp-page-actions">
          <span className="badge badge-neutral">
            {projectStatusLabel(projectStatus)}
          </span>
          {requirementsApproved && (
            <span className="badge badge-approved">✓ Requirements approved</span>
          )}
        </div>
      </header>

      <div className="ws-grid">
        <div>
          <section aria-labelledby="pipeline-heading">
            <h2 className="ws-panel-title" id="pipeline-heading">
              Planning Pipeline
            </h2>
            <div className="ws-pipeline">
              {PHASE_STEPS.map((step, i) => {
                const render = stageRender(step.key);
                const isCurrent = project.current_phase === step.key;

                return (
                  <div
                    key={step.key}
                    className={`ws-step${isCurrent ? " is-current" : ""}${
                      render.done ? " is-done" : ""
                    }`}
                  >
                    <span
                      className={`ws-dot${render.done ? " is-done" : ""}${
                        !render.done && isCurrent ? " is-current" : ""
                      }`}
                      aria-hidden="true"
                    >
                      {render.done ? "✓" : i + 1}
                    </span>
                    <span className="ws-step-label">{step.label}</span>

                    <div className="ws-step-right">
                      {render.badge ? (
                        <span className={(render.badge as { className: string; label: string }).className}>
                          {(render.badge as { className: string; label: string }).label}
                        </span>
                      ) : null}
                      {render.hint && (
                        <span className="ws-hint">{render.hint}</span>
                      )}
                      {render.action && (
                        <Link
                          href={render.action.href}
                          className={`btn btn-sm ${
                            render.action.primary
                              ? "btn-primary"
                              : "btn-secondary"
                          }`}
                        >
                          {(render.action as { label: string }).label}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="docs-heading" style={{ marginTop: 32 }}>
            <h2 className="ws-panel-title" id="docs-heading">
              Document Statuses
            </h2>
            <div className="ws-docs">
              {summaryDocs.map((doc) => (
                <div key={doc.key} className="ws-doc-card">
                  <p className="ws-doc-name">{doc.name}</p>
                  {doc.badge ? (
                    <span className={(doc.badge as { className: string; label: string }).className}>
                      {(doc.badge as { className: string; label: string }).label}
                    </span>
                  ) : null}
                  {doc.exists ? (
                    <Link className="ws-doc-open" href={doc.href}>
                      Open →
                    </Link>
                  ) : doc.ready ? (
                    <Link className="ws-doc-open" href={doc.href}>
                      Ready to generate →
                    </Link>
                  ) : (
                    <span className="ws-hint">Locked until approval</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside aria-labelledby="next-heading">
          <div className="ws-next">
            <span className="ws-next-label" id="next-heading">
              Next Step
            </span>
            <p>{nextAction.text}</p>
            <Link href={nextAction.href} className="btn btn-primary btn-block">
              {nextAction.cta} →
            </Link>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="ws-panel-title" style={{ marginBottom: 8 }}>
              Project
            </div>
            <div className="proj-meta" style={{ flexDirection: "column", gap: 8 }}>
              <span>
                <strong>Status:</strong> {projectStatusLabel(projectStatus)}
              </span>
              <span>
                <strong>Updated:</strong> {formatUpdatedAt(project.updated_at)}
              </span>
              <span>
                <strong>Created:</strong> {formatUpdatedAt(project.created_at)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
