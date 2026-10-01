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

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { projectId } = await params;

    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        {
          error: "Message is too long.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const { data: project, error: projectError } =
      await supabase
        .from("projects")
        .select(`
          id,
          name,
          description
        `)
        .eq("id", projectId)
        .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        {
          status: 404,
        },
      );
    }

    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          error: "You do not have access to this project.",
        },
        {
          status: 403,
        },
      );
    }

    let { data: session } = await supabase
      .from("discovery_sessions")
      .select(`
        id,
        state,
        phase,
        turn_count
      `)
      .eq("project_id", projectId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

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
        .select(`
          id,
          state,
          phase,
          turn_count
        `)
        .single();

      if (error || !newSession) {
        throw new Error(
          error?.message ??
            "Failed to create discovery session.",
        );
      }

      session = newSession;
    }

    const { data: previousMessages, error: messagesError } =
      await supabase
        .from("discovery_messages")
        .select(`
          role,
          content
        `)
        .eq("session_id", session.id)
        .order("created_at", {
          ascending: true,
        });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    const currentState = discoveryStateSchema.parse(
      session.state ?? {},
    );

    await supabase.from("discovery_messages").insert({
      session_id: session.id,
      role: "user",
      content: message,
    });

    const provider = new OpenRouterProvider();

    const aiResponse =
      await provider.generateDiscoveryResponse({
        projectName: project.name,
        projectDescription: project.description,
        state: currentState,
        messages: [
          ...(previousMessages ?? []).map((item) => ({
            role:
              item.role === "assistant"
                ? ("assistant" as const)
                : ("user" as const),
            content: item.content,
          })),
          {
            role: "user",
            content: message,
          },
        ],
      });

    const updatedState = mergeDiscoveryState(
      currentState,
      aiResponse.state_updates,
    );

    await supabase.from("discovery_messages").insert({
      session_id: session.id,
      role: "assistant",
      content: aiResponse.assistant_message,
      metadata: {
        next_question: aiResponse.next_question,
        phase: aiResponse.phase,
      },
    });

    const { error: updateError } = await supabase
      .from("discovery_sessions")
      .update({
        state: updatedState,
        phase: aiResponse.phase,
        current_question: aiResponse.next_question,
        turn_count: (session.turn_count ?? 0) + 1,
      })
      .eq("id", session.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      message: aiResponse.assistant_message,
      next_question: aiResponse.next_question,
      phase: aiResponse.phase,
      state: updatedState,
    });
  } catch (error) {
    console.error("Discovery API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      },
    );
  }
}