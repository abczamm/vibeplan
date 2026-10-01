import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import type { RequirementsDraft, ArchitectureDocument } from "@/lib/ai/types";

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

    // Load Approved Requirements
    const { data: reqDoc } = await supabase
      .from("project_documents")
      .select("content, status")
      .eq("project_id", projectId)
      .eq("document_type", "requirements")
      .eq("status", "approved")
      .not("approved_at", "is", null)
      .not("approved_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reqDoc) {
      return NextResponse.json(
        { error: "No approved requirements document found." },
        { status: 409 },
      );
    }

    // Load Architecture Draft
    const { data: archDoc } = await supabase
      .from("project_documents")
      .select("id, content, status")
      .eq("project_id", projectId)
      .eq("document_type", "architecture")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!archDoc) {
      return NextResponse.json(
        { error: "No architecture draft found." },
        { status: 404 },
      );
    }

    if (archDoc.status === "approved") {
      return NextResponse.json(
        { error: "Architecture is already approved. Cannot be reviewed again." },
        { status: 409 },
      );
    }

    const provider = new OpenRouterProvider();
    const review = await provider.generateArchitectureReview({
      projectName: project.name,
      requirements: reqDoc.content as RequirementsDraft,
      architecture: archDoc.content as ArchitectureDocument,
    });

    console.log(`[ArchReview] completed in ${Date.now() - t0}ms`);

    // Persist review result in the architecture document
    await supabase
      .from("project_documents")
      .update({
        review_data: review,
        status: "review",
      })
      .eq("id", archDoc.id);

    // Also update project status to architecture_review if it was draft
    await supabase
      .from("projects")
      .update({
        status: "architecture_review",
        current_phase: "architecture",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: archDoc.id,
      review,
    });
  } catch (error) {
    console.error(`[ArchReview] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}