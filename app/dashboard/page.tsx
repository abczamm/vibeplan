import Link from "next/link";
import { ProjectCard } from "./project-card";
import { getProjectListItems } from "./projects-data";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userEmail, projects } = await getProjectListItems();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="dash">
      <header className="dash-hero">
        <div>
          <p className="dash-greeting">
            {greeting}
            {userEmail ? ` · ${userEmail}` : ""}
          </p>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">
            From Idea to Implementation. Track every project through the
            VibePlan pipeline — discovery through flowchart approval.
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          + Create Project
        </Link>
      </header>

      <section aria-labelledby="projects-heading">
        <div className="dash-section-head">
          <h2 className="dash-section-title" id="projects-heading">
            Your Projects
          </h2>
          {projects.length > 0 && (
            <span className="dash-count">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {projects.length > 0 ? (
          <div className="proj-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <svg
                className="empty-state-icon"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="7"
                  y="11"
                  width="34"
                  height="26"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M7 18 H41 M16 11 V6 M32 11 V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M17 28 L22 33 L31 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3>No projects yet</h3>
              <p>
                Create your first project and turn an idea into a structured,
                implementation-ready plan.
              </p>
              <Link href="/projects/new" className="btn btn-primary">
                Create your first project
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
