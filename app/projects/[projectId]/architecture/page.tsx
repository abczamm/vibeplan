import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArchitectureViewer } from "./architecture-viewer";
import type { 
  ArchitectureDocument, 
  ArchitectureReview,
  ReviewDecision 
} from "@/lib/ai/types";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ArchitecturePage({ params }: Props) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, owner_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) notFound();

  const isOwner = project.owner_id === user.id;
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) notFound();
  }

  // Check if requirements are approved
  const { data: reqDoc } = await supabase
    .from("project_documents")
    .select("status")
    .eq("project_id", projectId)
    .eq("document_type", "requirements")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const requirementsApproved = reqDoc?.status === "approved";

  // Check for architecture document
  const { data: archDoc } = await supabase
    .from("project_documents")
    .select("id, content, status, review_data, decisions, approved_at, approved_by, created_at")
    .eq("project_id", projectId)
    .eq("document_type", "architecture")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <Link href={`/projects/${project.id}/requirements`}>Requirements</Link>
        <span className="doc-bar-current" aria-current="page">
          Architecture
        </span>
      </nav>

      <ArchitectureViewer
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
        requirementsApproved={requirementsApproved}
        initialDoc={
          archDoc
            ? {
                id: archDoc.id as string,
                status: archDoc.status as string,
                content: archDoc.content as ArchitectureDocument,
                review_data: (archDoc.review_data as ArchitectureReview | null) ?? null,
                decisions: (archDoc.decisions as ReviewDecision[] | null) ?? [],
                approved_at: (archDoc.approved_at as string | null) ?? null,
                approved_by: (archDoc.approved_by as string | null) ?? null,
              }
            : null
        }
      />
    </>
  );
}
