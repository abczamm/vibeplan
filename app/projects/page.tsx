import Link from "next/link";
import { ProjectCard } from "../dashboard/project-card";
import { getProjectListItems } from "../dashboard/projects-data";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { projects } = await getProjectListItems();

  return (
    <div className="dash">
      <header className="dash-hero">
        <div>
          <p className="dash-greeting">General</p>
          <h1 className="dash-title">Projects</h1>
          <p className="dash-sub">
            All VibePlan projects with their current pipeline stage and
            document statuses.
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          + Create Project
        </Link>
      </header>

      {projects.length > 0 ? (
        <div className="proj-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>
              Projects you create will appear here with their pipeline and
              document statuses.
            </p>
            <Link href="/projects/new" className="btn btn-primary">
              Create your first project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
