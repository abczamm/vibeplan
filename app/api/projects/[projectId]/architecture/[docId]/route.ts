import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewDecisionSchema } from "@/lib/ai/discovery";
import type { ArchitectureReview, ReviewDecision } from "@/lib/ai/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ projectId: string; docId: string }>;
};

const patchBodySchema = z.object({
  decision: reviewDecisionSchema,
});

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { projectId, docId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { decision } = parsed.data;

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
      .select("id, content, status, review_data, decisions")
      .eq("id", docId)
      .eq("project_id", projectId)
      .eq("document_type", "architecture")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Architecture document not found." },
        { status: 404 },
      );
    }

    if (doc.status === "approved") {
      return NextResponse.json(
        { error: "Approved architecture cannot be edited." },
        { status: 409 },
      );
    }

    const updates: Record<string, unknown> = {};

    const existing: ReviewDecision[] =
      Array.isArray(doc.decisions) ? (doc.decisions as ReviewDecision[]) : [];
    const withoutOld = existing.filter((d) => d.issue_id !== decision.issue_id);
    const newDecisions: ReviewDecision[] = [...withoutOld, decision];
    updates.decisions = newDecisions;

    // Check if all requires_user_decision issues are now resolved
    const reviewData = doc.review_data as ArchitectureReview | null;
    if (reviewData) {
      const resolvedIds = new Set(newDecisions.map((d) => d.issue_id));
      const allResolved = reviewData.issues
        .filter((i) => i.requires_user_decision)
        .every((i) => resolvedIds.has(i.id));
      if (allResolved) {
        updates.review_data = {
          ...reviewData,
          ready_for_approval: true,
        };
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("project_documents")
      .update(updates)
      .eq("id", docId)
      .select("id, status, review_data, decisions")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ doc: updated });
  } catch (error) {
    console.error("[Architecture PATCH] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
