import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import type { RequirementsDraft } from "@/lib/ai/types";

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

    // Fetch the latest draft document
    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .select("id, content, status")
      .eq("project_id", projectId)
      .eq("document_type", "requirements")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "No requirements draft found." },
        { status: 404 },
      );
    }

    if (doc.status === "approved") {
      return NextResponse.json(
        { error: "Requirements are already approved." },
        { status: 409 },
      );
    }

    const provider = new OpenRouterProvider();
    const review = await provider.generateRequirementsReview({
      projectName: project.name,
      draft: doc.content as RequirementsDraft,
    });

    console.log(`[Review] completed in ${Date.now() - t0}ms`);

    // Persist review result in the document
    await supabase
      .from("project_documents")
      .update({
        review_data: review,
        status: "review",
      })
      .eq("id", doc.id);

    return NextResponse.json({
      doc_id: doc.id,
      review,
    });
  } catch (error) {
    console.error(`[Review] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
