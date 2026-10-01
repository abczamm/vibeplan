import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RequirementsReview, ReviewDecision } from "@/lib/ai/types";

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

    // Only project owner can approve
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
        { error: "Only the project owner can approve requirements." },
        { status: 403 },
      );
    }

    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .select("id, content, status, review_data, decisions")
      .eq("id", docId)
      .eq("project_id", projectId)
      .eq("document_type", "requirements")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Requirements document not found." },
        { status: 404 },
      );
    }

    if (doc.status === "approved") {
      return NextResponse.json(
        { error: "Requirements are already approved." },
        { status: 409 },
      );
    }

    // Guard: if review exists, all requires_user_decision issues must be resolved
    const reviewData = doc.review_data as RequirementsReview | null;
    if (reviewData) {
      const decisions: ReviewDecision[] = Array.isArray(doc.decisions)
        ? (doc.decisions as ReviewDecision[])
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

    const now = new Date().toISOString();

    // Approve the document
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

    // Update project status to reflect requirements approval
    await supabase
      .from("projects")
      .update({
        status: "requirements_approved",
        current_phase: "requirements",
      })
      .eq("id", projectId);

    console.log(`[Approve] requirements approved for project ${projectId}`);

    return NextResponse.json({ doc: approvedDoc });
  } catch (error) {
    console.error("[Approve] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
