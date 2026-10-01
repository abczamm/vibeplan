import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateERDDocument } from "@/lib/ai/erd";
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

    // Check for existing ERD document
    const { data: existingErd } = await supabase
      .from("project_documents")
      .select("id")
      .eq("project_id", projectId)
      .eq("document_type", "erd")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingErd) {
      return NextResponse.json(
        { error: "An ERD draft already exists for this project." },
        { status: 409 },
      );
    }

    // Load Approved Requirements
    const { data: reqDoc } = await supabase
      .from("project_documents")
      .select("id, content, status")
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
      .select("id, content, status")
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

    const provider = new OpenRouterProvider();
    const erdDocument = await provider.generateERD({
      projectName: project.name,
      requirements: reqDoc.content as RequirementsDraft,
      architecture: archDoc.content as ArchitectureDocument,
    });

    // Run semantic validation
    const semanticCheck = validateERDDocument(erdDocument);
    if (!semanticCheck.valid) {
      console.error("[ERD] Semantic validation failed:", semanticCheck.errors);
      return NextResponse.json(
        {
          error: "AI generated an invalid database schema. Please try again.",
          issues: semanticCheck.errors,
        },
        { status: 502 },
      );
    }

    // Embed source traceability metadata
    erdDocument._metadata = {
      source_requirements_document_id: reqDoc.id,
      source_architecture_document_id: archDoc.id,
    };

    console.log(`[ERD] generated in ${Date.now() - t0}ms`);

    // Persist ERD document
    const { data: newDoc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        document_type: "erd",
        status: "draft",
        content: erdDocument,
        created_by: user.id,
      })
      .select("id, status")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Update project phase/status
    await supabase
      .from("projects")
      .update({
        status: "erd_draft",
        current_phase: "erd",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: newDoc.id,
      erd: erdDocument,
    });
  } catch (error) {
    console.error(`[ERD] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
