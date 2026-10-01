import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateFlowchartDocument } from "@/lib/ai/flowchart";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  FlowchartUpstreamContext,
} from "@/lib/ai/types";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const t0 = Date.now();
  try {
    const { projectId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const isOwner = project.owner_id === user.id;
    if (!isOwner) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!membership) {
        return NextResponse.json(
          { error: "You do not have access to this project." },
          { status: 403 },
        );
      }
    }

    const loadApproved = (documentType: string) =>
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", documentType)
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .not("approved_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const [reqResult, archResult, erdResult, dfdResult, flowchartResult] =
      await Promise.all([
        loadApproved("requirements"),
        loadApproved("architecture"),
        loadApproved("erd"),
        loadApproved("dfd"),
        supabase
          .from("project_documents")
          .select("id, content, status")
          .eq("project_id", projectId)
          .eq("document_type", "flowchart")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (!reqResult.data) {
      return NextResponse.json(
        { error: "No approved requirements document found." },
        { status: 409 },
      );
    }
    if (!archResult.data) {
      return NextResponse.json(
        { error: "No approved architecture document found." },
        { status: 409 },
      );
    }
    if (!erdResult.data) {
      return NextResponse.json(
        { error: "No approved ERD document found." },
        { status: 409 },
      );
    }
    if (!dfdResult.data) {
      return NextResponse.json(
        { error: "No approved DFD document found." },
        { status: 409 },
      );
    }

    const flowchartDoc = flowchartResult.data;
    if (!flowchartDoc) {
      return NextResponse.json(
        { error: "No flowchart draft found." },
        { status: 404 },
      );
    }

    if (flowchartDoc.status === "approved") {
      return NextResponse.json(
        { error: "Flowchart is already approved. Cannot be reviewed again." },
        { status: 409 },
      );
    }

    const requirements = reqResult.data.content as RequirementsDraft;
    const architecture = archResult.data.content as ArchitectureDocument;
    const erd = erdResult.data.content as ERDDocument;
    const dfd = dfdResult.data.content as DFDDocument;
    const flowchart = flowchartDoc.content as FlowchartDocument;

    const upstreamContext: FlowchartUpstreamContext = {
      requirement_texts: [
        ...requirements.functional_requirements,
        ...requirements.business_rules,
        ...requirements.security_requirements,
        ...requirements.users_and_roles,
      ],
      architecture_module_ids: architecture.modules.map((m) => m.id),
      architecture_module_names: architecture.modules.map((m) => m.name),
      dfd_process_ids: dfd.level_1.nodes
        .filter((n) => n.type === "process")
        .map((n) => n.id),
      dfd_process_codes: dfd.level_1.nodes
        .filter((n) => n.type === "process")
        .map((n) => n.process_code ?? "")
        .filter((c) => c !== ""),
      dfd_process_names: dfd.level_1.nodes
        .filter((n) => n.type === "process")
        .map((n) => n.name),
      erd_entity_names: erd.entities.map((e) => e.name),
      erd_table_names: erd.entities.map((e) => e.table_name),
    };

    const deterministicCheck = validateFlowchartDocument(flowchart, upstreamContext);

    const provider = new OpenRouterProvider();
    const review = await provider.generateFlowchartReview({
      projectName: project.name,
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
    });

    console.log(`[FlowchartReview] completed in ${Date.now() - t0}ms`);

    await supabase
      .from("project_documents")
      .update({
        review_data: review,
        status: "review",
      })
      .eq("id", flowchartDoc.id);

    await supabase
      .from("projects")
      .update({
        status: "flowchart_review",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: flowchartDoc.id,
      review,
      deterministic_validation: deterministicCheck,
    });
  } catch (error) {
    console.error(`[FlowchartReview] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
