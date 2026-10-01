"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { validateImplementationBlueprint } from "@/lib/ai/blueprint";
import type {
  ImplementationBlueprint,
  BlueprintReview,
  BlueprintReviewDecision,
  BlueprintUpstreamContext,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: ImplementationBlueprint;
  created_at: string;
  review_data: BlueprintReview | null;
  decisions: BlueprintReviewDecision[];
};

type Props = {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  prerequisites: {
    requirements: boolean;
    architecture: boolean;
    erd: boolean;
    dfd: boolean;
    flowchart: boolean;
  };
  validationContext: BlueprintUpstreamContext | null;
  initialDoc: DocState | null;
};

type TabKey =
  | "overview"
  | "modules"
  | "database"
  | "api"
  | "frontend"
  | "backend"
  | "security"
  | "testing"
  | "implementation"
  | "traceability"
  | "validation"
  | "review";

export function BlueprintViewer({
  projectId,
  projectName,
  isOwner,
  prerequisites,
  validationContext,
  initialDoc,
}: Props) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocState | null>(initialDoc);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const allPrerequisites =
    prerequisites.requirements &&
    prerequisites.architecture &&
    prerequisites.erd &&
    prerequisites.dfd &&
    prerequisites.flowchart;

  const validation = useMemo(() => {
    if (!doc) return null;
    return validateImplementationBlueprint(
      doc.content,
      validationContext ?? undefined,
    );
  }, [doc, validationContext]);

  const errorIssues = useMemo(
    () => (validation ? validation.issues.filter((i) => i.severity === "error") : []),
    [validation]
  );
  
  const warningIssues = useMemo(
    () => (validation ? validation.issues.filter((i) => i.severity === "warning") : []),
    [validation]
  );

  const reviewData = doc?.review_data ?? null;
  const decisions = doc?.decisions ?? [];

  const resolvedIds = useMemo(() => new Set(decisions.map((d) => d.issue_id)), [decisions]);

  const unresolvedRequired = useMemo(() => {
    if (!reviewData) return [];
    return reviewData.issues.filter(
      (i) => i.requires_user_decision && !resolvedIds.has(i.id),
    );
  }, [reviewData, resolvedIds]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/blueprint`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate blueprint");
      }
      setDoc({
        id: json.doc_id,
        status: "draft",
        content: json.blueprint,
        created_at: new Date().toISOString(),
        review_data: null,
        decisions: [],
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReview() {
    setReviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/blueprint/review`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate review");
      }
      setDoc((prev) => (prev ? { ...prev, ...json.doc } : prev));
      setActiveTab("review");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleDecision(
    issueId: string,
    action: "accept" | "ignore" | "custom",
  ) {
    setError(null);
    try {
      const customText = action === "custom" ? customInputs[issueId] : undefined;
      const res = await fetch(
        `/api/projects/${projectId}/blueprint/${doc!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: {
              issue_id: issueId,
              action,
              custom_text: customText,
              resolved_at: new Date().toISOString(),
            },
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save decision");
      setDoc((prev) => (prev ? { ...prev, ...json.doc } : prev));
      if (action === "custom") {
        setCustomInputs((prev) => {
          const next = { ...prev };
          delete next[issueId];
          return next;
        });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleApprove() {
    setApproveLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/blueprint/${doc!.id}/approve`,
        {
          method: "POST",
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve blueprint");
      setDoc((prev) => (prev ? { ...prev, status: "approved" } : null));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApproveLoading(false);
    }
  }

  if (!allPrerequisites) {
    return (
      <div className="vp-page bp-layout">
        <header className="bp-header">
          <span className="badge badge-neutral">Implementation Blueprint</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>Prerequisites Not Met</h3>
          <p>
            The Implementation Blueprint cannot be generated until Requirements,
            Architecture, ERD, DFD, and Flowchart are approved.
          </p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="vp-page bp-layout">
        <header className="bp-header">
          <span className="badge badge-neutral">Implementation Blueprint</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>No Implementation Blueprint</h3>
          <p>Generate a comprehensive blueprint to plan your implementation.</p>
          {error && <div className="alert alert-danger" style={{ margin: "16px auto", maxWidth: 400 }}>{error}</div>}
          <button
            className={`btn btn-primary ${loading ? "is-loading" : ""}`}
            onClick={handleGenerate}
            disabled={loading || !isOwner}
          >
            {loading ? "Generating Blueprint..." : "Generate Blueprint"}
          </button>
        </div>
      </div>
    );
  }

  const { content } = doc;
  const isApproved = doc.status === "approved";
  const isReview = doc.status === "review";
  const canApprove =
    isOwner &&
    isReview &&
    unresolvedRequired.length === 0 &&
    errorIssues.length === 0;

  return (
    <div className="bp-layout">
      <header className="bp-header">
        <div className="bp-header-inner">
          <div>
            <span className="badge badge-neutral">Implementation Blueprint</span>
            <h1>{projectName}</h1>
          </div>
          <div className="bp-actions">
            <span
              className={`badge ${
                isApproved
                  ? "badge-approved"
                  : isReview
                    ? "badge-review"
                    : "badge-draft"
              }`}
            >
              {isApproved ? "Approved" : isReview ? "In Review" : "Draft"}
            </span>

            {isOwner && !isApproved && (
              <>
                {!isReview ? (
                  <button
                    className={`btn btn-secondary ${
                      reviewLoading ? "is-loading" : ""
                    }`}
                    onClick={handleGenerateReview}
                    disabled={reviewLoading || errorIssues.length > 0}
                  >
                    Generate AI Review
                  </button>
                ) : (
                  <button
                    className={`btn btn-primary ${
                      approveLoading ? "is-loading" : ""
                    }`}
                    onClick={handleApprove}
                    disabled={!canApprove || approveLoading}
                  >
                    Approve Blueprint
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginTop: 16 }}>{error}</div>}

        <div className="tabs" role="tablist">
          {[
            { key: "overview", label: "Overview" },
            { key: "modules", label: "Modules" },
            { key: "database", label: "Database" },
            { key: "api", label: "API" },
            { key: "frontend", label: "Frontend" },
            { key: "backend", label: "Backend" },
            { key: "security", label: "Security" },
            { key: "testing", label: "Testing" },
            { key: "implementation", label: "Phases" },
            { key: "traceability", label: "Traceability" },
            {
              key: "validation",
              label: `Validation ${errorIssues.length > 0 ? "(!)" : ""}`,
            },
            {
              key: "review",
              label: `AI Review ${
                unresolvedRequired.length > 0 ? `(${unresolvedRequired.length})` : ""
              }`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.key as TabKey)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="bp-content">
        {activeTab === "overview" && (
          <div className="bp-section">
            <div className="card">
              <h2>{content.title}</h2>
              <p>Version: {content.version}</p>
              <p>{content.description}</p>
              <h3 style={{ marginTop: 24 }}>Project Summary</h3>
              <p>{content.project_summary}</p>
              <h3 style={{ marginTop: 24 }}>Assumptions</h3>
              <ul>
                {content.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "modules" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.modules.map((m) => (
                <div key={m.id} className="card">
                  <div className="card-header">
                    <h3>{m.name} <span style={{fontSize: 12, color: "var(--color-text-secondary)"}}>({m.code})</span></h3>
                  </div>
                  <div className="card-content">
                    <p>{m.description}</p>
                    <p><strong>Responsibility:</strong> {m.responsibility}</p>
                    <p><strong>Priority:</strong> {m.priority}</p>
                    {m.dependencies.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <strong>Dependencies:</strong>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {m.dependencies.map(d => <li key={d}>{d}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="bp-section">
            <p>{content.database_plan.summary}</p>
            <div className="bp-grid">
              {content.database_plan.tables.map((t) => (
                <div key={t.table_name} className="card">
                  <h4>{t.table_name}</h4>
                  <p className="bp-text-small">{t.purpose}</p>
                  <p className="bp-text-small"><strong>PK:</strong> {t.primary_key}</p>
                  {t.foreign_keys.length > 0 && (
                    <div className="bp-text-small" style={{ marginTop: 8 }}>
                      <strong>Foreign Keys:</strong>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {t.foreign_keys.map(fk => (
                          <li key={fk.column}>{fk.column} → {fk.references_table}.{fk.references_column}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {t.indexes.length > 0 && (
                    <div className="bp-text-small" style={{ marginTop: 8 }}>
                      <strong>Indexes:</strong>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {t.indexes.map(idx => (
                          <li key={idx.name}>{idx.name} ({idx.columns.join(", ")}) {idx.unique ? "[UNIQUE]" : ""}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="bp-text-small" style={{ marginTop: 8 }}>
                    <strong>RLS:</strong> {t.rls_required ? "Yes" : "No"} {t.rls_summary ? `(${t.rls_summary})` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Route</th>
                  <th>Module</th>
                  <th>Auth</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {content.api_plan.map(api => (
                  <tr key={api.id}>
                    <td><strong>{api.method}</strong></td>
                    <td><code style={{ fontSize: 12 }}>{api.route}</code></td>
                    <td>{api.module_id}</td>
                    <td>{api.authentication_required ? "Yes" : "No"}</td>
                    <td>{api.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "frontend" && (
          <div className="bp-section">
            <p>{content.frontend_plan.summary}</p>
            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Route</th>
                  <th>Module</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {content.frontend_plan.pages.map(p => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td><code style={{ fontSize: 12 }}>{p.route}</code></td>
                    <td>{p.module_id}</td>
                    <td>{p.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "backend" && (
          <div className="bp-section">
            <p>{content.backend_plan.summary}</p>
            <div className="bp-grid" style={{ marginTop: 16 }}>
              {content.backend_plan.services.map((svc) => (
                <div key={svc.id} className="card">
                  <h4>{svc.name}</h4>
                  <p className="bp-text-small">{svc.purpose}</p>
                  <p className="bp-text-small"><strong>Module:</strong> {svc.module_id}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bp-section">
            <div className="card">
              <h3>Authentication</h3>
              <p><strong>Mechanism:</strong> {content.authentication_plan.mechanism}</p>
              <p><strong>Session:</strong> {content.authentication_plan.session_strategy}</p>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Authorization</h3>
              <p>{content.authorization_plan.summary}</p>
              <ul style={{ paddingLeft: 20 }}>
                {content.authorization_plan.roles.map(r => (
                  <li key={r.role}>
                    <strong>{r.role}</strong>: {r.permissions.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Security Plan</h3>
              <p>{content.security_plan.summary}</p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Threat</th>
                    <th>Mitigation</th>
                    <th>Layer</th>
                  </tr>
                </thead>
                <tbody>
                  {content.security_plan.mitigations.map((m, i) => (
                    <tr key={i}>
                      <td>{m.threat_category}</td>
                      <td>{m.mitigation}</td>
                      <td>{m.enforcement_location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "testing" && (
          <div className="bp-section">
            <p>{content.testing_plan.summary}</p>
            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Expected Outcome</th>
                </tr>
              </thead>
              <tbody>
                {content.testing_plan.test_cases.map(tc => (
                  <tr key={tc.id}>
                    <td><span className="badge badge-neutral">{tc.category}</span></td>
                    <td>{tc.title}</td>
                    <td>{tc.target_module_id}</td>
                    <td>{tc.expected_outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "implementation" && (
          <div className="bp-section">
            <div className="bp-pipeline">
              {content.implementation_phases.map((phase) => (
                <div key={phase.id} className="card" style={{ marginBottom: 16 }}>
                  <h4>Phase {phase.phase_number}: {phase.name}</h4>
                  <p className="bp-text-small">{phase.description}</p>
                  <p className="bp-text-small"><strong>Modules:</strong> {phase.module_ids.join(", ")}</p>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13 }}>
                    {phase.exit_criteria.map((ec, i) => (
                      <li key={i}>{ec}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <h3 style={{ marginTop: 24, marginBottom: 16 }}>Dependencies</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {content.dependencies.map((d, i) => (
                  <tr key={i}>
                    <td>{d.from_module_id}</td>
                    <td>{d.to_module_id}</td>
                    <td>{d.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "traceability" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Blueprint Module</th>
                  <th>Requirement</th>
                  <th>Architecture</th>
                  <th>DFD Process</th>
                </tr>
              </thead>
              <tbody>
                {content.traceability.mappings.map((m, i) => (
                  <tr key={i}>
                    <td>{m.blueprint_module_id}</td>
                    <td>{m.requirement_id}</td>
                    <td>{m.architecture_module_id || "—"}</td>
                    <td>{m.dfd_process_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "validation" && (
          <div className="bp-section">
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Deterministic Validation</h3>
              {errorIssues.length === 0 && warningIssues.length === 0 ? (
                <div className="alert alert-success">
                  Validation passed. No issues found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {errorIssues.map((issue) => (
                    <div key={issue.id} className="alert alert-danger">
                      <strong>{issue.title}</strong>: {issue.description}
                    </div>
                  ))}
                  {warningIssues.map((issue) => (
                    <div key={issue.id} className="alert alert-warning">
                      <strong>{issue.title}</strong>: {issue.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "review" && (
          <div className="bp-section">
            {reviewData ? (
              <div className="bp-review-container">
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3>AI Review Summary</h3>
                  <p>{reviewData.summary}</p>
                </div>
                {reviewData.issues.map((issue) => {
                  const decision = decisions.find((d) => d.issue_id === issue.id);
                  const isImportant = issue.severity === "important";
                  return (
                    <div key={issue.id} className="card" style={{ marginBottom: 16 }}>
                      <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
                        <h4 style={{ margin: 0 }}>
                          <span className={`badge ${isImportant ? "badge-danger" : "badge-warning"}`} style={{ marginRight: 8 }}>
                            {issue.severity}
                          </span>
                          {issue.title}
                        </h4>
                      </div>
                      <div className="card-content">
                        <p className="bp-text-small">{issue.description}</p>
                        <p className="bp-text-small" style={{ fontStyle: "italic" }}>Evidence: {issue.evidence}</p>
                        <p className="bp-text-small"><strong>Recommendation:</strong> {issue.recommendation}</p>
                        
                        {issue.requires_user_decision && !isApproved && (
                          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                            {decision ? (
                              <p className="bp-text-small">
                                <strong>Decision:</strong> <span style={{ textTransform: "capitalize" }}>{decision.action}</span>
                                {decision.custom_text ? ` - ${decision.custom_text}` : ""}
                              </p>
                            ) : isOwner ? (
                              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button className="btn btn-sm btn-success" onClick={() => handleDecision(issue.id, "accept")}>
                                    Accept
                                  </button>
                                  <button className="btn btn-sm btn-danger" onClick={() => handleDecision(issue.id, "ignore")}>
                                    Ignore
                                  </button>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <input 
                                    className="input" 
                                    style={{ flex: 1 }} 
                                    placeholder="Custom resolution..." 
                                    value={customInputs[issue.id] || ""}
                                    onChange={(e) => setCustomInputs({...customInputs, [issue.id]: e.target.value})}
                                  />
                                  <button 
                                    className="btn btn-sm btn-secondary" 
                                    disabled={!customInputs[issue.id]}
                                    onClick={() => handleDecision(issue.id, "custom")}
                                  >
                                    Custom
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="bp-text-small" style={{ color: "var(--color-warning)" }}>Awaiting owner decision.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No AI Review generated yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .bp-layout {
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans);
          color: var(--color-foreground);
          background: var(--color-background);
        }
        .bp-header {
          position: sticky;
          top: 33px;
          z-index: 20;
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
          padding: 16px 24px 0;
        }
        .bp-header-inner {
          max-width: 1024px;
          margin: 0 auto 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .bp-header h1 {
          font-size: 24px;
          margin: 4px 0 0;
        }
        .bp-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bp-content {
          flex: 1;
          padding: 24px;
          max-width: 1024px;
          margin: 0 auto;
          width: 100%;
        }
        .bp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .bp-text-small {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: 4px;
          margin-bottom: 4px;
        }
        .tabs { margin: 0 auto; max-width: 1024px; overflow-x: auto; }
      `}} />
    </div>
  );
}
