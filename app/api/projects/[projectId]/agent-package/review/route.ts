import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateAgentPackageDocument } from "@/lib/ai/agent-package";
import type {
  AgentPackageDocument,
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  AgentPackageUpstreamContext,
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

    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .select("id, content, status")
      .eq("project_id", projectId)
      .eq("document_type", "agent_package")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "No agent package document found to review." },
        { status: 404 },
      );
    }

    if (doc.status === "approved") {
      return NextResponse.json(
        { error: "Approved agent package cannot be reviewed again." },
        { status: 409 },
      );
    }

    const packageDoc = doc.content as AgentPackageDocument;

    const loadLatest = (documentType: string) =>
      supabase
        .from("project_documents")
        .select("content")
        .eq("project_id", projectId)
        .eq("document_type", documentType)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const [reqResult, archResult, erdResult, dfdResult, flowchartResult, blueprintResult] =
      await Promise.all([
        loadLatest("requirements"),
        loadLatest("architecture"),
        loadLatest("erd"),
        loadLatest("dfd"),
        loadLatest("flowchart"),
        loadLatest("blueprint"),
      ]);

    if (!reqResult.data || !archResult.data || !erdResult.data || !dfdResult.data || !flowchartResult.data || !blueprintResult.data) {
      return NextResponse.json(
        { error: "Missing approved upstream artifacts." },
        { status: 409 },
      );
    }

    const requirements = reqResult.data.content as RequirementsDraft;
    const architecture = archResult.data.content as ArchitectureDocument;
    const erd = erdResult.data.content as ERDDocument;
    const dfd = dfdResult.data.content as DFDDocument;
    const flowchart = flowchartResult.data.content as FlowchartDocument;
    const blueprint = blueprintResult.data.content as ImplementationBlueprint;

    const context: AgentPackageUpstreamContext = {
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
      blueprint,
    };

    const semanticCheck = validateAgentPackageDocument(packageDoc, context);
    if (!semanticCheck.valid) {
      return NextResponse.json(
        {
          error: "Agent Package failed deterministic validation. Cannot start review.",
          issues: semanticCheck.issues,
        },
        { status: 422 },
      );
    }

    const provider = new OpenRouterProvider();
    const reviewResult = await provider.generateAgentPackageReview({
      projectName: project.name,
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
      blueprint,
      packageDoc,
    });

    if (reviewResult.issues.some((i) => i.requires_user_decision)) {
      reviewResult.ready_for_approval = false;
    }

    const { data: updatedDoc, error: updateError } = await supabase
      .from("project_documents")
      .update({
        status: "review",
        review_data: reviewResult,
        decisions: [],
      })
      .eq("id", doc.id)
      .select("id, status, review_data, decisions")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase
      .from("projects")
      .update({
        status: "agent_package_review",
      })
      .eq("id", projectId);

    console.log(`[AgentPackageReview] completed in ${Date.now() - t0}ms`);

    return NextResponse.json({ doc: updatedDoc });
  } catch (error) {
    console.error(`[AgentPackageReview] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout =
      message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
