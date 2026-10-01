"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DiscoveryState,
  DiscoveryInteraction,
  InteractionOption,
  RequirementsDraft,
} from "@/lib/ai/types";

type Phase =
  | "initial"
  | "clarifying"
  | "synthesis"
  | "approval"
  | "completed";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  projectId: string;
  projectName: string;
  initialMessages: Message[];
  initialState: DiscoveryState;
  initialPhase: Phase;
  initialRequirementsDraft: RequirementsDraft | null;
  initialInteraction: DiscoveryInteraction | null;
};

const PHASE_LABELS: Record<Phase, string> = {
  initial: "Initial",
  clarifying: "Clarifying",
  synthesis: "Synthesis",
  approval: "Approval",
  completed: "Completed",
};

const STATE_FIELDS: { key: keyof DiscoveryState; label: string }[] = [
  { key: "idea", label: "Idea" },
  { key: "target_users", label: "Target Users" },
  { key: "goals", label: "Goals" },
  { key: "features", label: "Features" },
  { key: "roles", label: "Roles" },
  { key: "business_rules", label: "Business Rules" },
  { key: "constraints", label: "Constraints" },
  { key: "integrations", label: "Integrations" },
  { key: "technical_preferences", label: "Technical Preferences" },
  { key: "security_requirements", label: "Security Requirements" },
];

const DRAFT_SECTIONS: {
  key: keyof RequirementsDraft;
  label: string;
}[] = [
  { key: "overview", label: "Overview" },
  { key: "users_and_roles", label: "Users & Roles" },
  { key: "functional_requirements", label: "Functional Requirements" },
  { key: "business_rules", label: "Business Rules" },
  { key: "technical_requirements", label: "Technical Requirements" },
  { key: "security_requirements", label: "Security Requirements" },
  { key: "reporting_requirements", label: "Reporting" },
  { key: "constraints", label: "Constraints" },
  { key: "scope_in", label: "In Scope" },
  { key: "scope_out", label: "Out of Scope" },
];

const INTERACTION_MODE_LABELS: Record<
  DiscoveryInteraction["mode"],
  string
> = {
  question: "Question",
  recommendation: "AI Recommendation",
  choice: "Choose an option",
  confirmation: "Confirm",
  custom: "Custom requirement",
  review: "Review",
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

function RequirementsDraftPanel({ draft }: { draft: RequirementsDraft }) {
  return (
    <div className="req-draft">
      <div className="req-draft-header">
        <span className="req-draft-label">Requirements Draft</span>
        <span className="req-draft-status">Pending Review</span>
      </div>
      {DRAFT_SECTIONS.map(({ key, label }) => {
        const value = draft[key];
        const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
        return (
          <div key={key} className="req-section">
            <h3 className="req-section-title">{label}</h3>
            {isEmpty ? (
              <p className="req-section-empty">Not specified</p>
            ) : typeof value === "string" ? (
              <p className="req-section-text">{value}</p>
            ) : (
              <ul className="req-section-list">
                {(value as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DiscoveryInteractionCard({
  interaction,
  disabled,
  onSelectOption,
  onCustom,
  showCustomInput,
}: {
  interaction: DiscoveryInteraction;
  disabled: boolean;
  onSelectOption: (option: InteractionOption) => void;
  onCustom: () => void;
  showCustomInput: boolean;
}) {
  const { mode, options, allow_custom } = interaction;

  const hasOptions =
    options !== undefined && options !== null && options.length > 0;

  const showCard =
    mode === "choice" ||
    mode === "recommendation" ||
    mode === "confirmation" ||
    mode === "review" ||
    (mode === "custom" && !showCustomInput);

  if (!showCard && !hasOptions) return null;

  const modeLabel = INTERACTION_MODE_LABELS[mode];
  const showModeLabel =
    mode === "choice" ||
    mode === "recommendation" ||
    mode === "confirmation";

  return (
    <div className="interaction-card" role="group" aria-label={modeLabel}>
      {showModeLabel && (
        <div className="interaction-card-header">
          <span className="interaction-mode-label">{modeLabel}</span>
        </div>
      )}

      {hasOptions && (
        <div className="interaction-options">
          {options!.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`interaction-option${opt.recommended ? " interaction-option-recommended" : ""}`}
              disabled={disabled}
              onClick={() => onSelectOption(opt)}
              aria-label={`Select: ${opt.label}${opt.recommended ? " (Recommended)" : ""}`}
            >
              <div className="interaction-option-top">
                <span className="interaction-option-label">{opt.label}</span>
                {opt.recommended && (
                  <span
                    className="interaction-option-badge"
                    aria-label="Recommended"
                  >
                    Recommended
                  </span>
                )}
              </div>
              {opt.description && (
                <span className="interaction-option-desc">
                  {opt.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {allow_custom && !showCustomInput && (
        <button
          type="button"
          className="interaction-custom-btn"
          disabled={disabled}
          onClick={onCustom}
        >
          Custom requirement
        </button>
      )}
    </div>
  );
}

export function DiscoveryChat({
  projectId,
  projectName,
  initialMessages,
  initialState,
  initialPhase,
  initialRequirementsDraft,
  initialInteraction,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [state, setState] = useState<DiscoveryState>(initialState);
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [requirementsDraft, setRequirementsDraft] =
    useState<RequirementsDraft | null>(initialRequirementsDraft);
  const [currentInteraction, setCurrentInteraction] =
    useState<DiscoveryInteraction | null>(initialInteraction);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isApproval = phase === "approval";
  const isCompleted = phase === "completed";
  const inputDisabled = loading || isApproval || isCompleted;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, requirementsDraft, currentInteraction]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || inputDisabled) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowCustomInput(false);
    setCurrentInteraction(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/discovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : res.status === 401
              ? "Session expired. Please refresh and log in again."
              : res.status === 403
                ? "You do not have access to this project."
                : res.status === 404
                  ? "Project not found."
                  : res.status === 429
                    ? "Too many requests. Please wait a moment and try again."
                    : res.status === 504
                      ? "Request timed out. Please try again."
                      : "Something went wrong while contacting the Discovery Engine. Please try again.";
        setError(errMsg);
        return;
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("message" in data) ||
        !("phase" in data) ||
        !("state" in data)
      ) {
        setError(
          "Something went wrong while contacting the Discovery Engine. Please try again.",
        );
        return;
      }

      const typed = data as {
        message: string;
        phase: Phase;
        state: DiscoveryState;
        interaction: DiscoveryInteraction | null;
        requirements_draft: RequirementsDraft | null;
      };

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: typed.message,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setPhase(typed.phase);
      setState(typed.state);

      if (typed.interaction) {
        setCurrentInteraction(typed.interaction);
      }

      if (typed.requirements_draft) {
        setRequirementsDraft(typed.requirements_draft);
      }
    } catch {
      setError(
        "Something went wrong while contacting the Discovery Engine. Please try again.",
      );
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  async function handleSubmit() {
    await sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSelectOption(option: InteractionOption) {
    sendMessage(`Use option: ${option.label}`);
  }

  function handleCustom() {
    setShowCustomInput(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  const canSubmit = input.trim().length > 0 && !inputDisabled;

  const showInteractionCard =
    currentInteraction !== null &&
    !loading &&
    !isApproval &&
    !isCompleted;

  return (
    <div className="discovery-layout">
      {/* Header */}
      <header className="discovery-header">
        <div className="discovery-header-inner">
          <div>
            <span className="discovery-label">VibePlan Discovery</span>
            <h1 className="discovery-project-name">{projectName}</h1>
          </div>
          <span
            className={`discovery-phase-badge phase-${phase}`}
            aria-label={`Discovery phase: ${PHASE_LABELS[phase]}`}
          >
            {PHASE_LABELS[phase]}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="discovery-body">
        {/* Conversation + Input */}
        <div className="discovery-main">
          <div
            className="discovery-messages"
            aria-live="polite"
            aria-label="Discovery conversation"
          >
            {messages.length === 0 && !loading && (
              <div className="discovery-empty">
                <p className="discovery-empty-title">
                  Let&apos;s design your project.
                </p>
                <p className="discovery-empty-desc">
                  Tell VibePlan what you want to build. The AI will act as
                  your Project Architect — recommending decisions, presenting
                  options, and helping you document the right requirements.
                </p>
              </div>
            )}

            {messages.map((msg) =>
              msg.role === "user" ? (
                <div key={msg.id} className="msg-user-wrap">
                  <div className="msg-user">
                    <span className="msg-label msg-label-user">You</span>
                    <p className="msg-content">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="msg-assistant-wrap">
                  <div className="msg-assistant">
                    <span className="msg-label msg-label-assistant">
                      VibePlan AI
                    </span>
                    <p className="msg-content msg-content-pre">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="msg-assistant-wrap">
                <div className="msg-assistant">
                  <span className="msg-label msg-label-assistant">
                    VibePlan AI
                  </span>
                  <span
                    className="msg-loading"
                    aria-label="AI is thinking"
                  >
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="discovery-error" role="alert">
                {error}
              </div>
            )}

            {/* Structured interaction card */}
            {showInteractionCard && currentInteraction && (
              <DiscoveryInteractionCard
                interaction={currentInteraction}
                disabled={inputDisabled}
                onSelectOption={handleSelectOption}
                onCustom={handleCustom}
                showCustomInput={showCustomInput}
              />
            )}

            {/* Requirements Draft (approval phase) */}
            {isApproval && requirementsDraft && (
              <div className="approval-panel">
                <RequirementsDraftPanel draft={requirementsDraft} />
                <div className="approval-actions">
                  <button
                    type="button"
                    className="approval-btn approval-btn-approve"
                    disabled
                    title="Coming soon"
                  >
                    Approve Requirements
                  </button>
                  <button
                    type="button"
                    className="approval-btn approval-btn-changes"
                    disabled
                    title="Coming soon"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    className="approval-btn approval-btn-edit"
                    disabled
                    title="Coming soon"
                  >
                    Edit Requirements
                  </button>
                </div>
                <p className="approval-note">
                  Human review checkpoint — approve to proceed to
                  Architecture.
                </p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="discovery-input-area">
            {isApproval ? (
              <p className="discovery-approval-notice">
                Discovery complete. Review the requirements draft above.
              </p>
            ) : isCompleted ? (
              <p className="discovery-approval-notice">
                Discovery completed.
              </p>
            ) : (
              <>
                <label htmlFor="discovery-input" className="sr-only">
                  Message
                </label>
                <textarea
                  id="discovery-input"
                  ref={textareaRef}
                  className="discovery-textarea"
                  placeholder={
                    showCustomInput
                      ? "Describe your custom requirement..."
                      : "Type a message or respond to the AI..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={inputDisabled}
                  rows={3}
                />
                <button
                  type="button"
                  className="discovery-send-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  aria-label="Send message"
                >
                  {loading ? "Sending…" : "Send"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Context Panel */}
        <aside className="discovery-context" aria-label="Project context">
          <h2 className="discovery-context-title">Project Context</h2>
          <dl className="discovery-context-list">
            {STATE_FIELDS.map(({ key, label }) => {
              const value = state[key];
              const isEmpty = Array.isArray(value)
                ? value.length === 0
                : !value;
              return (
                <div key={key} className="discovery-context-item">
                  <dt className="discovery-context-key">{label}</dt>
                  <dd className="discovery-context-value">
                    {isEmpty ? (
                      <span className="discovery-context-empty">
                        Not defined yet
                      </span>
                    ) : Array.isArray(value) ? (
                      <ul className="discovery-context-list-items">
                        {value.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </aside>
      </div>

      <style>{`
        .discovery-layout {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          color: #111;
          background: #fff;
        }

        .discovery-header {
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 20px;
          flex-shrink: 0;
        }
        .discovery-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .discovery-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #666;
          font-weight: 600;
        }
        .discovery-project-name {
          margin: 2px 0 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.2;
          color: #111;
        }
        .discovery-phase-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid #d4d4d4;
          background: #f5f5f5;
          color: #444;
          white-space: nowrap;
        }
        .phase-completed { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }
        .phase-approval  { background:#fffbeb; border-color:#fde68a; color:#92400e; }
        .phase-synthesis { background:#eff6ff; border-color:#bfdbfe; color:#1e40af; }

        .discovery-body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .discovery-main {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          border-right: 1px solid #e5e5e5;
        }

        .discovery-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .discovery-empty { margin:auto; text-align:center; max-width:360px; padding:40px 0; color:#555; }
        .discovery-empty-title { font-size:16px; font-weight:600; margin:0 0 8px; color:#222; }
        .discovery-empty-desc { margin:0; line-height:1.6; }

        .msg-user-wrap { display:flex; justify-content:flex-end; }
        .msg-user { max-width:70%; background:#111; color:#fff; border-radius:8px 8px 2px 8px; padding:10px 14px; }
        .msg-assistant-wrap { display:flex; justify-content:flex-start; }
        .msg-assistant { max-width:75%; background:#f5f5f5; border:1px solid #e5e5e5; border-radius:2px 8px 8px 8px; padding:10px 14px; }
        .msg-label { display:block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px; }
        .msg-label-user { color:#aaa; }
        .msg-label-assistant { color:#666; }
        .msg-content { margin:0; line-height:1.6; word-break:break-word; }
        .msg-content-pre { white-space:pre-wrap; }

        .msg-loading { display:inline-flex; gap:4px; align-items:center; height:20px; }
        .msg-loading span { display:inline-block; width:6px; height:6px; border-radius:50%; background:#999; animation:blink 1.2s infinite; }
        .msg-loading span:nth-child(2) { animation-delay:0.2s; }
        .msg-loading span:nth-child(3) { animation-delay:0.4s; }
        @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }

        .discovery-error { padding:10px 14px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; color:#b91c1c; font-size:13px; }

        /* Interaction card */
        .interaction-card {
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
          background: #fafafa;
          max-width: 520px;
        }
        .interaction-card-header {
          padding: 8px 14px;
          border-bottom: 1px solid #e5e5e5;
          background: #f0f0f0;
        }
        .interaction-mode-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #555;
        }
        .interaction-options {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .interaction-option {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          min-height: 44px;
          padding: 10px 14px;
          text-align: left;
          background: #fff;
          border: none;
          border-bottom: 1px solid #ebebeb;
          cursor: pointer;
          transition: background 0.1s;
          outline: none;
        }
        .interaction-option:last-child { border-bottom: none; }
        .interaction-option:hover:not(:disabled) { background: #f5f5f5; }
        .interaction-option:focus-visible { box-shadow: inset 0 0 0 2px #111; }
        .interaction-option:disabled { cursor: not-allowed; opacity: 0.5; }
        .interaction-option-recommended {
          background: #f8faff;
          border-left: 3px solid #2563eb;
        }
        .interaction-option-recommended:hover:not(:disabled) { background: #eff4ff; }
        .interaction-option-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .interaction-option-label {
          font-size: 13px;
          font-weight: 600;
          color: #111;
        }
        .interaction-option-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border-radius: 4px;
          background: #dbeafe;
          color: #1d4ed8;
          white-space: nowrap;
        }
        .interaction-option-desc {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
        .interaction-custom-btn {
          display: block;
          width: 100%;
          padding: 9px 14px;
          text-align: left;
          background: transparent;
          border: none;
          border-top: 1px solid #e5e5e5;
          font-size: 12px;
          color: #555;
          cursor: pointer;
          outline: none;
          transition: background 0.1s;
        }
        .interaction-custom-btn:hover:not(:disabled) { background: #f0f0f0; color: #111; }
        .interaction-custom-btn:focus-visible { box-shadow: inset 0 0 0 2px #111; }
        .interaction-custom-btn:disabled { cursor: not-allowed; opacity: 0.5; }

        /* Approval panel */
        .approval-panel { display:flex; flex-direction:column; gap:16px; }

        /* Requirements draft */
        .req-draft { border:1px solid #e5e5e5; border-radius:8px; overflow:hidden; }
        .req-draft-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#fafafa; border-bottom:1px solid #e5e5e5; }
        .req-draft-label { font-size:13px; font-weight:700; color:#111; }
        .req-draft-status { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; padding:2px 8px; border-radius:4px; background:#fffbeb; border:1px solid #fde68a; color:#92400e; }
        .req-section { padding:12px 16px; border-bottom:1px solid #f0f0f0; }
        .req-section:last-child { border-bottom:none; }
        .req-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#888; margin:0 0 6px; }
        .req-section-text { margin:0; font-size:13px; line-height:1.6; color:#222; }
        .req-section-empty { margin:0; font-size:13px; color:#bbb; font-style:italic; }
        .req-section-list { margin:0; padding-left:18px; display:flex; flex-direction:column; gap:3px; font-size:13px; color:#222; line-height:1.5; }

        /* Approval actions */
        .approval-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .approval-btn { padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; cursor:not-allowed; border:1px solid #d4d4d4; background:#f5f5f5; color:#888; }
        .approval-btn-approve { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }
        .approval-btn-changes { background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
        .approval-btn-edit { background:#f5f5f5; border-color:#d4d4d4; color:#555; }
        .approval-note { margin:0; font-size:12px; color:#888; }

        /* Input area */
        .discovery-input-area { display:flex; gap:8px; padding:12px 16px; border-top:1px solid #e5e5e5; flex-shrink:0; background:#fff; align-items:flex-end; }
        .discovery-approval-notice { margin:0; font-size:13px; color:#666; font-style:italic; }
        .discovery-textarea { flex:1; resize:none; border:1px solid #d4d4d4; border-radius:6px; padding:8px 12px; font-size:14px; font-family:inherit; line-height:1.5; outline:none; color:#111; background:#fff; }
        .discovery-textarea:focus { border-color:#111; box-shadow:0 0 0 2px rgba(0,0,0,0.08); }
        .discovery-textarea:disabled { background:#f9f9f9; color:#888; }
        .discovery-send-btn { min-height:40px; padding:8px 18px; background:#111; color:#fff; border:none; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; white-space:nowrap; height:fit-content; outline:none; }
        .discovery-send-btn:focus-visible { box-shadow:0 0 0 3px rgba(0,0,0,0.25); }
        .discovery-send-btn:disabled { background:#d4d4d4; color:#888; cursor:not-allowed; }

        /* Context panel */
        .discovery-context { width:280px; flex-shrink:0; overflow-y:auto; padding:16px; background:#fafafa; }
        .discovery-context-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#666; margin:0 0 14px; }
        .discovery-context-list { margin:0; display:flex; flex-direction:column; gap:12px; }
        .discovery-context-item { border-bottom:1px solid #ebebeb; padding-bottom:12px; }
        .discovery-context-item:last-child { border-bottom:none; }
        .discovery-context-key { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#888; margin-bottom:4px; }
        .discovery-context-value { margin:0; font-size:13px; color:#222; line-height:1.5; }
        .discovery-context-empty { color:#bbb; font-style:italic; }
        .discovery-context-list-items { margin:0; padding-left:16px; display:flex; flex-direction:column; gap:2px; }

        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

        @media (max-width: 768px) {
          .discovery-body { flex-direction:column; overflow-y:auto; overflow-x:hidden; }
          .discovery-main { border-right:none; border-bottom:1px solid #e5e5e5; min-height:60vh; }
          .discovery-context { width:100%; border-top:1px solid #e5e5e5; }
          .discovery-layout { height:auto; max-height:none; overflow:visible; }
          .discovery-messages { min-height:300px; }
          .approval-actions { flex-direction:column; }
          .interaction-card { max-width:100%; }
        }
      `}</style>
    </div>
  );
}
