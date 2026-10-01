import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirementsDraftSchema, reviewDecisionSchema } from "@/lib/ai/discovery";
import type { RequirementsDraft, RequirementsReview, ReviewDecision } from "@/lib/ai/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ projectId: string; docId: string }>;
};

const patchBodySchema = z.object({
  // Provide either a decision or a full content update (not both)
  decision: reviewDecisionSchema.optional(),
  content: requirementsDraftSchema.optional(),
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

    const { decision, content } = parsed.data;

    if (!decision && !content) {
      return NextResponse.json(
        { error: "Provide either decision or content." },
        { status: 400 },
      );
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
        { error: "Approved requirements cannot be edited." },
        { status: 409 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (decision) {
      const existing: ReviewDecision[] =
        Array.isArray(doc.decisions) ? (doc.decisions as ReviewDecision[]) : [];
      const withoutOld = existing.filter(
        (d) => d.issue_id !== decision.issue_id,
      );
      const newDecisions: ReviewDecision[] = [
        ...withoutOld,
        decision,
      ];
      updates.decisions = newDecisions;

      // If accepting recommendation and we have review_data, incorporate into content
      if (decision.action === "accept" || decision.action === "custom") {
        const reviewData = doc.review_data as RequirementsReview | null;
        const issue = reviewData?.issues?.find(
          (i) => i.id === decision.issue_id,
        );
        if (issue) {
          const currentContent = doc.content as RequirementsDraft;
          const text =
            decision.action === "custom" && decision.custom_text
              ? decision.custom_text
              : issue.recommendation;
          const section = issue.section;

          // Map section name to draft key
          const sectionMap: Record<string, keyof RequirementsDraft> = {
            "Functional Requirements": "functional_requirements",
            "Business Rules": "business_rules",
            "Technical Requirements": "technical_requirements",
            "Security Requirements": "security_requirements",
            "Users & Roles": "users_and_roles",
            Reporting: "reporting_requirements",
            Constraints: "constraints",
            "In Scope": "scope_in",
            "Out of Scope": "scope_out",
          };
          const key = sectionMap[section];
          if (key && Array.isArray(currentContent[key])) {
            const arr = currentContent[key] as string[];
            if (!arr.includes(text)) {
              updates.content = {
                ...currentContent,
                [key]: [...arr, text],
              };
            }
          } else if (section === "Overview" && typeof currentContent.overview === "string") {
            // Append to overview only if not already there
            if (!currentContent.overview.includes(text)) {
              updates.content = {
                ...currentContent,
                overview: currentContent.overview + " " + text,
              };
            }
          }
        }
      }

      // Check if all requires_user_decision issues are now resolved
      const reviewData = doc.review_data as RequirementsReview | null;
      if (reviewData) {
        const decisionsAfter = updates.decisions as ReviewDecision[];
        const resolvedIds = new Set(decisionsAfter.map((d) => d.issue_id));
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
    }

    if (content) {
      updates.content = content;
    }

    const { data: updated, error: updateError } = await supabase
      .from("project_documents")
      .update(updates)
      .eq("id", docId)
      .select("id, content, status, review_data, decisions")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ doc: updated });
  } catch (error) {
    console.error("[Requirements PATCH] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
