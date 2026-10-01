import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateDesignSystemDocument,
  evaluateDesignSystemApproval,
} from "@/lib/ai/design-system";
import type {
  DesignSystemDocument,
  DesignSystemReview,
  DesignSystemReviewDecision,
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  DesignSystemUpstreamContext,
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

    const isOwner = project.owner_id === user.id;
    if (!isOwner) {
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
      .eq("document_type", "design_system")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Design system document not found." },
        { status: 404 },
      );
    }

    const reviewData = (doc.review_data as DesignSystemReview | null) ?? null;
    const decisions = Array.isArray(doc.decisions)
      ? (doc.decisions as DesignSystemReviewDecision[])
      : [];

    const loadApproved = (documentType: string) =>
      supabase
        .from("project_documents")
        .select("id, content")
        .eq("project_id", projectId)
        .eq("document_type", documentType)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const [reqResult, archResult, erdResult, dfdResult, flowchartResult, blueprintResult] =
      await Promise.all([
        loadApproved("requirements"),
        loadApproved("architecture"),
        loadApproved("erd"),
        loadApproved("dfd"),
        loadApproved("flowchart"),
        loadApproved("blueprint"),
      ]);

    const upstreamsComplete = !!(
      reqResult.data &&
      archResult.data &&
      erdResult.data &&
      dfdResult.data &&
      flowchartResult.data &&
      blueprintResult.data
    );

    let validationValid = false;
    let sourceIdsMatch = false;

    if (upstreamsComplete) {
      const reqDoc = reqResult.data!;
      const archDoc = archResult.data!;
      const erdDoc = erdResult.data!;
      const dfdDoc = dfdResult.data!;
      const flowchartDoc = flowchartResult.data!;
      const blueprintDoc = blueprintResult.data!;

      const context: DesignSystemUpstreamContext = {
        requirements: reqDoc.content as RequirementsDraft,
        architecture: archDoc.content as ArchitectureDocument,
        erd: erdDoc.content as ERDDocument,
        dfd: dfdDoc.content as DFDDocument,
        flowchart: flowchartDoc.content as FlowchartDocument,
        blueprint: blueprintDoc.content as ImplementationBlueprint,
      };

      const designSystemDoc = doc.content as DesignSystemDocument;
      const semanticCheck = validateDesignSystemDocument(designSystemDoc, context);
      validationValid = semanticCheck.valid;

      const meta = designSystemDoc._metadata;
      sourceIdsMatch =
        meta.requirements_document_id === reqDoc.id &&
        meta.architecture_document_id === archDoc.id &&
        meta.erd_document_id === erdDoc.id &&
        meta.dfd_document_id === dfdDoc.id &&
        meta.flowchart_document_id === flowchartDoc.id &&
        meta.blueprint_document_id === blueprintDoc.id;

      if (!validationValid) {
        return NextResponse.json(
          {
            error: "Design System failed deterministic validation.",
            issues: semanticCheck.issues.filter((i) => i.severity === "error"),
          },
          { status: 409 },
        );
      }
    }

    const result = evaluateDesignSystemApproval({
      isOwner,
      status: doc.status,
      reviewData,
      decisions,
      validationValid,
      upstreamsComplete,
      sourceIdsMatch,
    });

    if (!result.approved) {
      return NextResponse.json(
        { error: result.reasons.join(" "), reasons: result.reasons },
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
        status: "design_system_approved",
      })
      .eq("id", projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DesignSystem Approve] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
