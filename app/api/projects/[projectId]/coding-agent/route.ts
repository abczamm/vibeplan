import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  // Enforce project membership check via RLS or explicit query
  const { data: member, error: memberError } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userData.user.id)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create session
  const body = await request.json();
  // In a real app we would validate source document IDs here
  // against the approved status in the DB

  const { data, error } = await supabase
    .from("coding_agent_sessions")
    .insert({
      project_id: projectId,
      user_id: userData.user.id,
      source_document_ids: body.source_document_ids || {},
      status: "created"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  const { data, error } = await supabase
    .from("coding_agent_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
