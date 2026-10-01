import Link from "next/link";
import {
  discoveryPhaseBadge,
  docStatusBadge,
  formatUpdatedAt,
  phaseLabel,
  projectStatusLabel,
} from "@/lib/ui/status";
import { DOC_TYPES, type ProjectListItem } from "./projects-data";

const DOC_SHORT: Record<string, string> = {
  requirements: "Req",
  architecture: "Arch",
  erd: "ERD",
  dfd: "DFD",
  flowchart: "Flow",
  blueprint: "BP",
  agent_package: "AP",
  design_system: "DS",
  engineering_plan: "EP",
};

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const discovery = discoveryPhaseBadge(project.discoveryPhase);

  return (
    <article className="proj-card">
      <div className="proj-card-head">
        <h3 className="proj-card-title">
          <Link href={`/projects/${project.id}`}>{project.name}</Link>
        </h3>
        <span className="badge badge-neutral">
          {projectStatusLabel(project.status)}
        </span>
      </div>

      {project.description && (
        <p className="proj-card-desc">{project.description}</p>
      )}

      <div className="proj-meta">
        <span>
          <strong>Phase:</strong> {phaseLabel(project.current_phase)}
        </span>
        <span>
          <strong>Discovery:</strong> {discovery.label}
        </span>
      </div>

      <div className="proj-docs" aria-label="Document statuses">
        <span className={`proj-doc-chip ${chipClass(discovery.className)}`}>
          Discovery
        </span>
        {DOC_TYPES.map((type) => {
          const status = project.docs[type];
          const view = docStatusBadge(status);
          return (
            <span
              key={type}
              className={`proj-doc-chip ${chipClass(view.className)}`}
            >
              {DOC_SHORT[type]} · {view.label}
            </span>
          );
        })}
      </div>

      <div className="proj-card-foot">
        <span className="proj-updated">
          Updated {formatUpdatedAt(project.updated_at)}
        </span>
        <Link
          href={`/projects/${project.id}`}
          className="btn btn-secondary btn-sm"
        >
          Open project →
        </Link>
      </div>
    </article>
  );
}

function chipClass(badgeClassName: string): string {
  if (badgeClassName.includes("badge-draft")) return "is-draft";
  if (badgeClassName.includes("badge-review")) return "is-review";
  if (badgeClassName.includes("badge-approved")) return "is-approved";
  if (badgeClassName.includes("badge-completed")) return "is-completed";
  if (badgeClassName.includes("badge-blocked")) return "is-blocked";
  return "";
}
