import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateImplementationBlueprint } from "@/lib/ai/blueprint";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  BlueprintUpstreamContext,
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

    const loadLatest = (documentType: string) =>
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", documentType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const [
      existingResult,
      reqResult,
      archResult,
      erdResult,
      dfdResult,
      flowchartResult,
    ] = await Promise.all([
      loadLatest("blueprint"),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "requirements")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .not("approved_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "architecture")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .not("approved_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "erd")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .not("approved_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "dfd")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .not("approved_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "flowchart")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .not("approved_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (existingResult.data) {
      return NextResponse.json(
        { error: "An implementation blueprint already exists for this project." },
        { status: 409 },
      );
    }

    const reqDoc = reqResult.data;
    const archDoc = archResult.data;
    const erdDoc = erdResult.data;
    const dfdDoc = dfdResult.data;
    const flowchartDoc = flowchartResult.data;

    if (!reqDoc) {
      return NextResponse.json(
        { error: "No approved requirements document found." },
        { status: 409 },
      );
    }

    if (!archDoc) {
      return NextResponse.json(
        { error: "No approved architecture document found." },
        { status: 409 },
      );
    }

    if (!erdDoc) {
      return NextResponse.json(
        { error: "No approved ERD document found." },
        { status: 409 },
      );
    }

    if (!dfdDoc) {
      return NextResponse.json(
        { error: "No approved DFD document found." },
        { status: 409 },
      );
    }

    if (!flowchartDoc) {
      return NextResponse.json(
        { error: "No approved Flowchart document found." },
        { status: 409 },
      );
    }

    const requirements = reqDoc.content as RequirementsDraft;
    const architecture = archDoc.content as ArchitectureDocument;
    const erd = erdDoc.content as ERDDocument;
    const dfd = dfdDoc.content as DFDDocument;
    const flowchart = flowchartDoc.content as FlowchartDocument;

    const provider = new OpenRouterProvider();
    const blueprintDocument = await provider.generateImplementationBlueprint({
      projectName: project.name,
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
    });

    const upstreamContext: BlueprintUpstreamContext = {
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
    };

    const semanticCheck = validateImplementationBlueprint(
      blueprintDocument,
      upstreamContext,
    );
    if (!semanticCheck.valid) {
      const errors = semanticCheck.issues.filter((i) => i.severity === "error");
      console.error(
        "[Blueprint] Semantic validation failed:",
        errors.map((e) => e.description),
      );
      return NextResponse.json(
        {
          error:
            "AI generated an invalid implementation blueprint. Please try again. No blueprint was saved.",
          issues: errors,
        },
        { status: 422 },
      );
    }

    blueprintDocument._metadata.upstream_artifact_ids = {
      requirements_id: reqDoc.id,
      architecture_id: archDoc.id,
      erd_id: erdDoc.id,
      dfd_id: dfdDoc.id,
      flowchart_id: flowchartDoc.id,
    };

    console.log(`[Blueprint] generated in ${Date.now() - t0}ms`);

    const { data: newDoc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        document_type: "blueprint",
        status: "draft",
        content: blueprintDocument,
        created_by: user.id,
      })
      .select("id, status")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    await supabase
      .from("projects")
      .update({
        status: "blueprint_draft",
        current_phase: "blueprint",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: newDoc.id,
      blueprint: blueprintDocument,
      validation: semanticCheck.issues,
    });
  } catch (error) {
    console.error(`[Blueprint] error after ${Date.now() - t0}ms:`, error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const isTimeout =
      message.includes("timed out") || message.includes("timeout");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
