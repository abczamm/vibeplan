import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequirementsReview } from "./requirements-review";
import type {
  RequirementsDraft,
  RequirementsReview as ReviewType,
  ReviewDecision,
} from "@/lib/ai/types";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function RequirementsPage({ params }: Props) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, description, owner_id")
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

  const { data: doc } = await supabase
    .from("project_documents")
    .select(
      "id, content, status, review_data, decisions, approved_at, approved_by, created_at",
    )
    .eq("project_id", projectId)
    .eq("document_type", "requirements")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <Link href={`/projects/${project.id}/discovery`}>Discovery</Link>
        <span className="doc-bar-current" aria-current="page">
          Requirements
        </span>
      </nav>

      <RequirementsReview
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
        doc={
          doc
            ? {
                id: doc.id as string,
                content: doc.content as RequirementsDraft,
                status: doc.status as string,
                review_data: (doc.review_data as ReviewType | null) ?? null,
                decisions: (doc.decisions as ReviewDecision[] | null) ?? [],
                approved_at: (doc.approved_at as string | null) ?? null,
                approved_by: (doc.approved_by as string | null) ?? null,
              }
            : null
        }
      />
    </>
  );
}
