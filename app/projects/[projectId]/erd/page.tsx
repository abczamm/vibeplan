import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ERDViewer } from "./erd-viewer";
import type { 
  ERDDocument, 
  ERDReview, 
  ReviewDecision 
} from "@/lib/ai/types";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ERDPage({ params }: Props) {
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

  // Check if architecture is approved
  const { data: archDoc } = await supabase
    .from("project_documents")
    .select("status")
    .eq("project_id", projectId)
    .eq("document_type", "architecture")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const architectureApproved = archDoc?.status === "approved";

  // Check for ERD document
  const { data: erdDoc } = await supabase
    .from("project_documents")
    .select("id, content, status, review_data, decisions, approved_at, approved_by, created_at")
    .eq("project_id", projectId)
    .eq("document_type", "erd")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <Link href={`/projects/${project.id}/architecture`}>Architecture</Link>
        <span className="doc-bar-current" aria-current="page">
          ERD
        </span>
      </nav>

      <ERDViewer
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
        architectureApproved={architectureApproved}
        initialDoc={
          erdDoc
            ? {
                id: erdDoc.id as string,
                status: erdDoc.status as string,
                content: erdDoc.content as ERDDocument,
                review_data: (erdDoc.review_data as ERDReview | null) ?? null,
                decisions: (erdDoc.decisions as ReviewDecision[] | null) ?? [],
                approved_at: (erdDoc.approved_at as string | null) ?? null,
                approved_by: (erdDoc.approved_by as string | null) ?? null,
              }
            : null
        }
      />
    </>
  );
}
