import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAgentPackageDocument } from "@/lib/ai/agent-package";
import type { 
  AgentPackageDocument, 
  AgentPackageReview, 
  AgentPackageReviewDecision,
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  AgentPackageUpstreamContext
} from "@/lib/ai/types";

type RouteContext = {
  params: Promise<{ projectId: string; docId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { projectId, docId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only the project owner can approve documents." },
        { status: 403 },
      );
    }

    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .select("id, content, status, review_data, decisions")
      .eq("id", docId)
      .eq("project_id", projectId)
      .eq("document_type", "agent_package")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Agent package document not found." },
        { status: 404 },
      );
    }

    if (doc.status === "approved") {
      return NextResponse.json(
        { error: "Document is already approved." },
        { status: 409 },
      );
    }

    if (doc.status !== "review") {
      return NextResponse.json(
        { error: "Document must be in review state before approval." },
        { status: 409 },
      );
    }

    const reviewData = doc.review_data as AgentPackageReview | null;
    const decisions = Array.isArray(doc.decisions)
      ? (doc.decisions as AgentPackageReviewDecision[])
      : [];

    if (!reviewData) {
      return NextResponse.json(
        { error: "No review data found." },
        { status: 409 },
      );
    }

    const resolvedIds = new Set(decisions.map((d) => d.issue_id));
    const unresolvedIssues = reviewData.issues.filter(
      (i) => i.requires_user_decision && !resolvedIds.has(i.id),
    );

    if (unresolvedIssues.length > 0) {
      return NextResponse.json(
        { error: "All required review issues must be resolved before approval." },
        { status: 409 },
      );
    }

    // Load upstream artifacts for semantic validation context
    const [reqResult, archResult, erdResult, dfdResult, flowchartResult, blueprintResult] = await Promise.all([
      supabase
        .from("project_documents")
        .select("content")
        .eq("project_id", projectId)
        .eq("document_type", "requirements")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("content")
        .eq("project_id", projectId)
        .eq("document_type", "architecture")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("content")
        .eq("project_id", projectId)
        .eq("document_type", "erd")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("content")
        .eq("project_id", projectId)
        .eq("document_type", "dfd")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("content")
        .eq("project_id", projectId)
        .eq("document_type", "flowchart")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("content")
        .eq("project_id", projectId)
        .eq("document_type", "blueprint")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!reqResult.data || !archResult.data || !erdResult.data || !dfdResult.data || !flowchartResult.data || !blueprintResult.data) {
      return NextResponse.json(
        { error: "Missing required approved upstream artifacts for validation." },
        { status: 409 },
      );
    }

    const context: AgentPackageUpstreamContext = {
      requirements: reqResult.data.content as RequirementsDraft,
      architecture: archResult.data.content as ArchitectureDocument,
      erd: erdResult.data.content as ERDDocument,
      dfd: dfdResult.data.content as DFDDocument,
      flowchart: flowchartResult.data.content as FlowchartDocument,
      blueprint: blueprintResult.data.content as ImplementationBlueprint,
    };

    const semanticCheck = validateAgentPackageDocument(
      doc.content as AgentPackageDocument,
      context,
    );
    if (!semanticCheck.valid) {
      return NextResponse.json(
        {
          error: "Agent Package failed deterministic validation.",
          issues: semanticCheck.issues,
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("project_documents")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq("id", docId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase
      .from("projects")
      .update({
        status: "agent_package_approved",
      })
      .eq("id", projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AgentPackage Approve] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
