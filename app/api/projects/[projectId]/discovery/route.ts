import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import {
  discoveryStateSchema,
  mergeDiscoveryState,
} from "@/lib/ai/discovery";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

const MAX_HISTORY_MESSAGES = 20;

// Trigger synthesis when the current phase is "synthesis"
function shouldRunSynthesis(phase: string | null): boolean {
  return phase === "synthesis";
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  const t0 = Date.now();
  const ms = (from: number) => `${Date.now() - from}ms`;

  try {
    const { projectId } = await params;

    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 },
      );
    }

    // --- auth ---
    const tAuth = Date.now();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log(`[Discovery] auth: ${ms(tAuth)}`);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    // --- project + session in parallel ---
    const tDb = Date.now();
    const [projectResult, sessionResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, description, owner_id")
        .eq("id", projectId)
        .single(),
      supabase
        .from("discovery_sessions")
        .select("id, state, phase, turn_count")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const { data: project, error: projectError } = projectResult;
    console.log(`[Discovery] db (project+session parallel): ${ms(tDb)}`);

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    }

    // --- authorization ---
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

    // --- session: create if missing ---
    let { data: session } = sessionResult;

    if (!session) {
      const initialState = discoveryStateSchema.parse({
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
      });

      const { data: newSession, error } = await supabase
        .from("discovery_sessions")
        .insert({
          project_id: projectId,
          state: initialState,
          phase: "initial",
          turn_count: 0,
        })
        .select("id, state, phase, turn_count")
        .single();

      if (error || !newSession) {
        throw new Error(
          error?.message ?? "Failed to create discovery session.",
        );
      }

      session = newSession;
    }

    const isSynthesis = shouldRunSynthesis(session.phase);

    if (isSynthesis) {
      console.log("[Discovery] synthesis started");
    }

    // --- fetch messages + insert user message in parallel ---
    const tMsgs = Date.now();
    const [messagesResult] = await Promise.all([
      supabase
        .from("discovery_messages")
        .select("role, content")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true }),
      supabase.from("discovery_messages").insert({
        session_id: session.id,
        role: "user",
        content: message,
      }),
    ]);

    const { data: previousMessages, error: messagesError } =
      messagesResult;
    console.log(
      `[Discovery] db (messages+insert parallel): ${ms(tMsgs)}`,
    );

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    const currentState = discoveryStateSchema.parse(
      session.state ?? {},
    );

    const historyMessages = (previousMessages ?? [])
      .slice(-MAX_HISTORY_MESSAGES)
      .map((item) => ({
        role:
          item.role === "assistant"
            ? ("assistant" as const)
            : ("user" as const),
        content: item.content,
      }));

    // --- OpenRouter AI call ---
    const tAi = Date.now();
    const provider = new OpenRouterProvider();

    const aiResponse = await provider.generateDiscoveryResponse({
      projectName: project.name,
      projectDescription: project.description,
      state: currentState,
      messages: [
        ...historyMessages,
        { role: "user", content: message },
      ],
      isSynthesis,
    });
    console.log(`[Discovery] openrouter: ${ms(tAi)}`);

    if (isSynthesis) {
      console.log("[Discovery] synthesis response received");
    }

    // --- merge state ---
    const tValidation = Date.now();
    const updatedState = mergeDiscoveryState(
      currentState,
      aiResponse.state_updates,
    );
    console.log(`[Discovery] validation+merge: ${ms(tValidation)}`);

    // --- persist: assistant message + session update (parallel) ---
    const tWrite = Date.now();
    const insertAssistant = supabase
      .from("discovery_messages")
      .insert({
        session_id: session.id,
        role: "assistant",
        content: aiResponse.assistant_message,
        metadata: {
          next_question: aiResponse.next_question,
          phase: aiResponse.phase,
          interaction: aiResponse.interaction,
        },
      });

    const updateSession = supabase
      .from("discovery_sessions")
      .update({
        state: updatedState,
        phase: aiResponse.phase,
        current_question: aiResponse.next_question,
        turn_count: (session.turn_count ?? 0) + 1,
      })
      .eq("id", session.id);

    // Save requirements draft to project_documents when synthesis completes
    const saveDoc =
      isSynthesis &&
      aiResponse.requirements_draft &&
      aiResponse.phase === "approval"
        ? supabase.from("project_documents").insert({
            project_id: projectId,
            document_type: "requirements",
            status: "draft",
            content: aiResponse.requirements_draft,
            created_by: user.id,
          })
        : Promise.resolve(null);

    const [, updateResult] = await Promise.all([
      insertAssistant,
      updateSession,
      saveDoc,
    ]);
    console.log(`[Discovery] db (write parallel): ${ms(tWrite)}`);

    if (updateResult && "error" in updateResult && updateResult.error) {
      throw new Error(
        (updateResult.error as { message: string }).message,
      );
    }

    if (isSynthesis && aiResponse.requirements_draft) {
      console.log("[Discovery] requirements draft persisted");
    }

    console.log(`[Discovery] total: ${ms(t0)}`);

    return NextResponse.json({
      message: aiResponse.assistant_message,
      next_question: aiResponse.next_question,
      phase: aiResponse.phase,
      state: updatedState,
      interaction: aiResponse.interaction,
      requirements_draft: aiResponse.requirements_draft ?? null,
    });
  } catch (error) {
    console.error(
      `[Discovery] error after ${Date.now() - t0}ms:`,
      error instanceof Error ? error.message : error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected server error.";

    const isTimeout =
      message.includes("timed out") || message.includes("timeout");

    return NextResponse.json(
      {
        error: isTimeout
          ? "Request timed out. Please try again."
          : message,
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
