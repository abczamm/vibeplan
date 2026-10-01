"use client";

import { useState, useEffect } from "react";

interface CodingAgentSession {
  id: string;
  status: string;

  tasks: { id: string; title: string; status: string; phase: string; attempt: number }[];
  events: { id: string; event_type: string; created_at: string }[];
}

export function CodingAgentViewer({ 
  projectId, 
  initialSession 
}: { 
  projectId: string; 
  initialSession: CodingAgentSession | null 
}) {
  const [session, setSession] = useState<CodingAgentSession | null>(initialSession);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<{ id: string; title: string; status: string; phase: string; attempt: number }[]>([]);
  const [events, setEvents] = useState<{ id: string; event_type: string; created_at: string }[]>([]);

  useEffect(() => {
    if (session?.id) {
      const fetchSession = async () => {
        if (!session?.id) return;
        try {
          const res = await fetch(`/api/projects/${projectId}/coding-agent/${session.id}`);
          if (res.ok) {
            const data = await res.json();
            setSession(data);
          }
        } catch (e) {
          console.error(e);
        }
      };

      const interval = setInterval(fetchSession, 5000);
      return () => clearInterval(interval);
    }
  }, [session?.id, projectId]);

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      if (!session) return;
      const res = await fetch(`/api/projects/${projectId}/coding-agent/${session.id}/${action}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/coding-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_document_ids: {
            agent_package_id: "ap1",
            design_system_id: "ds1",
            engineering_plan_id: "ep1"
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold mb-4">Coding Agent Execution</h2>
        <p className="text-slate-600 mb-8">
          The Coding Agent runs implementation tasks based on the approved Agent Package, Design System, and Engineering Plan.
        </p>
        <button className="btn btn-primary" onClick={createSession} disabled={loading}>
          Start Execution Session
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Execution Engine</h1>
        <div className="flex gap-2">
          <span className={session.status === "running" ? "badge badge-primary" : "badge badge-neutral"}>
            {session.status.toUpperCase()}
          </span>
          {session.status === "created" && (
            <button className="btn btn-primary btn-sm" onClick={() => handleAction("start")} disabled={loading}>Start</button>
          )}
          {session.status === "running" && (
            <button className="btn btn-outline btn-sm" onClick={() => handleAction("pause")} disabled={loading}>Pause</button>
          )}
          {session.status === "paused" && (
            <button className="btn btn-primary btn-sm" onClick={() => handleAction("resume")} disabled={loading}>Resume</button>
          )}
          {(session.status === "running" || session.status === "paused" || session.status === "created") && (
            <button className="btn btn-destructive btn-sm text-red-500 border border-red-500" onClick={() => handleAction("cancel")} disabled={loading}>Cancel</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 border rounded-lg p-6 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold mb-4">Task Queue</h2>
          <div>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks in queue. The agent will read the Engineering Plan.</p>
            ) : (
              <ul className="space-y-4">
                {tasks.map((task) => (
                  <li key={task.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <span className="badge badge-neutral">{task.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex gap-4">
                      <span>Phase: {task.phase}</span>
                      <span>Attempt: {task.attempt}/3</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="border rounded-lg p-6 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold mb-4">Event Log</h2>
          <div>
            {events.length === 0 ? (
              <p className="text-sm text-slate-500">No events yet.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((event) => (
                  <li key={event.id} className="text-sm border-l-2 pl-2 pb-2">
                    <div className="font-medium">{event.event_type}</div>
                    <div className="text-xs text-slate-400">{new Date(event.created_at).toLocaleTimeString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
