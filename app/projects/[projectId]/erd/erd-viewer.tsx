"use client";

import { useState } from "react";
import type {
  ERDDocument,
  ERDReview,
  ERDReviewIssue,
  ReviewDecision,
  ReviewDecisionAction,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: ERDDocument;
  review_data: ERDReview | null;
  decisions: ReviewDecision[];
  approved_at: string | null;
  approved_by: string | null;
};

type Props = {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  architectureApproved: boolean;
  initialDoc: DocState | null;
};

const SEVERITY_LABELS: Record<ERDReviewIssue["severity"], string> = {
  important: "Important",
  minor: "Minor",
};

const KIND_LABELS: Record<ERDReviewIssue["kind"], string> = {
  normalization_issue: "Normalization",
  missing_foreign_key: "Missing FK",
  invalid_relationship: "Invalid Relation",
  missing_constraint: "Missing Constraint",
  missing_index: "Missing Index",
  redundant_entity: "Redundant Entity",
  redundant_column: "Redundant Column",
  inappropriate_data_type: "Data Type Issue",
  inappropriate_jsonb: "JSONB Overuse",
  primary_key_issue: "Primary Key Issue",
  business_rule_issue: "Business Rule Issue",
  historical_data_issue: "Historical Data Issue",
  security_model_issue: "Security Issue",
  naming_issue: "Naming Issue",
  traceability_issue: "Traceability Issue",
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
  issue: ERDReviewIssue;
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
        {issue.entity && <span className="issue-ctx-tag">Entity: {issue.entity}</span>}
        {issue.column && <span className="issue-ctx-tag">Column: {issue.column}</span>}
        {issue.relationship && <span className="issue-ctx-tag">Relation: {issue.relationship}</span>}
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

export function ERDViewer({
  projectId,
  projectName,
  isOwner,
  architectureApproved,
  initialDoc,
}: Props) {
  const [doc, setDoc] = useState<DocState | null>(initialDoc);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"draft" | "review">("draft");
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
      const res = await fetch(`/api/projects/${projectId}/erd`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to generate ERD.");
        return;
      }
      const typed = data as { doc_id: string; erd: ERDDocument };
      setDoc({
        id: typed.doc_id,
        status: "draft",
        content: typed.erd,
        review_data: null,
        decisions: [],
        approved_at: null,
        approved_by: null,
      });
    } catch {
      setError("An unexpected error occurred during ERD generation.");
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
        `/api/projects/${projectId}/erd/review`,
        { method: "POST" },
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Review failed.");
        return;
      }
      const typed = data as { doc_id: string; review: ERDReview };
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
        `/api/projects/${projectId}/erd/${doc.id}`,
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
        `/api/projects/${projectId}/erd/${doc.id}/approve`,
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
      <div className="erd-layout">
        <header className="erd-header">
          <div className="erd-header-inner">
            <div>
              <span className="erd-label">Database ERD</span>
              <h1 className="erd-project-name">{projectName}</h1>
            </div>
          </div>
        </header>

        <div className="erd-empty">
          <p className="erd-empty-title">No ERD draft yet.</p>
          {!architectureApproved ? (
            <div className="erd-notice-error">
              Architecture must be approved before generating the ERD.
            </div>
          ) : (
            <>
              <p className="erd-empty-desc">
                Generate a normalized PostgreSQL entity-relationship model based on the approved architecture.
                This process takes 30-90 seconds.
              </p>
              <button
                type="button"
                className="erd-btn-primary"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "Generating ERD..." : "Generate ERD"}
              </button>
            </>
          )}
          {error && <div className="erd-error">{error}</div>}
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  const { content } = doc;

  return (
    <div className="erd-layout">
      {/* Header */}
      <header className="erd-header">
        <div className="erd-header-inner">
          <div>
            <span className="erd-label">Database ERD</span>
            <h1 className="erd-project-name">{projectName}</h1>
          </div>
          <div className="erd-header-right">
            <StatusBadge status={doc.status} />
            {isApproved && doc.approved_at && (
              <span className="erd-approved-date">
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

      {/* Toolbar */}
      <div className="erd-toolbar">
        <div className="erd-tabs">
          <button
            type="button"
            className={`erd-tab${activeTab === "draft" ? " erd-tab-active" : ""}`}
            onClick={() => setActiveTab("draft")}
          >
            ERD Document
          </button>
          <button
            type="button"
            className={`erd-tab${activeTab === "review" ? " erd-tab-active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            AI Review
            {hasReview && totalIssues > 0 && (
              <span className={`erd-tab-count${importantIssues > 0 ? " erd-tab-count-important" : ""}`}>
                {totalIssues}
              </span>
            )}
          </button>
        </div>

        <div className="erd-toolbar-actions">
          {!isApproved && !hasReview && (
            <button
              type="button"
              className="erd-btn erd-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Run AI Review"}
            </button>
          )}
          {!isApproved && hasReview && (
            <button
              type="button"
              className="erd-btn erd-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Re-run AI Review"}
            </button>
          )}
          {canApprove && !showApproveConfirm && (
            <button
              type="button"
              className="erd-btn erd-btn-approve"
              disabled={loading}
              onClick={() => setShowApproveConfirm(true)}
            >
              Approve ERD
            </button>
          )}
        </div>
      </div>

      {/* Approval confirmation */}
      {showApproveConfirm && (
        <div className="approve-confirm" role="dialog" aria-modal="true">
          <div className="approve-confirm-box">
            <h2 className="approve-confirm-title">Approve ERD?</h2>
            <p className="approve-confirm-desc">
              Approve this database model as the project baseline?
            </p>
            <p className="approve-confirm-note">
              After approval, downstream database components will be modeled exactly against
              this version. Approved ERDs cannot be edited through the normal draft UI.
            </p>
            <div className="approve-confirm-actions">
              <button
                type="button"
                className="erd-btn erd-btn-cancel"
                onClick={() => setShowApproveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="erd-btn erd-btn-approve"
                disabled={loading}
                onClick={handleApprove}
              >
                Approve ERD
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="erd-error" role="alert">
          {error}
        </div>
      )}

      {hasReview && !isApproved && requiredUnresolved.length > 0 && (
        <div className="erd-warning" role="status">
          {requiredUnresolved.length} required decision{requiredUnresolved.length === 1 ? "" : "s"} must be resolved before approval.
        </div>
      )}

      <div className="erd-body">
        {activeTab === "draft" && (
          <div className="erd-container">
            {isApproved && (
              <div className="erd-approved-banner">
                ERD Approved — this is the authoritative database baseline.
              </div>
            )}
            {!isApproved && (
              <div className="erd-draft-notice">
                DRAFT — Review this model against the approved requirements and architecture.
              </div>
            )}

            <section className="erd-section">
              <h2 className="erd-section-title">Overview</h2>
              <p className="erd-text">{content.summary}</p>
              <div className="erd-style">
                <strong>Target Database:</strong> {content.database} (v{content.version})
              </div>
            </section>

            {content.assumptions && content.assumptions.length > 0 && (
              <section className="erd-section erd-assumptions">
                <h2 className="erd-section-title">Design Assumptions</h2>
                <ul className="erd-list">
                  {content.assumptions.map((a) => (
                    <li key={a.id}>
                      <strong>{a.description}</strong>
                      <div className="erd-text-small">{a.reason}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="erd-section">
              <h2 className="erd-section-title">Entities</h2>
              <div className="erd-grid">
                {content.entities.map((e) => (
                  <div key={e.name} className="erd-card">
                    <h3>{e.name}</h3>
                    <div className="erd-table-name">Table: {e.table_name}</div>
                    <p>{e.description}</p>
                    <div className="erd-table-wrap">
                      <table className="erd-table erd-table-sm">
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Constraints</th>
                            <th>Ref</th>
                          </tr>
                        </thead>
                        <tbody>
                          {e.columns.map((c) => (
                            <tr key={c.name}>
                              <td className="erd-font-mono">
                                <strong>{c.name}</strong>
                              </td>
                              <td className="erd-font-mono erd-text-green">{c.type}</td>
                              <td>
                                <div className="erd-tags">
                                  {c.primary_key && <span className="erd-tag erd-tag-pk">PK</span>}
                                  {c.unique && <span className="erd-tag">UQ</span>}
                                  {!c.nullable && <span className="erd-tag erd-tag-req">NN</span>}
                                </div>
                              </td>
                              <td className="erd-font-mono erd-text-small">
                                {c.references ? (
                                  <span className="erd-ref-link" title={c.references.entity}>
                                    {c.references.entity}.{c.references.column}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="erd-section">
              <h2 className="erd-section-title">Relationships</h2>
              <div className="erd-table-wrap">
                <table className="erd-table">
                  <thead>
                    <tr>
                      <th>From Entity</th>
                      <th>Cardinality</th>
                      <th>To Entity</th>
                      <th>Foreign Key</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.relationships.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.from_entity}</strong></td>
                        <td><span className="erd-rel-card">{r.cardinality}</span></td>
                        <td><strong>{r.to_entity}</strong></td>
                        <td className="erd-font-mono erd-text-small">
                          {r.foreign_key ? (
                            `${r.foreign_key.entity}.${r.foreign_key.column}`
                          ) : (
                            <span className="erd-text-muted">Implicit/Junction</span>
                          )}
                        </td>
                        <td className="erd-text-small">{r.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="erd-grid-2">
              {content.indexes && content.indexes.length > 0 && (
                <section className="erd-section">
                  <h2 className="erd-section-title">Indexes</h2>
                  <div className="erd-table-wrap">
                    <table className="erd-table erd-table-sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Entity</th>
                          <th>Columns</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.indexes.map((idx) => (
                          <tr key={idx.name}>
                            <td className="erd-font-mono erd-text-small">{idx.name}</td>
                            <td><strong>{idx.entity}</strong></td>
                            <td className="erd-font-mono erd-text-small">{idx.columns.join(", ")}</td>
                            <td>
                              {idx.unique ? <span className="erd-tag">UNIQUE</span> : <span className="erd-tag erd-tag-muted">IDX</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {content.constraints && content.constraints.length > 0 && (
                <section className="erd-section">
                  <h2 className="erd-section-title">Other Constraints</h2>
                  <div className="erd-table-wrap">
                    <table className="erd-table erd-table-sm">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Entity</th>
                          <th>Type</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.constraints.map((c) => (
                          <tr key={c.id}>
                            <td className="erd-font-mono erd-text-small">{c.id}</td>
                            <td><strong>{c.entity}</strong></td>
                            <td><span className="erd-tag">{c.type}</span></td>
                            <td className="erd-text-small">{c.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {activeTab === "review" && (
          <div className="erd-review-wrap">
            {!hasReview ? (
              <div className="erd-no-review">
                <p>No AI database architecture review has been run yet.</p>
                <button
                  type="button"
                  className="erd-btn erd-btn-review"
                  disabled={loading}
                  onClick={handleRunReview}
                >
                  {loading ? "Running review…" : "Run ERD Review"}
                </button>
              </div>
            ) : (
              <>
                <div className="review-summary-card">
                  <div className="review-summary-header">
                    <span className="review-summary-label">ERD Review Summary</span>
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
                    No database modeling issues found. The schema validates cleanly.
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
  .erd-layout {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    color: #111;
    background: #fafafa;
    padding-top: 32px;
  }

  .erd-header {
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    padding: 16px 24px;
    flex-shrink: 0;
  }
  .erd-header-inner {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .erd-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
    font-weight: 600;
  }
  .erd-project-name {
    margin: 2px 0 0;
    font-size: 20px;
    font-weight: 700;
    color: #111;
  }
  .erd-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .erd-approved-date {
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
  .erd-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    border-bottom: 1px solid #e5e5e5;
    gap: 12px;
    flex-wrap: wrap;
    background: #fafafa;
  }
  .erd-tabs {
    display: flex;
    gap: 4px;
  }
  .erd-tab {
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
  .erd-tab:hover { background: #f0f0f0; color: #111; }
  .erd-tab:focus-visible { box-shadow: 0 0 0 2px #111; }
  .erd-tab-active {
    background: #fff;
    border-color: #d4d4d4;
    color: #111;
    font-weight: 600;
  }
  .erd-tab-count {
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
  .erd-tab-count-important { background: #fee2e2; color: #b91c1c; }

  .erd-toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Buttons */
  .erd-btn {
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
  .erd-btn:focus-visible { box-shadow: 0 0 0 2px #111; }
  .erd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .erd-btn-review { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  .erd-btn-review:hover:not(:disabled) { background: #dbeafe; }
  .erd-btn-approve { background: #111; border-color: #111; color: #fff; }
  .erd-btn-approve:hover:not(:disabled) { background: #333; }
  .erd-btn-cancel { background: #f5f5f5; border-color: #d4d4d4; color: #555; }
  .erd-btn-primary {
    padding: 10px 20px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .erd-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

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
  .erd-error {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #b91c1c;
    font-size: 13px;
  }
  .erd-warning {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
  }

  .erd-body {
    flex: 1;
    padding: 32px 24px;
    overflow-y: auto;
  }
  .erd-container {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .erd-empty {
    max-width: 480px;
    margin: 80px auto;
    text-align: center;
    padding: 24px;
  }
  .erd-empty-title { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
  .erd-empty-desc { color: #555; margin: 0 0 24px; line-height: 1.5; }
  .erd-notice-error { padding: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 6px; font-weight: 500; }

  /* Draft */
  .erd-approved-banner {
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    color: #166534;
    font-size: 13px;
    font-weight: 500;
  }
  .erd-draft-notice {
    padding: 12px 16px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
  }

  /* Review */
  .erd-review-wrap { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .erd-no-review { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px 0; }

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

  /* Structural elements inside draft */
  .erd-section {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 24px;
  }
  .erd-assumptions { border-left: 3px solid #f59e0b; }
  .erd-section-title {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #444;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 8px;
  }
  .erd-text { margin: 0 0 12px; line-height: 1.6; color: #222; }
  .erd-text-small { font-size: 13px; color: #666; margin-top: 4px; line-height: 1.5; }
  .erd-text-muted { color: #aaa; font-style: italic; }
  .erd-style { padding: 10px 14px; background: #f8faff; border-radius: 6px; font-size: 13px; color: #1e3a5f; }
  .erd-list { margin: 0; padding-left: 20px; line-height: 1.6; color: #222; }
  .erd-list li { margin-bottom: 8px; }

  .erd-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .erd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .erd-card {
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 16px;
    background: #fafafa;
  }
  .erd-card h3 { margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #111; }
  .erd-table-name { font-family: monospace; font-size: 12px; color: #1e40af; margin-bottom: 8px; }
  .erd-card p { margin: 0 0 16px; font-size: 13px; color: #555; line-height: 1.5; }

  .erd-table-wrap { overflow-x: auto; background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; }
  .erd-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
  .erd-table th { padding: 10px 14px; background: #f5f5f5; border-bottom: 1px solid #d4d4d4; font-weight: 600; color: #444; white-space: nowrap; }
  .erd-table td { padding: 10px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: middle; }
  .erd-table tr:last-child td { border-bottom: none; }
  .erd-table-sm th, .erd-table-sm td { padding: 6px 10px; font-size: 12px; }

  .erd-font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .erd-text-green { color: #166534; }
  
  .erd-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .erd-tag { font-size: 10px; font-weight: 700; padding: 2px 4px; background: #e5e5e5; border-radius: 3px; color: #444; }
  .erd-tag-pk { background: #fef08a; color: #854d0e; }
  .erd-tag-req { background: #fee2e2; color: #991b1b; }
  .erd-tag-muted { background: #f5f5f5; color: #888; font-weight: 500; }

  .erd-rel-card { font-size: 11px; font-family: monospace; padding: 2px 6px; background: #eff6ff; color: #1d4ed8; border-radius: 4px; font-weight: bold; }
  .erd-ref-link { color: #2563eb; text-decoration: underline; text-decoration-color: #bfdbfe; text-underline-offset: 2px; }

  @media (max-width: 768px) {
    .erd-toolbar { flex-direction: column; align-items: flex-start; }
    .erd-grid-2 { grid-template-columns: 1fr; }
    .approve-confirm-actions { flex-direction: column; }
  }
`;
