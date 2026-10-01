import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DFDViewer } from "./dfd-viewer";
import type { 
  DFDDocument, 
  DFDReview, 
  ReviewDecision 
} from "@/lib/ai/types";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function DFDPage({ params }: Props) {
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

  // Check if ERD is approved
  const { data: erdDoc } = await supabase
    .from("project_documents")
    .select("status")
    .eq("project_id", projectId)
    .eq("document_type", "erd")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const erdApproved = erdDoc?.status === "approved";

  // Check for DFD document
  const { data: dfdDoc } = await supabase
    .from("project_documents")
    .select("id, content, status, review_data, decisions, approved_at, approved_by, created_at")
    .eq("project_id", projectId)
    .eq("document_type", "dfd")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <Link href={`/projects/${project.id}/erd`}>ERD</Link>
        <span className="doc-bar-current" aria-current="page">
          DFD
        </span>
      </nav>

      <DFDViewer
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
        erdApproved={erdApproved}
        initialDoc={
          dfdDoc
            ? {
                id: dfdDoc.id as string,
                status: dfdDoc.status as string,
                content: dfdDoc.content as DFDDocument,
                review_data: (dfdDoc.review_data as DFDReview | null) ?? null,
                decisions: (dfdDoc.decisions as ReviewDecision[] | null) ?? [],
                approved_at: (dfdDoc.approved_at as string | null) ?? null,
                approved_by: (dfdDoc.approved_by as string | null) ?? null,
              }
            : null
        }
      />
    </>
  );
}
