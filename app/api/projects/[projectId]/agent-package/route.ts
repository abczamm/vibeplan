import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateAgentPackageDocument } from "@/lib/ai/agent-package";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  AgentPackageUpstreamContext,
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
      blueprintResult,
    ] = await Promise.all([
      loadLatest("agent_package"),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "requirements")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "architecture")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "erd")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "dfd")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "flowchart")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", "blueprint")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (existingResult.data) {
      return NextResponse.json(
        { error: "An agent package already exists for this project." },
        { status: 409 },
      );
    }

    const reqDoc = reqResult.data;
    const archDoc = archResult.data;
    const erdDoc = erdResult.data;
    const dfdDoc = dfdResult.data;
    const flowchartDoc = flowchartResult.data;
    const blueprintDoc = blueprintResult.data;

    if (!reqDoc || !archDoc || !erdDoc || !dfdDoc || !flowchartDoc || !blueprintDoc) {
      return NextResponse.json(
        { error: "Missing required approved upstream artifacts." },
        { status: 409 },
      );
    }

    const requirements = reqDoc.content as RequirementsDraft;
    const architecture = archDoc.content as ArchitectureDocument;
    const erd = erdDoc.content as ERDDocument;
    const dfd = dfdDoc.content as DFDDocument;
    const flowchart = flowchartDoc.content as FlowchartDocument;
    const blueprint = blueprintDoc.content as ImplementationBlueprint;

    const provider = new OpenRouterProvider();
    const packageDocument = await provider.generateAgentPackage({
      projectName: project.name,
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
      blueprint,
    });

    const upstreamContext: AgentPackageUpstreamContext = {
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
      blueprint,
    };

    const semanticCheck = validateAgentPackageDocument(
      packageDocument,
      upstreamContext,
    );
    if (!semanticCheck.valid) {
      const errors = semanticCheck.issues.filter((i) => i.severity === "error");
      console.error(
        "[Agent Package] Semantic validation failed:",
        errors.map((e) => e.description),
      );
      return NextResponse.json(
        {
          error:
            "AI generated an invalid agent package. Please try again. No package was saved.",
          issues: errors,
        },
        { status: 422 },
      );
    }

    packageDocument.source_of_truth = {
      requirements_document_id: reqDoc.id,
      architecture_document_id: archDoc.id,
      erd_document_id: erdDoc.id,
      dfd_document_id: dfdDoc.id,
      flowchart_document_id: flowchartDoc.id,
      blueprint_document_id: blueprintDoc.id,
    };

    packageDocument._metadata.source_document_ids = {
      requirements_id: reqDoc.id,
      architecture_id: archDoc.id,
      erd_id: erdDoc.id,
      dfd_id: dfdDoc.id,
      flowchart_id: flowchartDoc.id,
      blueprint_id: blueprintDoc.id,
    };

    console.log(`[Agent Package] generated in ${Date.now() - t0}ms`);

    const { data: newDoc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        document_type: "agent_package",
        status: "draft",
        content: packageDocument,
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
        status: "agent_package_draft",
        current_phase: "agent_package",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: newDoc.id,
      package: packageDocument,
      validation: semanticCheck.issues,
    });
  } catch (error) {
    console.error(`[Agent Package] error after ${Date.now() - t0}ms:`, error);
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
