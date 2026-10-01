"use client";

import { useState } from "react";
import type { 
  DFDDocument, 
  DFDNode, 
  DFDDataFlow, 
  DFDLevelDocument, 
  DFDReview,
  DFDReviewIssue,
  ReviewDecision,
  ReviewDecisionAction,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: DFDDocument;
  review_data: DFDReview | null;
  decisions: ReviewDecision[];
  approved_at: string | null;
  approved_by: string | null;
};

type Props = {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  erdApproved: boolean;
  initialDoc: DocState | null;
};

const NODE_ICONS: Record<DFDNode["type"], string> = {
  external_entity: "◻️",
  process: "◯",
  data_store: "⏸",
};

const NODE_LABELS: Record<DFDNode["type"], string> = {
  external_entity: "External Entity",
  process: "Process",
  data_store: "Data Store",
};

const SEVERITY_LABELS: Record<DFDReviewIssue["severity"], string> = {
  important: "Important",
  minor: "Minor",
};

const KIND_LABELS: Record<DFDReviewIssue["kind"], string> = {
  context_balance_issue: "Context Balance",
  level_1_balance_issue: "L1 Balance",
  missing_external_entity: "Missing External Entity",
  redundant_external_entity: "Redundant External Entity",
  process_input_output_issue: "Process I/O Issue",
  invalid_process: "Invalid Process",
  missing_data_flow: "Missing Data Flow",
  invalid_data_flow: "Invalid Data Flow",
  redundant_data_flow: "Redundant Data Flow",
  orphan_data_store: "Orphan Data Store",
  missing_data_store: "Missing Data Store",
  invalid_data_store: "Invalid Data Store",
  process_traceability_issue: "Process Traceability",
  data_store_traceability_issue: "Store Traceability",
  requirements_traceability_issue: "Requirements Traceability",
  architecture_traceability_issue: "Architecture Traceability",
  erd_traceability_issue: "ERD Traceability",
  system_boundary_issue: "System Boundary",
  level_1_decomposition_issue: "L1 Decomposition",
  process_numbering_issue: "Process Numbering",
  scope_creep: "Scope Creep",
  security_model_issue: "Security Issue",
  complexity_issue: "Complexity",
  recommended_improvement: "Suggestion",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "badge badge-approved"
      : status === "review"
        ? "badge badge-review"
        : "badge badge-draft";
  const label =
    status === "approved"
      ? "Approved"
      : status === "review"
        ? "Under Review"
        : "Draft";
  return <span className={cls}>{label}</span>;
}

function IssueCard({
  issue,
  decision,
  disabled,
  onDecide,
}: {
  issue: DFDReviewIssue;
  decision: ReviewDecision | undefined;
  disabled: boolean;
  onDecide: (
    issueId: string,
    action: ReviewDecisionAction,
    customText?: string,
  ) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const resolved = !!decision;

  return (
    <div
      className={`issue-card${issue.severity === "important" ? " issue-important" : " issue-minor"}${resolved ? " issue-resolved" : ""}`}
    >
      <div className="issue-header">
        <div className="issue-badges">
          <span
            className={`badge ${issue.severity === "important" ? "badge-important" : "badge-minor"}`}
          >
            {SEVERITY_LABELS[issue.severity]}
          </span>
          <span className="badge badge-kind">{KIND_LABELS[issue.kind]}</span>
        </div>
        {resolved && (
          <span className="issue-resolved-label">
            {decision!.action === "accept"
              ? "Accepted"
              : decision!.action === "reject"
                ? "Ignored"
                : "Custom decision"}
          </span>
        )}
      </div>

      <div className="issue-context-tags">
        {issue.node_id && <span className="issue-ctx-tag">Node: {issue.node_id}</span>}
        {issue.flow_id && <span className="issue-ctx-tag">Flow: {issue.flow_id}</span>}
        {issue.process_code && <span className="issue-ctx-tag">Process: {issue.process_code}</span>}
      </div>

      <h3 className="issue-title">{issue.title}</h3>
      <p className="issue-description">{issue.description}</p>
      
      {issue.evidence && (
        <div className="issue-evidence">
          <strong>Evidence:</strong> {issue.evidence}
        </div>
      )}

      <div className="issue-recommendation">
        <span className="issue-rec-label">Recommendation</span>
        <p className="issue-rec-text">{issue.recommendation}</p>
      </div>

      {!resolved && issue.requires_user_decision && (
        <div className="issue-actions">
          {!showCustom ? (
            <>
              <button
                type="button"
                className="issue-btn issue-btn-accept"
                disabled={disabled}
                onClick={() => onDecide(issue.id, "accept")}
              >
                Accept
              </button>
              <button
                type="button"
                className="issue-btn issue-btn-custom"
                disabled={disabled}
                onClick={() => setShowCustom(true)}
              >
                Custom decision
              </button>
              <button
                type="button"
                className="issue-btn issue-btn-reject"
                disabled={disabled}
                onClick={() => onDecide(issue.id, "reject")}
              >
                Ignore
              </button>
            </>
          ) : (
            <div className="issue-custom-wrap">
              <label htmlFor={`custom-${issue.id}`} className="issue-custom-label">
                Describe your decision:
              </label>
              <textarea
                id={`custom-${issue.id}`}
                className="issue-custom-textarea"
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Describe how you want to address this..."
              />
              <div className="issue-custom-actions">
                <button
                  type="button"
                  className="issue-btn issue-btn-accept"
                  disabled={disabled || !customText.trim()}
                  onClick={() => {
                    onDecide(issue.id, "custom", customText.trim());
                    setShowCustom(false);
                  }}
                >
                  Save decision
                </button>
                <button
                  type="button"
                  className="issue-btn issue-btn-reject"
                  onClick={() => setShowCustom(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!resolved && !issue.requires_user_decision && (
        <div className="issue-actions">
          <button
            type="button"
            className="issue-btn issue-btn-accept"
            disabled={disabled}
            onClick={() => onDecide(issue.id, "accept")}
          >
            Accept
          </button>
          <button
            type="button"
            className="issue-btn issue-btn-reject"
            disabled={disabled}
            onClick={() => onDecide(issue.id, "reject")}
          >
            Ignore
          </button>
        </div>
      )}

      {resolved && decision!.action === "custom" && decision!.custom_text && (
        <div className="issue-custom-decision">
          <span className="issue-rec-label">Your decision</span>
          <p className="issue-rec-text">{decision!.custom_text}</p>
        </div>
      )}
    </div>
  );
}

function DFDLevelView({
  levelDoc,
  title,
  subtitle,
}: {
  levelDoc: DFDLevelDocument;
  title: string;
  subtitle?: string;
}) {
  const getNode = (id: string) => levelDoc.nodes.find((n) => n.id === id);

  return (
    <div className="dfd-level">
      <div className="dfd-level-header">
        <h3 className="dfd-level-title">{title}</h3>
        {subtitle && <p className="dfd-level-subtitle">{subtitle}</p>}
      </div>

      <div className="dfd-split">
        <div className="dfd-split-col">
          <h4 className="dfd-sub-title">Nodes</h4>
          <div className="dfd-nodes">
            {levelDoc.nodes.map((n) => (
              <div key={n.id} className={`dfd-node dfd-node-${n.type}`}>
                <div className="dfd-node-top">
                  <span className="dfd-node-icon" title={NODE_LABELS[n.type]}>
                    {NODE_ICONS[n.type]}
                  </span>
                  <span className="dfd-node-name">
                    {n.process_code && <span className="dfd-node-code">{n.process_code}</span>}
                    {n.name}
                  </span>
                </div>
                {n.description && <div className="dfd-node-desc">{n.description}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="dfd-split-col">
          <h4 className="dfd-sub-title">Data Flows</h4>
          <div className="dfd-flows">
            {levelDoc.flows.map((f) => {
              const source = getNode(f.source_node_id);
              const target = getNode(f.target_node_id);
              return (
                <div key={f.id} className="dfd-flow">
                  <div className="dfd-flow-line">
                    <span className="dfd-flow-node">{source?.name ?? f.source_node_id}</span>
                    <span className="dfd-flow-arrow">→</span>
                    <span className="dfd-flow-label">{f.name}</span>
                    <span className="dfd-flow-arrow">→</span>
                    <span className="dfd-flow-node">{target?.name ?? f.target_node_id}</span>
                  </div>
                  {(f.description || f.data_elements) && (
                    <div className="dfd-flow-details">
                      {f.description && <p>{f.description}</p>}
                      {f.data_elements && f.data_elements.length > 0 && (
                        <div className="dfd-flow-elements">
                          Data: {f.data_elements.join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DFDViewer({
  projectId,
  projectName,
  isOwner,
  erdApproved,
  initialDoc,
}: Props) {
  const [doc, setDoc] = useState<DocState | null>(initialDoc);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"context" | "level_1" | "traceability" | "review">("context");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const isApproved = doc?.status === "approved";
  const hasReview = !!doc?.review_data;
  const review = doc?.review_data ?? null;
  const decisions = doc?.decisions ?? [];

  const resolvedIds = new Set(decisions.map((d) => d.issue_id));
  const requiredUnresolved =
    review?.issues.filter(
      (i) => i.requires_user_decision && !resolvedIds.has(i.id),
    ) ?? [];
  const canApprove =
    isOwner &&
    !!doc &&
    !isApproved &&
    hasReview &&
    requiredUnresolved.length === 0;

  const totalIssues = review?.issues.length ?? 0;
  const importantIssues =
    review?.issues.filter((i) => i.severity === "important").length ?? 0;
  const resolvedCount = decisions.length;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/dfd`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to generate DFD.");
        return;
      }
      const typed = data as { doc_id: string; dfd: DFDDocument };
      setDoc({
        id: typed.doc_id,
        status: "draft",
        content: typed.dfd,
        review_data: null,
        decisions: [],
        approved_at: null,
        approved_by: null,
      });
    } catch {
      setError("An unexpected error occurred during DFD generation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunReview() {
    if (!doc) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/dfd/review`,
        { method: "POST" },
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Review failed.");
        return;
      }
      const typed = data as { doc_id: string; review: DFDReview };
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              id: typed.doc_id,
              review_data: typed.review,
              status: "review",
            }
          : prev,
      );
      setActiveTab("review");
    } catch {
      setError("Failed to run AI review. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecide(
    issueId: string,
    action: ReviewDecisionAction,
    customText?: string,
  ) {
    if (!doc) return;
    setLoading(true);
    setError(null);
    const decision: ReviewDecision = {
      issue_id: issueId,
      action,
      custom_text: customText,
      resolved_at: new Date().toISOString(),
    };
    try {
      const res = await fetch(
        `/api/projects/${projectId}/dfd/${doc.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to save decision.");
        return;
      }
      const updated = (data as { doc: DocState }).doc;
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              decisions: updated.decisions ?? prev.decisions,
              review_data: updated.review_data ?? prev.review_data,
            }
          : prev,
      );
    } catch {
      setError("Failed to save decision. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!doc) return;
    setLoading(true);
    setError(null);
    setShowApproveConfirm(false);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/dfd/${doc.id}/approve`,
        { method: "POST" },
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Approval failed.");
        return;
      }
      const updated = (data as { doc: { status: string; approved_at: string; approved_by: string } }).doc;
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              approved_at: updated.approved_at,
              approved_by: updated.approved_by,
            }
          : prev,
      );
    } catch {
      setError("Approval failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!doc) {
    return (
      <div className="dfd-layout">
        <header className="dfd-header">
          <div className="dfd-header-inner">
            <div>
              <span className="dfd-label">Data Flow Diagram</span>
              <h1 className="dfd-project-name">{projectName}</h1>
            </div>
          </div>
        </header>

        <div className="dfd-empty">
          <p className="dfd-empty-title">No DFD draft yet.</p>
          {!erdApproved ? (
            <div className="dfd-notice-error">
              The ERD must be approved before generating the DFD.
            </div>
          ) : (
            <>
              <p className="dfd-empty-desc">
                Generate a structured Data Flow Diagram mapping business processes
                to architecture modules and database entities.
                This process takes 30-90 seconds.
              </p>
              <button
                type="button"
                className="dfd-btn-primary"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "Generating DFD..." : "Generate DFD"}
              </button>
            </>
          )}
          {error && <div className="dfd-error">{error}</div>}
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  const { content } = doc;

  return (
    <div className="dfd-layout">
      <header className="dfd-header">
        <div className="dfd-header-inner">
          <div>
            <span className="dfd-label">Data Flow Diagram</span>
            <h1 className="dfd-project-name">{projectName}</h1>
          </div>
          <div className="dfd-header-right">
            <StatusBadge status={doc.status} />
            {isApproved && doc.approved_at && (
              <span className="dfd-approved-date">
                Approved{" "}
                {new Date(doc.approved_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="dfd-toolbar">
        <div className="dfd-tabs">
          <button
            type="button"
            className={`dfd-tab${activeTab === "context" ? " dfd-tab-active" : ""}`}
            onClick={() => setActiveTab("context")}
          >
            Context Diagram
          </button>
          <button
            type="button"
            className={`dfd-tab${activeTab === "level_1" ? " dfd-tab-active" : ""}`}
            onClick={() => setActiveTab("level_1")}
          >
            Level 1
          </button>
          <button
            type="button"
            className={`dfd-tab${activeTab === "traceability" ? " dfd-tab-active" : ""}`}
            onClick={() => setActiveTab("traceability")}
          >
            Traceability
          </button>
          <button
            type="button"
            className={`dfd-tab${activeTab === "review" ? " dfd-tab-active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            AI Review
            {hasReview && totalIssues > 0 && (
              <span className={`dfd-tab-count${importantIssues > 0 ? " dfd-tab-count-important" : ""}`}>
                {totalIssues}
              </span>
            )}
          </button>
        </div>

        <div className="dfd-toolbar-actions">
          {!isApproved && !hasReview && (
            <button
              type="button"
              className="dfd-btn dfd-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Run AI Review"}
            </button>
          )}
          {!isApproved && hasReview && (
            <button
              type="button"
              className="dfd-btn dfd-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Re-run AI Review"}
            </button>
          )}
          {canApprove && !showApproveConfirm && (
            <button
              type="button"
              className="dfd-btn dfd-btn-approve"
              disabled={loading}
              onClick={() => setShowApproveConfirm(true)}
            >
              Approve DFD
            </button>
          )}
        </div>
      </div>

      {showApproveConfirm && (
        <div className="approve-confirm" role="dialog" aria-modal="true">
          <div className="approve-confirm-box">
            <h2 className="approve-confirm-title">Approve Data Flow Diagram?</h2>
            <p className="approve-confirm-desc">
              Approve this DFD as the authoritative data movement baseline?
            </p>
            <p className="approve-confirm-note">
              After approval, downstream artifacts (API design, flowcharts) will be generated.
              Approved documents cannot be edited.
            </p>
            <div className="approve-confirm-actions">
              <button
                type="button"
                className="dfd-btn dfd-btn-cancel"
                onClick={() => setShowApproveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dfd-btn dfd-btn-approve"
                disabled={loading}
                onClick={handleApprove}
              >
                Approve DFD
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="dfd-error" role="alert">
          {error}
        </div>
      )}

      {hasReview && !isApproved && requiredUnresolved.length > 0 && (
        <div className="dfd-warning" role="status">
          {requiredUnresolved.length} required decision{requiredUnresolved.length === 1 ? "" : "s"} must be resolved before approval.
        </div>
      )}

      <div className="dfd-body">
        {activeTab !== "review" && (
          <div className="dfd-container">
            {isApproved && (
              <div className="dfd-approved-banner">
                DFD Approved — this is the authoritative data flow baseline.
              </div>
            )}
            {!isApproved && (
              <div className="dfd-draft-notice">
                DRAFT — Review this model against the approved artifacts.
              </div>
            )}

            <section className="dfd-section">
              <h2 className="dfd-section-title">{content.title}</h2>
              <p className="dfd-text">{content.description}</p>
            </section>

            {activeTab === "context" && (
              <DFDLevelView
                levelDoc={content.context}
                title="Context Diagram (Level 0)"
                subtitle="Shows the system boundary, external entities, and major data flows."
              />
            )}

            {activeTab === "level_1" && (
              <DFDLevelView
                levelDoc={content.level_1}
                title="Level 1 DFD"
                subtitle="Decomposes the system into major business processes and data stores."
              />
            )}

            {activeTab === "traceability" && (
              <div className="dfd-traceability">
                <section className="dfd-section">
                  <h3 className="dfd-section-title">Process Mapping</h3>
                  <p className="dfd-text-small">
                    Maps Level 1 processes to approved requirements, architecture modules, and ERD entities.
                  </p>
                  <div className="dfd-grid">
                    {content.process_mapping.map((pm) => {
                      const processNode = content.level_1.nodes.find((n) => n.id === pm.dfd_process_id);
                      return (
                        <div key={pm.dfd_process_id} className="dfd-trace-card">
                          <h4 className="dfd-trace-title">
                            {processNode?.process_code ? `${processNode.process_code} ` : ""}
                            {processNode?.name ?? pm.dfd_process_id}
                          </h4>
                          <p className="dfd-trace-reason">{pm.reason}</p>

                          {pm.requirements && pm.requirements.length > 0 && (
                            <div className="dfd-trace-group">
                              <span className="dfd-trace-label">Requirements:</span>
                              <ul>
                                {pm.requirements.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pm.architecture_modules && pm.architecture_modules.length > 0 && (
                            <div className="dfd-trace-group">
                              <span className="dfd-trace-label">Architecture:</span>
                              <ul>
                                {pm.architecture_modules.map((a, i) => (
                                  <li key={i}>{a}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pm.erd_entities && pm.erd_entities.length > 0 && (
                            <div className="dfd-trace-group">
                              <span className="dfd-trace-label">ERD Entities:</span>
                              <div className="dfd-tags">
                                {pm.erd_entities.map((e, i) => (
                                  <span key={i} className="dfd-tag">{e}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="dfd-section" style={{ marginTop: 24 }}>
                  <h3 className="dfd-section-title">Data Store Mapping</h3>
                  <div className="dfd-table-wrap">
                    <table className="dfd-table">
                      <thead>
                        <tr>
                          <th>Data Store</th>
                          <th>ERD Entity</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.data_store_mapping.map((dsm) => {
                          const storeNode = content.level_1.nodes.find((n) => n.id === dsm.dfd_node_id);
                          return (
                            <tr key={dsm.dfd_node_id}>
                              <td><strong>{storeNode?.name ?? dsm.dfd_node_id}</strong></td>
                              <td><span className="dfd-tag">{dsm.erd_entity}</span></td>
                              <td className="dfd-text-small">{dsm.reason}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {content.assumptions && content.assumptions.length > 0 && (
              <section className="dfd-section dfd-assumptions">
                <h2 className="dfd-section-title">Modeling Assumptions</h2>
                <ul className="dfd-list">
                  {content.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab === "review" && (
          <div className="dfd-review-wrap">
            {!hasReview ? (
              <div className="dfd-no-review">
                <p>No AI Data Flow Diagram review has been run yet.</p>
                <button
                  type="button"
                  className="dfd-btn dfd-btn-review"
                  disabled={loading}
                  onClick={handleRunReview}
                >
                  {loading ? "Running review…" : "Run DFD Review"}
                </button>
              </div>
            ) : (
              <>
                <div className="review-summary-card">
                  <div className="review-summary-header">
                    <span className="review-summary-label">DFD Review Summary</span>
                    <div className="review-stats">
                      <span className="review-stat">
                        {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
                      </span>
                      {importantIssues > 0 && (
                        <span className="review-stat review-stat-important">
                          {importantIssues} important
                        </span>
                      )}
                      <span className="review-stat">
                        {resolvedCount} resolved
                      </span>
                    </div>
                  </div>
                  <p className="review-summary-text">{review!.summary}</p>
                  {review!.ready_for_approval && (
                    <div className="review-ready">
                      All required decisions resolved — ready for approval.
                    </div>
                  )}
                </div>

                {review!.issues.length === 0 ? (
                  <p className="review-no-issues">
                    No data flow issues found. The DFD validates cleanly.
                  </p>
                ) : (
                  <div className="review-issues">
                    {/* Important issues first */}
                    {review!.issues
                      .slice()
                      .sort((a, b) => {
                        if (a.severity === "important" && b.severity !== "important") return -1;
                        if (b.severity === "important" && a.severity !== "important") return 1;
                        return 0;
                      })
                      .map((issue) => (
                        <IssueCard
                          key={issue.id}
                          issue={issue}
                          decision={decisions.find(
                            (d) => d.issue_id === issue.id,
                          )}
                          disabled={loading || isApproved}
                          onDecide={handleDecide}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .dfd-layout {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    color: #111;
    background: #fafafa;
    padding-top: 32px;
  }

  .dfd-header {
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    padding: 16px 24px;
    flex-shrink: 0;
  }
  .dfd-header-inner {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dfd-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
    font-weight: 600;
  }
  .dfd-project-name {
    margin: 2px 0 0;
    font-size: 20px;
    font-weight: 700;
    color: #111;
  }
  .dfd-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dfd-approved-date {
    font-size: 12px;
    color: #666;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border: 1px solid currentColor;
  }
  .badge-draft { background: #fffbeb; border-color: #fde68a; color: #92400e; }
  .badge-review { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  .badge-approved { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
  .badge-important { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
  .badge-minor { background: #f5f5f5; border-color: #d4d4d4; color: #555; }
  .badge-kind { background: #f5f5f4; border-color: #d6d3d1; color: #57534e; }

  /* Toolbar */
  .dfd-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    border-bottom: 1px solid #e5e5e5;
    background: #fafafa;
    flex-wrap: wrap;
    gap: 12px;
  }
  .dfd-tabs {
    display: flex;
    gap: 4px;
  }
  .dfd-tab {
    padding: 6px 14px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    background: transparent;
    color: #555;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    outline: none;
    transition: background 0.1s;
  }
  .dfd-tab:hover { background: #f0f0f0; color: #111; }
  .dfd-tab:focus-visible { box-shadow: 0 0 0 2px #111; }
  .dfd-tab-active {
    background: #fff;
    border-color: #d4d4d4;
    color: #111;
    font-weight: 600;
  }
  .dfd-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    background: #e5e5e5;
    color: #555;
  }
  .dfd-tab-count-important { background: #fee2e2; color: #b91c1c; }

  .dfd-toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Buttons */
  .dfd-btn {
    padding: 7px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    outline: none;
    border: 1px solid #d4d4d4;
    background: #f5f5f5;
    color: #555;
    transition: background 0.1s;
  }
  .dfd-btn:focus-visible { box-shadow: 0 0 0 2px #111; }
  .dfd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .dfd-btn-review { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  .dfd-btn-review:hover:not(:disabled) { background: #dbeafe; }
  .dfd-btn-approve { background: #111; border-color: #111; color: #fff; }
  .dfd-btn-approve:hover:not(:disabled) { background: #333; }
  .dfd-btn-cancel { background: #f5f5f5; border-color: #d4d4d4; color: #555; }
  .dfd-btn-primary {
    padding: 10px 20px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .dfd-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

  /* Approve confirm overlay */
  .approve-confirm {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
  }
  .approve-confirm-box {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }
  .approve-confirm-title { font-size: 17px; font-weight: 700; margin: 0 0 10px; }
  .approve-confirm-desc { font-size: 14px; margin: 0 0 8px; font-weight: 500; }
  .approve-confirm-note { font-size: 13px; color: #666; margin: 0 0 16px; line-height: 1.5; }
  .approve-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }

  /* Error / warning */
  .dfd-error {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #b91c1c;
    font-size: 13px;
  }
  .dfd-warning {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
  }

  .dfd-body {
    flex: 1;
    padding: 32px 24px;
    overflow-y: auto;
  }
  .dfd-container {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .dfd-empty {
    max-width: 480px;
    margin: 80px auto;
    text-align: center;
    padding: 24px;
  }
  .dfd-empty-title { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
  .dfd-empty-desc { color: #555; margin: 0 0 24px; line-height: 1.5; }
  .dfd-notice-error { padding: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 6px; font-weight: 500; }

  /* Draft */
  .dfd-approved-banner {
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    color: #166534;
    font-size: 13px;
    font-weight: 500;
  }
  .dfd-draft-notice {
    padding: 12px 16px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
  }

  .dfd-section {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 24px;
  }
  .dfd-assumptions { border-left: 3px solid #f59e0b; }
  .dfd-section-title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #444;
  }
  .dfd-text { margin: 0 0 12px; line-height: 1.6; color: #222; }
  .dfd-text-small { font-size: 13px; color: #666; margin-bottom: 16px; line-height: 1.5; }
  
  .dfd-level {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .dfd-level-header {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 16px 20px;
  }
  .dfd-level-title { margin: 0 0 4px; font-size: 16px; font-weight: 700; }
  .dfd-level-subtitle { margin: 0; font-size: 13px; color: #666; }

  .dfd-split {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 20px;
  }
  .dfd-split-col {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .dfd-sub-title {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #888;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 8px;
  }

  .dfd-nodes { display: flex; flex-direction: column; gap: 8px; }
  .dfd-node {
    padding: 10px 14px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    background: #fafafa;
  }
  .dfd-node-external_entity { border-left: 3px solid #6366f1; }
  .dfd-node-process { border-left: 3px solid #10b981; }
  .dfd-node-data_store { border-left: 3px solid #f59e0b; }
  
  .dfd-node-top { display: flex; align-items: center; gap: 8px; }
  .dfd-node-icon { font-size: 14px; }
  .dfd-node-name { font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; }
  .dfd-node-code { font-family: monospace; background: #e5e5e5; padding: 1px 4px; border-radius: 4px; font-size: 11px; }
  .dfd-node-desc { margin: 6px 0 0 22px; font-size: 12px; color: #555; }

  .dfd-flows { display: flex; flex-direction: column; gap: 12px; }
  .dfd-flow {
    padding: 10px 14px;
    border: 1px dashed #d4d4d4;
    border-radius: 6px;
    background: #fafafa;
  }
  .dfd-flow-line {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 13px;
  }
  .dfd-flow-node { font-weight: 600; background: #fff; border: 1px solid #e5e5e5; padding: 2px 8px; border-radius: 4px; }
  .dfd-flow-arrow { color: #888; font-weight: bold; }
  .dfd-flow-label { font-family: monospace; color: #2563eb; font-weight: 600; }
  
  .dfd-flow-details { margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #555; }
  .dfd-flow-details p { margin: 0 0 4px; }
  .dfd-flow-elements { font-family: monospace; color: #444; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; }

  .dfd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .dfd-trace-card {
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 16px;
    background: #fafafa;
  }
  .dfd-trace-title { margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #111; }
  .dfd-trace-reason { margin: 0 0 12px; font-size: 13px; color: #555; line-height: 1.5; }
  
  .dfd-trace-group { margin-bottom: 12px; }
  .dfd-trace-group:last-child { margin-bottom: 0; }
  .dfd-trace-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; display: block; margin-bottom: 4px; }
  .dfd-trace-group ul { margin: 0; padding-left: 16px; font-size: 13px; color: #222; }

  .dfd-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .dfd-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; background: #e5e5e5; border-radius: 4px; color: #444; font-family: monospace; }

  .dfd-table-wrap { overflow-x: auto; border: 1px solid #e5e5e5; border-radius: 6px; }
  .dfd-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; background: #fff; }
  .dfd-table th { padding: 10px 14px; background: #f5f5f5; border-bottom: 1px solid #d4d4d4; font-weight: 600; color: #444; }
  .dfd-table td { padding: 10px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  .dfd-table tr:last-child td { border-bottom: none; }
  
  .dfd-list { margin: 0; padding-left: 20px; line-height: 1.6; color: #222; }

  /* Review */
  .dfd-review-wrap { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .dfd-no-review { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px 0; }

  .review-summary-card {
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
  }
  .review-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #e5e5e5;
    background: #f0f0f0;
  }
  .review-summary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #555; }
  .review-stats { display: flex; gap: 8px; align-items: center; }
  .review-stat { font-size: 12px; color: #666; }
  .review-stat-important { color: #b91c1c; font-weight: 600; }
  .review-summary-text { margin: 0; padding: 12px 14px; font-size: 13px; line-height: 1.6; color: #333; }
  .review-ready {
    margin: 0;
    padding: 8px 14px;
    background: #f0fdf4;
    border-top: 1px solid #bbf7d0;
    color: #166534;
    font-size: 12px;
    font-weight: 600;
  }
  .review-no-issues { color: #555; font-size: 13px; }

  .review-issues { display: flex; flex-direction: column; gap: 12px; }

  /* Issue card */
  .issue-card {
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .issue-important { border-left: 3px solid #ef4444; }
  .issue-minor { border-left: 3px solid #d4d4d4; }
  .issue-resolved { opacity: 0.7; }

  .issue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 14px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    flex-wrap: wrap;
  }
  .issue-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .issue-resolved-label { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.06em; }

  .issue-context-tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px 0; }
  .issue-ctx-tag { font-size: 11px; font-family: monospace; background: #e5e5e5; padding: 2px 6px; border-radius: 4px; color: #555; }

  .issue-title { font-size: 14px; font-weight: 600; margin: 0; padding: 10px 14px 4px; color: #111; }
  .issue-description { margin: 0; padding: 0 14px 10px; font-size: 13px; color: #444; line-height: 1.5; }
  .issue-evidence { margin: 0 14px 10px; font-size: 12px; color: #555; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; }

  .issue-recommendation {
    padding: 10px 14px;
    background: #f8faff;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
  }
  .issue-rec-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 4px; }
  .issue-rec-text { margin: 0; font-size: 13px; color: #1e3a5f; line-height: 1.5; }

  .issue-actions { display: flex; gap: 8px; padding: 10px 14px; flex-wrap: wrap; }
  .issue-btn {
    padding: 6px 12px;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    outline: none;
    border: 1px solid #d4d4d4;
    background: #f5f5f5;
    color: #555;
    transition: background 0.1s;
  }
  .issue-btn:focus-visible { box-shadow: 0 0 0 2px #111; }
  .issue-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .issue-btn-accept { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
  .issue-btn-accept:hover:not(:disabled) { background: #dcfce7; }
  .issue-btn-custom { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  .issue-btn-custom:hover:not(:disabled) { background: #dbeafe; }
  .issue-btn-reject { background: #f5f5f5; border-color: #d4d4d4; color: #888; }
  .issue-btn-reject:hover:not(:disabled) { background: #e5e5e5; }

  .issue-custom-wrap { width: 100%; display: flex; flex-direction: column; gap: 8px; }
  .issue-custom-label { font-size: 12px; font-weight: 600; color: #444; }
  .issue-custom-textarea {
    width: 100%;
    resize: vertical;
    border: 1px solid #d4d4d4;
    border-radius: 5px;
    padding: 7px 10px;
    font-size: 13px;
    font-family: inherit;
    line-height: 1.5;
    outline: none;
    color: #111;
    background: #fff;
    box-sizing: border-box;
  }
  .issue-custom-textarea:focus { border-color: #111; box-shadow: 0 0 0 2px rgba(0,0,0,0.08); }
  .issue-custom-actions { display: flex; gap: 8px; }

  .issue-custom-decision {
    padding: 10px 14px;
    background: #f0fdf4;
    border-top: 1px solid #bbf7d0;
  }

  @media (max-width: 768px) {
    .dfd-split { grid-template-columns: 1fr; }
    .dfd-toolbar { flex-direction: column; align-items: flex-start; }
    .approve-confirm-actions { flex-direction: column; }
  }
`;
