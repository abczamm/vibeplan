import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { CodingAgentViewer } from "./coding-agent-viewer";

export default async function CodingAgentPage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    redirect("/login");
  }

  const { data: member } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userData.user.id)
    .single();

  if (!member) {
    redirect("/projects");
  }

  // Fetch the latest session
  const { data: sessions } = await supabase
    .from("coding_agent_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  const currentSession = sessions && sessions.length > 0 ? sessions[0] : null;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <CodingAgentViewer projectId={projectId} initialSession={currentSession} />
    </div>
  );
}
