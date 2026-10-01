import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const DOC_TYPES = [
  "requirements",
  "architecture",
  "erd",
  "dfd",
  "flowchart",
  "blueprint",
  "agent_package",
  "design_system",
  "engineering_plan",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  current_phase: string | null;
  updated_at: string;
  docs: Partial<Record<DocType, string>>;
  discoveryPhase: string | null;
};

export async function getProjectListItems(): Promise<{
  userEmail: string;
  projects: ProjectListItem[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [projectsResult, docsResult, sessionsResult] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, description, status, current_phase, created_at, updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("project_documents")
      .select("project_id, document_type, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("discovery_sessions")
      .select("project_id, phase, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const projects = projectsResult.data ?? [];

  const latestDoc = new Map<string, string>();
  for (const row of docsResult.data ?? []) {
    const key = `${row.project_id}:${row.document_type}`;
    if (!latestDoc.has(key)) {
      latestDoc.set(key, String(row.status ?? "draft"));
    }
  }

  const latestSession = new Map<string, string>();
  for (const row of sessionsResult.data ?? []) {
    if (!latestSession.has(row.project_id)) {
      latestSession.set(row.project_id, String(row.phase ?? "initial"));
    }
  }

  const items: ProjectListItem[] = projects.map((project) => {
    const docs: Partial<Record<DocType, string>> = {};
    for (const type of DOC_TYPES) {
      const status = latestDoc.get(`${project.id}:${type}`);
      if (status !== undefined) {
        docs[type] = status;
      }
    }
    return {
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      status: project.status ?? null,
      current_phase: project.current_phase ?? null,
      updated_at: project.updated_at ?? "",
      docs,
      discoveryPhase: latestSession.get(project.id) ?? null,
    };
  });

  return { userEmail: user.email ?? "", projects: items };
}
