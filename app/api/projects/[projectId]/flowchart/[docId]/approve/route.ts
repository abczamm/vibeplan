import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateFlowchartDocument } from "@/lib/ai/flowchart";
import type {
  FlowchartDocument,
  FlowchartReview,
  FlowchartReviewDecision,
  FlowchartUpstreamContext,
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
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
        { error: "Only the project owner can approve the flowchart." },
        { status: 403 },
      );
    }

    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .select("id, content, status, review_data, decisions")
      .eq("id", docId)
      .eq("project_id", projectId)
      .eq("document_type", "flowchart")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Flowchart document not found." },
        { status: 404 },
      );
    }

    if (doc.status === "approved") {
      return NextResponse.json(
        { error: "Flowchart is already approved." },
        { status: 409 },
      );
    }

    const reviewData = doc.review_data as FlowchartReview | null;
    if (reviewData) {
      const decisions: FlowchartReviewDecision[] = Array.isArray(doc.decisions)
        ? (doc.decisions as FlowchartReviewDecision[])
        : [];
      const resolvedIds = new Set(decisions.map((d) => d.issue_id));
      const unresolved = reviewData.issues.filter(
        (i) => i.requires_user_decision && !resolvedIds.has(i.id),
      );
      if (unresolved.length > 0) {
        return NextResponse.json(
          {
            error: "Resolve all required decisions before approving.",
            unresolved_count: unresolved.length,
            unresolved_ids: unresolved.map((i) => i.id),
          },
          { status: 422 },
        );
      }
    }

    const loadApproved = (documentType: string) =>
      supabase
        .from("project_documents")
        .select("id, content")
        .eq("project_id", projectId)
        .eq("document_type", documentType)
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .not("approved_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const [reqResult, archResult, erdResult, dfdResult] = await Promise.all([
      loadApproved("requirements"),
      loadApproved("architecture"),
      loadApproved("erd"),
      loadApproved("dfd"),
    ]);

    if (!reqResult.data || !archResult.data || !erdResult.data || !dfdResult.data) {
      return NextResponse.json(
        { error: "All upstream documents (Requirements, Architecture, ERD, DFD) must be approved before approving the flowchart." },
        { status: 422 },
      );
    }

    const requirements = reqResult.data.content as RequirementsDraft;
    const architecture = archResult.data.content as ArchitectureDocument;
    const erd = erdResult.data.content as ERDDocument;
    const dfd = dfdResult.data.content as DFDDocument;

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

    const semanticCheck = validateFlowchartDocument(
      doc.content as FlowchartDocument,
      upstreamContext,
    );
    if (!semanticCheck.valid) {
      return NextResponse.json(
        {
          error: "Flowchart deterministic validation failed. Cannot approve an invalid flowchart.",
          issues: semanticCheck.issues.filter((i) => i.severity === "error"),
        },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();

    const { data: approvedDoc, error: approveError } = await supabase
      .from("project_documents")
      .update({
        status: "approved",
        approved_at: now,
        approved_by: user.id,
      })
      .eq("id", docId)
      .select("id, status, approved_at, approved_by")
      .single();

    if (approveError) {
      throw new Error(approveError.message);
    }

    await supabase
      .from("projects")
      .update({
        status: "flowchart_approved",
        current_phase: "flowchart",
      })
      .eq("id", projectId);

    console.log(`[Approve] Flowchart approved for project ${projectId}`);

    return NextResponse.json({ doc: approvedDoc });
  } catch (error) {
    console.error("[Flowchart Approve] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
