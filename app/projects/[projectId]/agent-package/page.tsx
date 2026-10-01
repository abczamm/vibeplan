import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentPackageViewer } from "./agent-package-viewer";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  AgentPackageDocument,
  AgentPackageReview,
  AgentPackageReviewDecision,
  AgentPackageUpstreamContext,
} from "@/lib/ai/types";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function AgentPackagePage({ params }: Props) {
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
      .select("id, content, status, created_at, approved_at, review_data, decisions")
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
    agentPackageResult,
  ] = await Promise.all([
    loadLatest("requirements"),
    loadLatest("architecture"),
    loadLatest("erd"),
    loadLatest("dfd"),
    loadLatest("flowchart"),
    loadLatest("blueprint"),
    loadLatest("agent_package"),
  ]);

  const reqDoc = reqResult.data;
  const archDoc = archResult.data;
  const erdDoc = erdResult.data;
  const dfdDoc = dfdResult.data;
  const flowchartDoc = flowchartResult.data;
  const blueprintDoc = blueprintResult.data;
  const packageDoc = agentPackageResult.data;

  const prerequisites = {
    requirements: reqDoc?.status === "approved",
    architecture: archDoc?.status === "approved",
    erd: erdDoc?.status === "approved",
    dfd: dfdDoc?.status === "approved",
    flowchart: flowchartDoc?.status === "approved",
    blueprint: blueprintDoc?.status === "approved",
  };

  const allPrerequisitesApproved =
    prerequisites.requirements &&
    prerequisites.architecture &&
    prerequisites.erd &&
    prerequisites.dfd &&
    prerequisites.flowchart &&
    prerequisites.blueprint;

  let validationContext: AgentPackageUpstreamContext | null = null;
  if (
    allPrerequisitesApproved &&
    reqDoc &&
    archDoc &&
    erdDoc &&
    dfdDoc &&
    flowchartDoc &&
    blueprintDoc
  ) {
    validationContext = {
      requirements: reqDoc.content as RequirementsDraft,
      architecture: archDoc.content as ArchitectureDocument,
      erd: erdDoc.content as ERDDocument,
      dfd: dfdDoc.content as DFDDocument,
      flowchart: flowchartDoc.content as FlowchartDocument,
      blueprint: blueprintDoc.content as ImplementationBlueprint,
    };
  }

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <Link href={`/projects/${project.id}/blueprint`}>Blueprint</Link>
        <span className="doc-bar-current" aria-current="page">
          Agent Package
        </span>
      </nav>

      <AgentPackageViewer
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
        prerequisites={prerequisites}
        validationContext={validationContext}
        initialDoc={
          packageDoc
            ? {
                id: packageDoc.id as string,
                status: packageDoc.status as string,
                content: packageDoc.content as AgentPackageDocument,
                created_at: packageDoc.created_at as string,
                approved_at: (packageDoc.approved_at as string | null) ?? null,
                review_data: (packageDoc.review_data as AgentPackageReview) ?? null,
                decisions: (packageDoc.decisions as AgentPackageReviewDecision[]) ?? [],
              }
            : null
        }
      />
    </>
  );
}
