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

    // Check for existing architecture document
    const { data: existingArch } = await supabase
      .from("project_documents")
      .select("id")
      .eq("project_id", projectId)
      .eq("document_type", "architecture")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingArch) {
      return NextResponse.json(
        { error: "Architecture draft already exists." },
        { status: 409 },
      );
    }

    // Fetch the latest approved requirements
    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .select("id, content, status, approved_at, approved_by")
      .eq("project_id", projectId)
      .eq("document_type", "requirements")
      .eq("status", "approved")
      .not("approved_at", "is", null)
      .not("approved_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "No approved requirements document found." },
        { status: 409 },
      );
    }

    const provider = new OpenRouterProvider();
    const architectureDocument = await provider.generateArchitecture({
      projectName: project.name,
      requirements: doc.content as RequirementsDraft,
    });

    console.log(`[Architecture] generated in ${Date.now() - t0}ms`);

    // Persist architecture document
    const { data: newDoc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        document_type: "architecture",
        status: "draft",
        content: architectureDocument,
        created_by: user.id,
      })
      .select("id, status")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Update project phase and status
    await supabase
      .from("projects")
      .update({
        status: "architecture_draft",
        current_phase: "architecture",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: newDoc.id,
      architecture: architectureDocument,
    });
  } catch (error) {
    console.error(`[Architecture] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
