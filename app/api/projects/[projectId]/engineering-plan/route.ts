import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { validateEngineeringPlanDocument } from "@/lib/ai/engineering-plan";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  AgentPackageDocument,
  DesignSystemDocument,
  EngineeringPlanUpstreamContext,
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

    const loadApproved = (documentType: string) =>
      supabase
        .from("project_documents")
        .select("id, content, status")
        .eq("project_id", projectId)
        .eq("document_type", documentType)
        .eq("status", "approved")
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
      agentPackageResult,
      designSystemResult,
    ] = await Promise.all([
      supabase
        .from("project_documents")
        .select("id")
        .eq("project_id", projectId)
        .eq("document_type", "engineering_plan")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      loadApproved("requirements"),
      loadApproved("architecture"),
      loadApproved("erd"),
      loadApproved("dfd"),
      loadApproved("flowchart"),
      loadApproved("blueprint"),
      loadApproved("agent_package"),
      loadApproved("design_system"),
    ]);

    if (existingResult.data) {
      return NextResponse.json(
        { error: "An engineering plan already exists for this project." },
        { status: 409 },
      );
    }

    const reqDoc = reqResult.data;
    const archDoc = archResult.data;
    const erdDoc = erdResult.data;
    const dfdDoc = dfdResult.data;
    const flowchartDoc = flowchartResult.data;
    const blueprintDoc = blueprintResult.data;
    const agentPackageDoc = agentPackageResult.data;
    const designSystemDoc = designSystemResult.data;

    if (
      !reqDoc ||
      !archDoc ||
      !erdDoc ||
      !dfdDoc ||
      !flowchartDoc ||
      !blueprintDoc ||
      !agentPackageDoc ||
      !designSystemDoc
    ) {
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
    const packageDoc = agentPackageDoc.content as AgentPackageDocument;
    const designSystem = designSystemDoc.content as DesignSystemDocument;

    const provider = new OpenRouterProvider();
    const engineeringPlanDocument = await provider.generateEngineeringPlan({
      projectName: project.name,
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
      blueprint,
      packageDoc,
      designSystemDoc: designSystem,
    });

    const upstreamContext: EngineeringPlanUpstreamContext = {
      requirements,
      architecture,
      erd,
      dfd,
      flowchart,
      blueprint,
      agentPackage: packageDoc,
      designSystem,
    };

    const semanticCheck = validateEngineeringPlanDocument(
      engineeringPlanDocument,
      upstreamContext,
    );
    if (!semanticCheck.valid) {
      const errors = semanticCheck.issues.filter((i) => i.severity === "error");
      console.error(
        "[Engineering Plan] Semantic validation failed:",
        errors.map((e) => e.description),
      );
      return NextResponse.json(
        {
          error:
            "AI generated an invalid engineering plan. Please try again. No document was saved.",
          issues: errors,
        },
        { status: 422 },
      );
    }

    // Server-controlled metadata is authoritative — never trust AI document IDs.
    engineeringPlanDocument._metadata = {
      source_of_truth: "engineering-plan",
      requirements_document_id: reqDoc.id,
      architecture_document_id: archDoc.id,
      erd_document_id: erdDoc.id,
      dfd_document_id: dfdDoc.id,
      flowchart_document_id: flowchartDoc.id,
      blueprint_document_id: blueprintDoc.id,
      agent_package_document_id: agentPackageDoc.id,
      design_system_document_id: designSystemDoc.id,
      generated_at: new Date().toISOString(),
    };

    console.log(`[Engineering Plan] generated in ${Date.now() - t0}ms`);

    const { data: newDoc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        document_type: "engineering_plan",
        status: "draft",
        content: engineeringPlanDocument,
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
        status: "engineering_plan_draft",
        current_phase: "engineering_plan",
      })
      .eq("id", projectId);

    return NextResponse.json({
      doc_id: newDoc.id,
      engineering_plan: engineeringPlanDocument,
      validation: semanticCheck.issues,
    });
  } catch (error) {
    console.error(`[Engineering Plan] error after ${Date.now() - t0}ms:`, error);
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
