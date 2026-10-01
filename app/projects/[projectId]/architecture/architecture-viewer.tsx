"use client";

import { useState } from "react";
import type {
  ArchitectureDocument,
  ArchitectureReview,
  ArchitectureReviewIssue,
  ReviewDecision,
  ReviewDecisionAction,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: ArchitectureDocument;
  review_data: ArchitectureReview | null;
  decisions: ReviewDecision[];
  approved_at: string | null;
  approved_by: string | null;
};

type Props = {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  requirementsApproved: boolean;
  initialDoc: DocState | null;
};

const SEVERITY_LABELS: Record<ArchitectureReviewIssue["severity"], string> = {
  important: "Important",
  minor: "Minor",
};

const KIND_LABELS: Record<ArchitectureReviewIssue["kind"], string> = {
  requirement_mismatch: "Requirement Mismatch",
  missing_entity: "Missing Entity",
  missing_actor: "Missing Actor",
  missing_module: "Missing Module",
  invalid_relationship: "Invalid Relationship",
  scope_expansion: "Scope Expansion",
  technology_issue: "Technology Issue",
  security_issue: "Security Issue",
  layering_issue: "Layering Issue",
  architecture_complexity: "Complexity",
  missing_assumption: "Missing Assumption",
  ambiguous_decision: "Ambiguous Decision",
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
  issue: ArchitectureReviewIssue;
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
          <span className="issue-section">{issue.section}</span>
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

export function ArchitectureViewer({
  projectId,
  projectName,
  isOwner,
  requirementsApproved,
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
      const res = await fetch(`/api/projects/${projectId}/architecture`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to generate architecture.");
        return;
      }
      const typed = data as { doc_id: string; architecture: ArchitectureDocument };
      setDoc({
        id: typed.doc_id,
        status: "draft",
        content: typed.architecture,
        review_data: null,
        decisions: [],
        approved_at: null,
        approved_by: null,
      });
    } catch {
      setError("An unexpected error occurred during architecture generation.");
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
        `/api/projects/${projectId}/architecture/review`,
        { method: "POST" },
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Review failed.");
        return;
      }
      const typed = data as { doc_id: string; review: ArchitectureReview };
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
        `/api/projects/${projectId}/architecture/${doc.id}`,
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
        `/api/projects/${projectId}/architecture/${doc.id}/approve`,
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
      <div className="arch-layout">
        <header className="arch-header">
          <div className="arch-header-inner">
            <div>
              <span className="arch-label">System Architecture</span>
              <h1 className="arch-project-name">{projectName}</h1>
            </div>
          </div>
        </header>

        <div className="arch-empty">
          <p className="arch-empty-title">No architecture draft yet.</p>
          {!requirementsApproved ? (
            <div className="arch-notice-error">
              Requirements must be approved before generating architecture.
            </div>
          ) : (
            <>
              <p className="arch-empty-desc">
                Generate a system architecture based on the approved requirements.
                This process takes 30-90 seconds.
              </p>
              <button
                type="button"
                className="arch-btn-primary"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "Generating Architecture..." : "Generate Architecture"}
              </button>
            </>
          )}
          {error && <div className="arch-error">{error}</div>}
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  const { content } = doc;

  return (
    <div className="arch-layout">
      {/* Header */}
      <header className="arch-header">
        <div className="arch-header-inner">
          <div>
            <span className="arch-label">System Architecture</span>
            <h1 className="arch-project-name">{projectName}</h1>
          </div>
          <div className="arch-header-right">
            <StatusBadge status={doc.status} />
            {isApproved && doc.approved_at && (
              <span className="arch-approved-date">
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
      <div className="arch-toolbar">
        <div className="arch-tabs">
          <button
            type="button"
            className={`arch-tab${activeTab === "draft" ? " arch-tab-active" : ""}`}
            onClick={() => setActiveTab("draft")}
          >
            Architecture Document
          </button>
          <button
            type="button"
            className={`arch-tab${activeTab === "review" ? " arch-tab-active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            AI Review
            {hasReview && totalIssues > 0 && (
              <span className={`arch-tab-count${importantIssues > 0 ? " arch-tab-count-important" : ""}`}>
                {totalIssues}
              </span>
            )}
          </button>
        </div>

        <div className="arch-toolbar-actions">
          {!isApproved && !hasReview && (
            <button
              type="button"
              className="arch-btn arch-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Run AI Review"}
            </button>
          )}
          {!isApproved && hasReview && (
            <button
              type="button"
              className="arch-btn arch-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Re-run AI Review"}
            </button>
          )}
          {canApprove && !showApproveConfirm && (
            <button
              type="button"
              className="arch-btn arch-btn-approve"
              disabled={loading}
              onClick={() => setShowApproveConfirm(true)}
            >
              Approve Architecture
            </button>
          )}
        </div>
      </div>

      {/* Approval confirmation */}
      {showApproveConfirm && (
        <div className="approve-confirm" role="dialog" aria-modal="true">
          <div className="approve-confirm-box">
            <h2 className="approve-confirm-title">Approve Architecture?</h2>
            <p className="approve-confirm-desc">
              Approve this architecture as the project baseline?
            </p>
            <p className="approve-confirm-note">
              After approval, technical implementation artifacts will be generated from
              this version. Approved architecture cannot be edited through
              the normal draft UI.
            </p>
            <div className="approve-confirm-actions">
              <button
                type="button"
                className="arch-btn arch-btn-cancel"
                onClick={() => setShowApproveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="arch-btn arch-btn-approve"
                disabled={loading}
                onClick={handleApprove}
              >
                Approve Architecture
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="arch-error" role="alert">
          {error}
        </div>
      )}

      {hasReview && !isApproved && requiredUnresolved.length > 0 && (
        <div className="arch-warning" role="status">
          {requiredUnresolved.length} required decision{requiredUnresolved.length === 1 ? "" : "s"} must be resolved before approval.
        </div>
      )}

      <div className="arch-body">
        {activeTab === "draft" && (
          <div className="arch-container">
            {isApproved && (
              <div className="arch-approved-banner">
                Architecture Approved — this is the authoritative technical baseline.
              </div>
            )}
            {!isApproved && (
              <div className="arch-draft-notice">
                DRAFT — Review this architecture against the approved requirements.
              </div>
            )}
            
            <section className="arch-section">
              <h2 className="arch-section-title">Overview</h2>
              <p className="arch-text">{content.overview}</p>
              <div className="arch-style">
                <strong>Architectural Style:</strong> {content.architectural_style}
              </div>
            </section>

            {content.assumptions.length > 0 && (
              <section className="arch-section arch-assumptions">
                <h2 className="arch-section-title">Assumptions</h2>
                <ul className="arch-list">
                  {content.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="arch-section">
              <h2 className="arch-section-title">Modules</h2>
              <div className="arch-grid">
                {content.modules.map((m) => (
                  <div key={m.id} className="arch-card">
                    <h3>{m.name}</h3>
                    <p>{m.description}</p>
                    <strong>Responsibilities:</strong>
                    <ul>
                      {m.responsibilities.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                    <strong>Actors:</strong>
                    <div className="arch-tags">
                      {m.actors.map((a, i) => (
                        <span key={i} className="arch-tag">{a}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="arch-section">
              <h2 className="arch-section-title">Actors & Permissions</h2>
              <div className="arch-grid">
                {content.actors.map((a) => (
                  <div key={a.id} className="arch-card">
                    <h3>{a.name}</h3>
                    <p>{a.description}</p>
                    <strong>Permissions:</strong>
                    <ul>
                      {a.permissions.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="arch-section">
              <h2 className="arch-section-title">Entities</h2>
              <div className="arch-table-wrap">
                <table className="arch-table">
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Attributes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.entities.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <strong>{e.name}</strong>
                          <div className="arch-text-small">{e.description}</div>
                        </td>
                        <td>
                          <ul className="arch-attr-list">
                            {e.attributes.map((attr, i) => (
                              <li key={i}>
                                <span className="arch-attr-name">{attr.name}</span>
                                <span className="arch-attr-type">{attr.type}</span>
                                {attr.required && <span className="arch-attr-req">*</span>}
                                {attr.unique && <span className="arch-attr-tag">UQ</span>}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="arch-section">
              <h2 className="arch-section-title">Relationships</h2>
              <div className="arch-table-wrap">
                <table className="arch-table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Type</th>
                      <th>To</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.relationships.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.from}</strong></td>
                        <td><span className="arch-rel-type">{r.type}</span></td>
                        <td><strong>{r.to}</strong></td>
                        <td className="arch-text-small">{r.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="arch-section">
              <h2 className="arch-section-title">Application Layers</h2>
              <div className="arch-grid">
                {content.layers.map((l) => (
                  <div key={l.id} className="arch-card">
                    <h3>{l.name}</h3>
                    <p>{l.responsibility}</p>
                    <div className="arch-tags">
                      {l.technologies.map((t, i) => (
                        <span key={i} className="arch-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="arch-section">
              <h2 className="arch-section-title">Technology Decisions</h2>
              <div className="arch-table-wrap">
                <table className="arch-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Technology</th>
                      <th>Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.technology_decisions.map((t, i) => (
                      <tr key={i}>
                        <td style={{ whiteSpace: "nowrap" }}>{t.category}</td>
                        <td><strong>{t.technology}</strong></td>
                        <td>{t.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="arch-grid-2">
              {content.security_considerations.length > 0 && (
                <section className="arch-section">
                  <h2 className="arch-section-title">Security</h2>
                  <ul className="arch-list">
                    {content.security_considerations.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </section>
              )}

              {content.constraints.length > 0 && (
                <section className="arch-section">
                  <h2 className="arch-section-title">Constraints</h2>
                  <ul className="arch-list">
                    {content.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}

        {activeTab === "review" && (
          <div className="arch-review-wrap">
            {!hasReview ? (
              <div className="arch-no-review">
                <p>No AI architecture review has been run yet.</p>
                <button
                  type="button"
                  className="arch-btn arch-btn-review"
                  disabled={loading}
                  onClick={handleRunReview}
                >
                  {loading ? "Running review…" : "Run Architecture Review"}
                </button>
              </div>
            ) : (
              <>
                <div className="review-summary-card">
                  <div className="review-summary-header">
                    <span className="review-summary-label">Architecture Review Summary</span>
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
                    No architecture issues found. The architecture maps perfectly to the requirements.
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
  .arch-layout {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    color: #111;
    background: #fafafa;
    padding-top: 32px;
  }

  .arch-header {
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    padding: 16px 24px;
    flex-shrink: 0;
  }
  .arch-header-inner {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .arch-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
    font-weight: 600;
  }
  .arch-project-name {
    margin: 2px 0 0;
    font-size: 20px;
    font-weight: 700;
    color: #111;
  }
  .arch-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .arch-approved-date {
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
  .arch-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    border-bottom: 1px solid #e5e5e5;
    gap: 12px;
    flex-wrap: wrap;
    background: #fafafa;
  }
  .arch-tabs {
    display: flex;
    gap: 4px;
  }
  .arch-tab {
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
  .arch-tab:hover { background: #f0f0f0; color: #111; }
  .arch-tab:focus-visible { box-shadow: 0 0 0 2px #111; }
  .arch-tab-active {
    background: #fff;
    border-color: #d4d4d4;
    color: #111;
    font-weight: 600;
  }
  .arch-tab-count {
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
  .arch-tab-count-important { background: #fee2e2; color: #b91c1c; }

  .arch-toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Buttons */
  .arch-btn {
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
  .arch-btn:focus-visible { box-shadow: 0 0 0 2px #111; }
  .arch-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .arch-btn-review { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  .arch-btn-review:hover:not(:disabled) { background: #dbeafe; }
  .arch-btn-approve { background: #111; border-color: #111; color: #fff; }
  .arch-btn-approve:hover:not(:disabled) { background: #333; }
  .arch-btn-cancel { background: #f5f5f5; border-color: #d4d4d4; color: #555; }
  .arch-btn-primary {
    padding: 10px 20px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .arch-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

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
  .arch-error {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #b91c1c;
    font-size: 13px;
  }
  .arch-warning {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
  }

  .arch-body {
    flex: 1;
    padding: 32px 24px;
    overflow-y: auto;
  }
  .arch-container {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .arch-empty {
    max-width: 480px;
    margin: 80px auto;
    text-align: center;
    padding: 24px;
  }
  .arch-empty-title { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
  .arch-empty-desc { color: #555; margin: 0 0 24px; line-height: 1.5; }
  .arch-notice-error { padding: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 6px; font-weight: 500; }

  /* Draft */
  .arch-approved-banner {
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    color: #166534;
    font-size: 13px;
    font-weight: 500;
  }
  .arch-draft-notice {
    padding: 12px 16px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
  }

  /* Review */
  .arch-review-wrap { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .arch-no-review { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px 0; }

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
  .issue-section { font-size: 11px; color: #888; }
  .issue-resolved-label { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.06em; }

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
  .arch-section {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 24px;
  }
  .arch-assumptions { border-left: 3px solid #f59e0b; }
  .arch-section-title {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #444;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 8px;
  }
  .arch-text { margin: 0 0 12px; line-height: 1.6; color: #222; }
  .arch-text-small { font-size: 13px; color: #666; margin-top: 4px; }
  .arch-style { padding: 10px 14px; background: #f8faff; border-radius: 6px; font-size: 13px; color: #1e3a5f; }
  .arch-list { margin: 0; padding-left: 20px; line-height: 1.6; color: #222; }

  .arch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .arch-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .arch-card {
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 16px;
    background: #fafafa;
  }
  .arch-card h3 { margin: 0 0 8px; font-size: 15px; font-weight: 700; }
  .arch-card p { margin: 0 0 12px; font-size: 13px; color: #555; line-height: 1.5; }
  .arch-card strong { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; display: block; margin-bottom: 4px; }
  .arch-card ul { margin: 0 0 12px; padding-left: 16px; font-size: 13px; line-height: 1.5; }

  .arch-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .arch-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; background: #e5e5e5; border-radius: 4px; color: #444; }

  .arch-table-wrap { overflow-x: auto; }
  .arch-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
  .arch-table th { padding: 10px 14px; background: #f5f5f5; border-bottom: 1px solid #d4d4d4; font-weight: 600; color: #444; }
  .arch-table td { padding: 12px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  .arch-table tr:last-child td { border-bottom: none; }
  
  .arch-rel-type { font-size: 11px; font-family: monospace; padding: 2px 6px; background: #eff6ff; color: #1d4ed8; border-radius: 4px; }

  .arch-attr-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
  .arch-attr-list li { display: flex; align-items: center; gap: 6px; }
  .arch-attr-name { font-weight: 600; }
  .arch-attr-type { font-family: monospace; font-size: 12px; color: #166534; background: #f0fdf4; padding: 1px 4px; border-radius: 3px; }
  .arch-attr-req { color: #dc2626; font-weight: bold; }
  .arch-attr-tag { font-size: 10px; padding: 1px 4px; background: #f3f4f6; border-radius: 3px; font-weight: 700; color: #4b5563; }

  @media (max-width: 768px) {
    .arch-toolbar { flex-direction: column; align-items: flex-start; }
    .arch-grid-2 { grid-template-columns: 1fr; }
    .approve-confirm-actions { flex-direction: column; }
  }
`;
