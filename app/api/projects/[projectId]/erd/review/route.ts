import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
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

    // Load Approved Requirements
    const { data: reqDoc } = await supabase
      .from("project_documents")
      .select("content")
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

    // Load Approved Architecture
    const { data: archDoc } = await supabase
      .from("project_documents")
      .select("content")
      .eq("project_id", projectId)
      .eq("document_type", "architecture")
      .eq("status", "approved")
      .not("approved_at", "is", null)
      .not("approved_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!archDoc) {
      return NextResponse.json(
        { error: "No approved architecture document found." },
        { status: 409 },
      );
    }

    // Load ERD Draft
    const { data: erdDoc } = await supabase
      .from("project_documents")
      .select("id, content, status")
      .eq("project_id", projectId)
      .eq("document_type", "erd")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!erdDoc) {
      return NextResponse.json(
        { error: "No ERD draft found." },
        { status: 404 },
      );
    }

    if (erdDoc.status === "approved") {
      return NextResponse.json(
        { error: "ERD is already approved. Cannot be reviewed again." },
        { status: 409 },
      );
    }

    const provider = new OpenRouterProvider();
    const review = await provider.generateERDReview({
      projectName: project.name,
      requirements: reqDoc.content as RequirementsDraft,
      architecture: archDoc.content as ArchitectureDocument,
      erd: erdDoc.content as ERDDocument,
    });

    console.log(`[ERDReview] completed in ${Date.now() - t0}ms`);

    // Persist review result in the ERD document
    await supabase
      .from("project_documents")
      .update({
        review_data: review,
        status: "review",
      })
      .eq("id", erdDoc.id);

    // Also update project status to erd_review if it was draft
    await supabase
      .from("projects")
      .update({
        status: "erd_review",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: erdDoc.id,
      review,
    });
  } catch (error) {
    console.error(`[ERDReview] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
