import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlueprintViewer } from "./blueprint-viewer";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  BlueprintReview,
  BlueprintReviewDecision,
  BlueprintUpstreamContext,
} from "@/lib/ai/types";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function BlueprintPage({ params }: Props) {
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

  const loadLatest = (documentType: string) =>
    supabase
      .from("project_documents")
      .select("id, content, status, created_at, review_data, decisions")
      .eq("project_id", projectId)
      .eq("document_type", documentType)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  const [
    reqResult,
    archResult,
    erdResult,
    dfdResult,
    flowchartResult,
    blueprintResult,
  ] = await Promise.all([
    loadLatest("requirements"),
    loadLatest("architecture"),
    loadLatest("erd"),
    loadLatest("dfd"),
    loadLatest("flowchart"),
    loadLatest("blueprint"),
  ]);

  const reqDoc = reqResult.data;
  const archDoc = archResult.data;
  const erdDoc = erdResult.data;
  const dfdDoc = dfdResult.data;
  const flowchartDoc = flowchartResult.data;
  const blueprintDoc = blueprintResult.data;

  const prerequisites = {
    requirements: reqDoc?.status === "approved",
    architecture: archDoc?.status === "approved",
    erd: erdDoc?.status === "approved",
    dfd: dfdDoc?.status === "approved",
    flowchart: flowchartDoc?.status === "approved",
  };

  const allPrerequisitesApproved =
    prerequisites.requirements &&
    prerequisites.architecture &&
    prerequisites.erd &&
    prerequisites.dfd &&
    prerequisites.flowchart;

  let validationContext: BlueprintUpstreamContext | null = null;
  if (
    allPrerequisitesApproved &&
    reqDoc &&
    archDoc &&
    erdDoc &&
    dfdDoc &&
    flowchartDoc
  ) {
    validationContext = {
      requirements: reqDoc.content as RequirementsDraft,
      architecture: archDoc.content as ArchitectureDocument,
      erd: erdDoc.content as ERDDocument,
      dfd: dfdDoc.content as DFDDocument,
      flowchart: flowchartDoc.content as FlowchartDocument,
    };
  }

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <Link href={`/projects/${project.id}/flowchart`}>Flowchart</Link>
        <span className="doc-bar-current" aria-current="page">
          Blueprint
        </span>
      </nav>

      <BlueprintViewer
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
        prerequisites={prerequisites}
        validationContext={validationContext}
        initialDoc={
          blueprintDoc
            ? {
                id: blueprintDoc.id as string,
                status: blueprintDoc.status as string,
                content: blueprintDoc.content as ImplementationBlueprint,
                created_at: blueprintDoc.created_at as string,
                review_data: (blueprintDoc.review_data as BlueprintReview) ?? null,
                decisions: (blueprintDoc.decisions as BlueprintReviewDecision[]) ?? [],
              }
            : null
        }
      />
    </>
  );
}
