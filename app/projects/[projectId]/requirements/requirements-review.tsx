"use client";

import { useState } from "react";
import type {
  RequirementsDraft,
  RequirementsReview as ReviewType,
  RequirementsReviewIssue,
  ReviewDecision,
  ReviewDecisionAction,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  content: RequirementsDraft;
  status: string;
  review_data: ReviewType | null;
  decisions: ReviewDecision[];
  approved_at: string | null;
  approved_by: string | null;
};

type Props = {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  doc: DocState | null;
};

const DRAFT_SECTIONS: { key: keyof RequirementsDraft; label: string }[] = [
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

const SEVERITY_LABELS: Record<RequirementsReviewIssue["severity"], string> = {
  important: "Important",
  minor: "Minor",
};

const KIND_LABELS: Record<RequirementsReviewIssue["kind"], string> = {
  missing_requirement: "Missing",
  ambiguous_requirement: "Ambiguous",
  conflicting_requirement: "Conflict",
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
  issue: RequirementsReviewIssue;
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
      aria-label={issue.title}
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
                Accept recommendation
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
                Ignore for now
              </button>
            </>
          ) : (
            <div className="issue-custom-wrap">
              <label
                htmlFor={`custom-${issue.id}`}
                className="issue-custom-label"
              >
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
            Accept recommendation
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

function DraftViewer({ draft }: { draft: RequirementsDraft }) {
  return (
    <div className="draft-viewer">
      {DRAFT_SECTIONS.map(({ key, label }) => {
        const value = draft[key];
        const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
        return (
          <div key={key} className="draft-section">
            <h3 className="draft-section-title">{label}</h3>
            {isEmpty ? (
              <p className="draft-section-empty">Not specified</p>
            ) : typeof value === "string" ? (
              <p className="draft-section-text">{value}</p>
            ) : (
              <ul className="draft-section-list">
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

export function RequirementsReview({
  projectId,
  projectName,
  isOwner,
  doc: initialDoc,
}: Props) {
  const [doc, setDoc] = useState<DocState | null>(initialDoc);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"draft" | "review">("draft");

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

  async function handleRunReview() {
    if (!doc) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/requirements/review`,
        { method: "POST" },
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Review failed.",
        );
        return;
      }
      const typed = data as {
        doc_id: string;
        review: ReviewType;
      };
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
        `/api/projects/${projectId}/requirements/${doc.id}`,
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
              content: updated.content ?? prev.content,
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
        `/api/projects/${projectId}/requirements/${doc.id}/approve`,
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
      <div className="req-layout">
        <div className="req-header">
          <div>
            <span className="req-label">Requirements</span>
            <h1 className="req-project-name">{projectName}</h1>
          </div>
        </div>
        <div className="req-empty">
          <p className="req-empty-title">No requirements draft yet.</p>
          <p className="req-empty-desc">
            Complete Discovery to generate a Requirements Draft.
          </p>
          <a
            href={`/projects/${projectId}/discovery`}
            className="req-link-btn"
          >
            Go to Discovery
          </a>
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  const totalIssues = review?.issues.length ?? 0;
  const importantIssues =
    review?.issues.filter((i) => i.severity === "important").length ?? 0;
  const resolvedCount = decisions.length;

  return (
    <div className="req-layout">
      {/* Header */}
      <header className="req-header">
        <div className="req-header-inner">
          <div>
            <span className="req-label">Requirements</span>
            <h1 className="req-project-name">{projectName}</h1>
          </div>
          <div className="req-header-right">
            <StatusBadge status={doc.status} />
            {isApproved && doc.approved_at && (
              <span className="req-approved-date">
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
      <div className="req-toolbar">
        <div className="req-tabs">
          <button
            type="button"
            className={`req-tab${activeTab === "draft" ? " req-tab-active" : ""}`}
            onClick={() => setActiveTab("draft")}
          >
            Requirements Draft
          </button>
          <button
            type="button"
            className={`req-tab${activeTab === "review" ? " req-tab-active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            AI Review
            {hasReview && totalIssues > 0 && (
              <span className={`req-tab-count${importantIssues > 0 ? " req-tab-count-important" : ""}`}>
                {totalIssues}
              </span>
            )}
          </button>
        </div>

        <div className="req-toolbar-actions">
          {!isApproved && !hasReview && (
            <button
              type="button"
              className="req-btn req-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Run AI Review"}
            </button>
          )}
          {!isApproved && hasReview && (
            <button
              type="button"
              className="req-btn req-btn-review"
              disabled={loading}
              onClick={handleRunReview}
            >
              {loading ? "Running review…" : "Re-run AI Review"}
            </button>
          )}
          {canApprove && !showApproveConfirm && (
            <button
              type="button"
              className="req-btn req-btn-approve"
              disabled={loading}
              onClick={() => setShowApproveConfirm(true)}
            >
              Approve Requirements
            </button>
          )}
        </div>
      </div>

      {/* Approval confirmation */}
      {showApproveConfirm && (
        <div className="approve-confirm" role="dialog" aria-modal="true">
          <div className="approve-confirm-box">
            <h2 className="approve-confirm-title">Approve Requirements?</h2>
            <p className="approve-confirm-desc">
              Approve these requirements as the project baseline?
            </p>
            <p className="approve-confirm-note">
              After approval, architecture artifacts will be generated from
              this version. Approved requirements cannot be edited through
              the normal draft UI.
            </p>
            <div className="approve-confirm-actions">
              <button
                type="button"
                className="req-btn req-btn-cancel"
                onClick={() => setShowApproveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="req-btn req-btn-approve"
                disabled={loading}
                onClick={handleApprove}
              >
                Approve Requirements
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="req-error" role="alert">
          {error}
        </div>
      )}

      {/* Unresolved required decisions warning */}
      {hasReview && !isApproved && requiredUnresolved.length > 0 && (
        <div className="req-warning" role="status">
          {requiredUnresolved.length} required decision
          {requiredUnresolved.length === 1 ? "" : "s"} must be resolved before
          approval.
        </div>
      )}

      {/* Content */}
      <div className="req-body">
        {activeTab === "draft" && (
          <div className="req-draft-wrap">
            {isApproved && (
              <div className="req-approved-banner">
                Requirements Approved — this is the authoritative baseline.
                Architecture will be generated from this version.
              </div>
            )}
            {!isApproved && (
              <div className="req-draft-notice">
                DRAFT — Review these requirements before architecture is
                generated.
              </div>
            )}
            <DraftViewer draft={doc.content} />
          </div>
        )}

        {activeTab === "review" && (
          <div className="req-review-wrap">
            {!hasReview ? (
              <div className="req-no-review">
                <p>No AI review has been run yet.</p>
                <button
                  type="button"
                  className="req-btn req-btn-review"
                  disabled={loading}
                  onClick={handleRunReview}
                >
                  {loading ? "Running review…" : "Run AI Review"}
                </button>
              </div>
            ) : (
              <>
                <div className="review-summary-card">
                  <div className="review-summary-header">
                    <span className="review-summary-label">AI Review Summary</span>
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
                    No issues found. Requirements look complete.
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
  .req-layout {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    color: #111;
    background: #fff;
    padding-top: 32px;
  }

  .req-header {
    border-bottom: 1px solid #e5e5e5;
    padding: 16px 24px;
    flex-shrink: 0;
  }
  .req-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .req-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
    font-weight: 600;
  }
  .req-project-name {
    margin: 2px 0 0;
    font-size: 20px;
    font-weight: 700;
    color: #111;
  }
  .req-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .req-approved-date {
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
  .req-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    border-bottom: 1px solid #e5e5e5;
    gap: 12px;
    flex-wrap: wrap;
    background: #fafafa;
  }
  .req-tabs {
    display: flex;
    gap: 4px;
  }
  .req-tab {
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
  .req-tab:hover { background: #f0f0f0; color: #111; }
  .req-tab:focus-visible { box-shadow: 0 0 0 2px #111; }
  .req-tab-active {
    background: #fff;
    border-color: #d4d4d4;
    color: #111;
    font-weight: 600;
  }
  .req-tab-count {
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
  .req-tab-count-important { background: #fee2e2; color: #b91c1c; }

  .req-toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Buttons */
  .req-btn {
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
  .req-btn:focus-visible { box-shadow: 0 0 0 2px #111; }
  .req-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .req-btn-review { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
  .req-btn-review:hover:not(:disabled) { background: #dbeafe; }
  .req-btn-approve { background: #111; border-color: #111; color: #fff; }
  .req-btn-approve:hover:not(:disabled) { background: #333; }
  .req-btn-cancel { background: #f5f5f5; border-color: #d4d4d4; color: #555; }

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
  .req-error {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #b91c1c;
    font-size: 13px;
  }
  .req-warning {
    margin: 12px 24px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
  }

  /* Body */
  .req-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  /* Empty state */
  .req-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }
  .req-empty-title { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
  .req-empty-desc { color: #555; margin: 0 0 20px; }
  .req-link-btn {
    display: inline-block;
    padding: 8px 18px;
    background: #111;
    color: #fff;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }
  .req-link-btn:hover { background: #333; }

  /* Draft */
  .req-draft-wrap { max-width: 800px; }
  .req-approved-banner {
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    color: #166534;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 20px;
  }
  .req-draft-notice {
    padding: 12px 16px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    color: #92400e;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 20px;
  }

  .draft-viewer { display: flex; flex-direction: column; gap: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; }
  .draft-section { padding: 14px 18px; border-bottom: 1px solid #f0f0f0; }
  .draft-section:last-child { border-bottom: none; }
  .draft-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #888; margin: 0 0 8px; }
  .draft-section-text { margin: 0; font-size: 13px; line-height: 1.6; color: #222; }
  .draft-section-empty { margin: 0; font-size: 13px; color: #bbb; font-style: italic; }
  .draft-section-list { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #222; line-height: 1.5; }

  /* Review */
  .req-review-wrap { max-width: 800px; display: flex; flex-direction: column; gap: 16px; }
  .req-no-review { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px 0; }

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
    .req-toolbar { flex-direction: column; align-items: flex-start; }
    .req-body { padding: 16px; }
    .approve-confirm-actions { flex-direction: column; }
  }
`;
