import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../../lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; sessionId: string }> }
) {
  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const sessionId = resolvedParams.sessionId;
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  const { data, error } = await supabase
    .from("coding_agent_sessions")
    .update({ status: "running" })
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
