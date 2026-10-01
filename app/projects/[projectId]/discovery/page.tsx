import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DiscoveryChat } from "./discovery-chat";
import type {
  DiscoveryState,
  DiscoveryInteraction,
  RequirementsDraft,
} from "@/lib/ai/types";

type DiscoveryPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

type Phase =
  | "initial"
  | "clarifying"
  | "synthesis"
  | "approval"
  | "completed";

export default async function DiscoveryPage({
  params,
}: DiscoveryPageProps) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`id, name, description`)
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const { data: session } = await supabase
    .from("discovery_sessions")
    .select(`id, state, phase, current_question, turn_count`)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [rawMessagesResult, requirementsDocResult] = await Promise.all([
    session
      ? supabase
          .from("discovery_messages")
          .select(`id, role, content, metadata, created_at`)
          .eq("session_id", session.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("project_documents")
      .select("content")
      .eq("project_id", projectId)
      .eq("document_type", "requirements")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rawMessages = (
    rawMessagesResult.data as
      | {
          id: string;
          role: string;
          content: string;
          metadata: unknown;
        }[]
      | null
  ) ?? [];

  const messages = rawMessages.map((m) => ({
    id: m.id,
    role: (m.role === "user" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: m.content,
  }));

  // Restore last interaction from the last assistant message metadata
  const lastAssistantMeta = [...rawMessages]
    .reverse()
    .find((m) => m.role === "assistant")?.metadata;

  const initialInteraction: DiscoveryInteraction | null =
    lastAssistantMeta !== null &&
    typeof lastAssistantMeta === "object" &&
    lastAssistantMeta !== null &&
    "interaction" in (lastAssistantMeta as object)
      ? ((lastAssistantMeta as { interaction: DiscoveryInteraction })
          .interaction ?? null)
      : null;

  const defaultState: DiscoveryState = {
    idea: project.description ?? "",
    target_users: [],
    goals: [],
    features: [],
    roles: [],
    business_rules: [],
    constraints: [],
    integrations: [],
    technical_preferences: [],
    security_requirements: [],
  };

  const initialState: DiscoveryState =
    (session?.state as DiscoveryState | null) ?? defaultState;

  const initialPhase: Phase =
    (session?.phase as Phase | null) ?? "initial";

  const initialRequirementsDraft: RequirementsDraft | null =
    (requirementsDocResult.data?.content as RequirementsDraft | null) ??
    null;

  return (
    <>
      <nav className="doc-bar" aria-label="Breadcrumb">
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
        <span className="doc-bar-current" aria-current="page">
          Discovery
        </span>
      </nav>

      <DiscoveryChat
        projectId={project.id}
        projectName={project.name}
        initialMessages={messages}
        initialState={initialState}
        initialPhase={initialPhase}
        initialRequirementsDraft={initialRequirementsDraft}
        initialInteraction={initialInteraction}
      />
    </>
  );
}
