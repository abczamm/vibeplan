import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateDFDDocument } from "@/lib/ai/dfd";
import type { RequirementsDraft, ArchitectureDocument, ERDDocument } from "@/lib/ai/types";

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

    // Check for existing DFD document
    const { data: existingDfd } = await supabase
      .from("project_documents")
      .select("id")
      .eq("project_id", projectId)
      .eq("document_type", "dfd")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDfd) {
      return NextResponse.json(
        { error: "A DFD draft already exists for this project." },
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

    // Load Approved ERD
    const { data: erdDoc } = await supabase
      .from("project_documents")
      .select("id, content, status")
      .eq("project_id", projectId)
      .eq("document_type", "erd")
      .eq("status", "approved")
      .not("approved_at", "is", null)
      .not("approved_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!erdDoc) {
      return NextResponse.json(
        { error: "No approved ERD document found." },
        { status: 409 },
      );
    }

    const provider = new OpenRouterProvider();
    const dfdDocument = await provider.generateDFD({
      projectName: project.name,
      requirements: reqDoc.content as RequirementsDraft,
      architecture: archDoc.content as ArchitectureDocument,
      erd: erdDoc.content as ERDDocument,
    });

    // Run semantic validation
    const semanticCheck = validateDFDDocument(dfdDocument);
    if (!semanticCheck.valid) {
      console.error("[DFD] Semantic validation failed:", semanticCheck.errors);
      return NextResponse.json(
        {
          error: "AI generated an invalid data flow diagram. Please try again.",
          issues: semanticCheck.errors,
        },
        { status: 422 },
      );
    }

    // Embed source traceability metadata
    dfdDocument._metadata = {
      source_requirements_document_id: reqDoc.id,
      source_architecture_document_id: archDoc.id,
      source_erd_document_id: erdDoc.id,
    };

    console.log(`[DFD] generated in ${Date.now() - t0}ms`);

    // Persist DFD document
    const { data: newDoc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        document_type: "dfd",
        status: "draft",
        content: dfdDocument,
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
        status: "dfd_draft",
        current_phase: "dfd",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: newDoc.id,
      dfd: dfdDocument,
    });
  } catch (error) {
    console.error(`[DFD] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
