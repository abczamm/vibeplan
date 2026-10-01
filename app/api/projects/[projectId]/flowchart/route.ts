import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateFlowchartDocument } from "@/lib/ai/flowchart";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartUpstreamContext,
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

    const [existingResult, reqResult, archResult, erdResult, dfdResult] =
      await Promise.all([
        loadLatest("flowchart"),
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
      ]);

    if (existingResult.data) {
      return NextResponse.json(
        { error: "A flowchart draft already exists for this project." },
        { status: 409 },
      );
    }

    const reqDoc = reqResult.data;
    const archDoc = archResult.data;
    const erdDoc = erdResult.data;
    const dfdDoc = dfdResult.data;

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

    const requirements = reqDoc.content as RequirementsDraft;
    const architecture = archDoc.content as ArchitectureDocument;
    const erd = erdDoc.content as ERDDocument;
    const dfd = dfdDoc.content as DFDDocument;

    const provider = new OpenRouterProvider();
    const flowchartDocument = await provider.generateFlowchart({
      projectName: project.name,
      requirements,
      architecture,
      erd,
      dfd,
    });

    const upstreamContext: FlowchartUpstreamContext = {
      requirement_texts: [
        ...requirements.functional_requirements,
        ...requirements.business_rules,
        ...requirements.security_requirements,
        ...requirements.users_and_roles,
      ],
      architecture_module_ids: architecture.modules.map((m) => m.id),
      architecture_module_names: architecture.modules.map((m) => m.name),
      dfd_process_ids: dfd.level_1.nodes
        .filter((n) => n.type === "process")
        .map((n) => n.id),
      dfd_process_codes: dfd.level_1.nodes
        .filter((n) => n.type === "process")
        .map((n) => n.process_code ?? "")
        .filter((c) => c !== ""),
      dfd_process_names: dfd.level_1.nodes
        .filter((n) => n.type === "process")
        .map((n) => n.name),
      erd_entity_names: erd.entities.map((e) => e.name),
      erd_table_names: erd.entities.map((e) => e.table_name),
    };

    const semanticCheck = validateFlowchartDocument(
      flowchartDocument,
      upstreamContext,
    );
    if (!semanticCheck.valid) {
      const errors = semanticCheck.issues.filter((i) => i.severity === "error");
      console.error(
        "[Flowchart] Semantic validation failed:",
        errors.map((e) => e.message),
      );
      return NextResponse.json(
        {
          error:
            "AI generated an invalid flowchart. Please try again. No flowchart was saved.",
          issues: errors,
        },
        { status: 422 },
      );
    }

    flowchartDocument._metadata = {
      source_requirements_document_id: reqDoc.id,
      source_architecture_document_id: archDoc.id,
      source_erd_document_id: erdDoc.id,
      source_dfd_document_id: dfdDoc.id,
    };

    console.log(`[Flowchart] generated in ${Date.now() - t0}ms`);

    const { data: newDoc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        document_type: "flowchart",
        status: "draft",
        content: flowchartDocument,
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
        status: "flowchart_draft",
        current_phase: "flowchart",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: newDoc.id,
      flowchart: flowchartDocument,
      validation: semanticCheck.issues,
    });
  } catch (error) {
    console.error(`[Flowchart] error after ${Date.now() - t0}ms:`, error);
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
