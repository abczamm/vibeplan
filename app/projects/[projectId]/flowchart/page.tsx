import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FlowchartViewer } from "./flowchart-viewer";
import type {
  ArchitectureDocument,
  DFDDocument,
  ERDDocument,
  FlowchartDocument,
  FlowchartReview,
  FlowchartReviewDecision,
  FlowchartUpstreamContext,
  RequirementsDraft,
} from "@/lib/ai/types";

type Props = {
  params: Promise<{ projectId: string }>;
};

function buildUpstreamContext(
  requirements: RequirementsDraft,
  architecture: ArchitectureDocument,
  erd: ERDDocument,
  dfd: DFDDocument,
): FlowchartUpstreamContext {
  const level1Processes = dfd.level_1.nodes.filter((n) => n.type === "process");
  return {
    requirement_texts: [
      ...requirements.functional_requirements,
      ...requirements.business_rules,
      ...requirements.security_requirements,
      ...requirements.users_and_roles,
    ],
    architecture_module_ids: architecture.modules.map((m) => m.id),
    architecture_module_names: architecture.modules.map((m) => m.name),
    dfd_process_ids: level1Processes.map((n) => n.id),
    dfd_process_codes: level1Processes
      .map((n) => n.process_code ?? "")
      .filter((c) => c !== ""),
    dfd_process_names: level1Processes.map((n) => n.name),
    erd_entity_names: erd.entities.map((e) => e.name),
    erd_table_names: erd.entities.map((e) => e.table_name),
  };
}

export default async function FlowchartPage({ params }: Props) {
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

  const [reqResult, archResult, erdResult, dfdResult, flowchartResult] =
    await Promise.all([
      loadLatest("requirements"),
      loadLatest("architecture"),
      loadLatest("erd"),
      loadLatest("dfd"),
      loadLatest("flowchart"),
    ]);

  const reqDoc = reqResult.data;
  const archDoc = archResult.data;
  const erdDoc = erdResult.data;
  const dfdDoc = dfdResult.data;
  const flowchartDoc = flowchartResult.data;

  const prerequisites = {
    requirements: reqDoc?.status === "approved",
    architecture: archDoc?.status === "approved",
    erd: erdDoc?.status === "approved",
    dfd: dfdDoc?.status === "approved",
  };

  const allPrerequisitesApproved =
    prerequisites.requirements &&
    prerequisites.architecture &&
    prerequisites.erd &&
    prerequisites.dfd;

  let validationContext: FlowchartUpstreamContext | null = null;
  if (
    allPrerequisitesApproved &&
    reqDoc &&
    archDoc &&
    erdDoc &&
    dfdDoc
  ) {
    validationContext = buildUpstreamContext(
      reqDoc.content as RequirementsDraft,
      archDoc.content as ArchitectureDocument,
      erdDoc.content as ERDDocument,
      dfdDoc.content as DFDDocument,
    );
  }

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <Link href={`/projects/${project.id}/dfd`}>DFD</Link>
        <span className="doc-bar-current" aria-current="page">
          Flowchart
        </span>
      </nav>

      <FlowchartViewer
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
        prerequisites={prerequisites}
        validationContext={validationContext}
        initialDoc={
          flowchartDoc
            ? {
                id: flowchartDoc.id as string,
                status: flowchartDoc.status as string,
                content: flowchartDoc.content as FlowchartDocument,
                created_at: flowchartDoc.created_at as string,
                review_data: (flowchartDoc.review_data as FlowchartReview) ?? null,
                decisions: (flowchartDoc.decisions as FlowchartReviewDecision[]) ?? [],
              }
            : null
        }
      />
    </>
  );
}
