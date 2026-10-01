import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildAgentPackageExport,
  evaluateExportEligibility,
  validateAgentPackageExport,
} from "@/lib/ai/agent-package-export";
import { createAgentPackageZip, safeDownloadFileName } from "@/lib/ai/agent-package-zip";
import type {
  RequirementsDraft,
  ArchitectureDocument,
  ERDDocument,
  DFDDocument,
  FlowchartDocument,
  ImplementationBlueprint,
  AgentPackageUpstreamContext,
} from "@/lib/ai/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string; docId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { projectId, docId } = await params;
    const url = new URL(request.url);
    const wantManifest = url.searchParams.get("format") === "manifest";

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

    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .select("id, content, status, approved_at")
      .eq("id", docId)
      .eq("project_id", projectId)
      .eq("document_type", "agent_package")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Agent package document not found." },
        { status: 404 },
      );
    }

    if (doc.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved Agent Packages can be exported." },
        { status: 409 },
      );
    }

    const loadApproved = (documentType: string) =>
      supabase
        .from("project_documents")
        .select("id, content")
        .eq("project_id", projectId)
        .eq("document_type", documentType)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const [reqResult, archResult, erdResult, dfdResult, flowchartResult, blueprintResult] =
      await Promise.all([
        loadApproved("requirements"),
        loadApproved("architecture"),
        loadApproved("erd"),
        loadApproved("dfd"),
        loadApproved("flowchart"),
        loadApproved("blueprint"),
      ]);

    if (
      !reqResult.data ||
      !archResult.data ||
      !erdResult.data ||
      !dfdResult.data ||
      !flowchartResult.data ||
      !blueprintResult.data
    ) {
      return NextResponse.json(
        { error: "Missing required approved upstream source documents." },
        { status: 409 },
      );
    }

    const context: AgentPackageUpstreamContext = {
      requirements: reqResult.data.content as RequirementsDraft,
      architecture: archResult.data.content as ArchitectureDocument,
      erd: erdResult.data.content as ERDDocument,
      dfd: dfdResult.data.content as DFDDocument,
      flowchart: flowchartResult.data.content as FlowchartDocument,
      blueprint: blueprintResult.data.content as ImplementationBlueprint,
    };

    const eligibility = evaluateExportEligibility({
      status: doc.status,
      rawContent: doc.content,
      context,
      documentId: doc.id,
      expectedSourceDocumentIds: {
        requirements: reqResult.data.id,
        architecture: archResult.data.id,
        erd: erdResult.data.id,
        dfd: dfdResult.data.id,
        flowchart: flowchartResult.data.id,
        blueprint: blueprintResult.data.id,
      },
    });

    if (!eligibility.eligible || !eligibility.pkg) {
      return NextResponse.json(
        {
          error: "Agent Package is not eligible for export.",
          reasons: eligibility.reasons,
        },
        { status: 409 },
      );
    }

    const exp = buildAgentPackageExport({
      project_id: project.id,
      project_name: project.name,
      document_id: doc.id,
      exported_at: new Date().toISOString(),
      pkg: eligibility.pkg,
      upstream: context,
    });

    const validation = validateAgentPackageExport(exp);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Export failed structural validation. No package was produced.",
          issues: validation.issues,
        },
        { status: 500 },
      );
    }

    if (wantManifest) {
      return NextResponse.json(
        {
          manifest: exp.manifest,
          file_count: exp.files.length,
          approved_at: doc.approved_at,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const zipBuffer = await createAgentPackageZip(exp);
    const fileName = safeDownloadFileName(project.name);

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(zipBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[AgentPackageExport] error:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
