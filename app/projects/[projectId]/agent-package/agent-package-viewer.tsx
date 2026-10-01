"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateAgentPackageDocument } from "@/lib/ai/agent-package";
import type {
  AgentPackageDocument,
  AgentPackageReview,
  AgentPackageReviewDecision,
  AgentPackageUpstreamContext,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: AgentPackageDocument;
  created_at: string;
  approved_at?: string | null;
  review_data: AgentPackageReview | null;
  decisions: AgentPackageReviewDecision[];
};

type ExportManifestPreview = {
  format_version: string;
  package_type: string;
  project_id: string;
  project_name: string;
  agent_package_document_id: string;
  agent_package_version: string;
  source_document_ids: Record<string, string>;
  exported_at: string;
  files: { path: string; sha256: string; bytes: number }[];
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
    blueprint: boolean;
  };
  validationContext: AgentPackageUpstreamContext | null;
  initialDoc: DocState | null;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "contract", label: "Agent Contract" },
  { key: "rules", label: "Project Rules" },
  { key: "strategy", label: "Strategy" },
  { key: "modules", label: "Modules" },
  { key: "database", label: "Database" },
  { key: "api", label: "API Contracts" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "authn", label: "Authentication" },
  { key: "authz", label: "Authorization" },
  { key: "validation", label: "Validation" },
  { key: "security", label: "Security" },
  { key: "testing", label: "Testing" },
  { key: "forbidden", label: "Forbidden Changes" },
  { key: "uncertainty", label: "Uncertainty Protocol" },
  { key: "dod", label: "Definition of Done" },
  { key: "traceability", label: "Traceability" },
  { key: "report", label: "Validation" },
  { key: "review", label: "AI Review" },
  { key: "export", label: "Export" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AgentPackageViewer({
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
  const [exportManifest, setExportManifest] =
    useState<ExportManifestPreview | null>(null);
  const [exportPreviewError, setExportPreviewError] = useState<string | null>(null);
  const exportPreviewInFlight = useRef(false);

  const exportPreviewPending =
    !!doc &&
    doc.status === "approved" &&
    activeTab === "export" &&
    !exportManifest &&
    !exportPreviewError;

  const allPrerequisites = Object.values(prerequisites).every(Boolean);

  useEffect(() => {
    if (!exportPreviewPending || exportPreviewInFlight.current) return;
    exportPreviewInFlight.current = true;
    fetch(
      `/api/projects/${projectId}/agent-package/${doc!.id}/export?format=manifest`,
    )
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load export preview");
        }
        setExportManifest(json.manifest as ExportManifestPreview);
      })
      .catch((err) => {
        setExportPreviewError(
          err instanceof Error ? err.message : String(err),
        );
      })
      .finally(() => {
        exportPreviewInFlight.current = false;
      });
  }, [exportPreviewPending, doc, projectId]);

  const validation = useMemo(() => {
    if (!doc) return null;
    return validateAgentPackageDocument(
      doc.content,
      validationContext ?? undefined,
    );
  }, [doc, validationContext]);

  const errorIssues = useMemo(
    () => (validation ? validation.issues.filter((i) => i.severity === "error") : []),
    [validation],
  );
  const warningIssues = useMemo(
    () => (validation ? validation.issues.filter((i) => i.severity === "warning") : []),
    [validation],
  );

  const reviewData = doc?.review_data ?? null;
  const decisions = useMemo(() => doc?.decisions ?? [], [doc]);
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
      const res = await fetch(`/api/projects/${projectId}/agent-package`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate package");
      setDoc({
        id: json.doc_id,
        status: "draft",
        content: json.package,
        created_at: new Date().toISOString(),
        approved_at: null,
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
      const res = await fetch(`/api/projects/${projectId}/agent-package/review`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate review");
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
      const res = await fetch(`/api/projects/${projectId}/agent-package/${doc!.id}`, {
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
      });
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
        `/api/projects/${projectId}/agent-package/${doc!.id}/approve`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve package");
      setDoc((prev) =>
        prev
          ? { ...prev, status: "approved", approved_at: new Date().toISOString() }
          : null,
      );
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
          <span className="badge badge-neutral">Agent Package</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>Prerequisites Not Met</h3>
          <p>
            The Agent Package cannot be generated until Requirements,
            Architecture, ERD, DFD, Flowchart, and Implementation Blueprint are
            approved.
          </p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="vp-page bp-layout">
        <header className="bp-header">
          <span className="badge badge-neutral">Agent Package</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>No Agent Package</h3>
          <p>
            Generate an agent package to constrain and guide the downstream
            coding agent.
          </p>
          {error && (
            <div className="alert alert-danger" style={{ margin: "16px auto", maxWidth: 400 }}>
              {error}
            </div>
          )}
          <button
            className={`btn btn-primary ${loading ? "is-loading" : ""}`}
            onClick={handleGenerate}
            disabled={loading || !isOwner}
          >
            {loading ? "Generating Agent Package..." : "Generate Agent Package"}
          </button>
        </div>
      </div>
    );
  }

  const { content } = doc;
  const isApproved = doc.status === "approved";
  const isReview = doc.status === "review";
  const canApprove =
    isOwner && isReview && unresolvedRequired.length === 0 && errorIssues.length === 0;

  return (
    <div className="bp-layout">
      <header className="bp-header">
        <div className="bp-header-inner">
          <div>
            <span className="badge badge-neutral">Agent Package</span>
            <h1>{projectName}</h1>
          </div>
          <div className="bp-actions">
            <span
              className={`badge ${
                isApproved ? "badge-approved" : isReview ? "badge-review" : "badge-draft"
              }`}
            >
              {isApproved ? "Approved" : isReview ? "In Review" : "Draft"}
            </span>
            {isApproved && (
              <a
                className="btn btn-secondary"
                href={`/api/projects/${projectId}/agent-package/${doc.id}/export`}
                aria-label="Download export package as ZIP"
              >
                Export Package
              </a>
            )}
            {isOwner && !isApproved && (
              <>
                {!isReview ? (
                  <button
                    className={`btn btn-secondary ${reviewLoading ? "is-loading" : ""}`}
                    onClick={handleGenerateReview}
                    disabled={reviewLoading || errorIssues.length > 0}
                  >
                    Generate AI Review
                  </button>
                ) : (
                  <button
                    className={`btn btn-primary ${approveLoading ? "is-loading" : ""}`}
                    onClick={handleApprove}
                    disabled={!canApprove || approveLoading}
                  >
                    Approve Package
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === "report" && errorIssues.length > 0 ? " (!)" : ""}
              {tab.key === "review" && unresolvedRequired.length > 0
                ? ` (${unresolvedRequired.length})`
                : ""}
            </button>
          ))}
        </div>
      </header>

      <main className="bp-content">
        {activeTab === "overview" && (
          <div className="bp-section">
            <div className="card">
              <h2>{content.title}</h2>
              <p>{content.description}</p>
              <h3 style={{ marginTop: 24 }}>Project Context</h3>
              <p>{content.project_context.project_summary}</p>
              <p>
                <strong>Target users:</strong> {content.project_context.target_users.join(", ")}
              </p>
              <p>
                <strong>Primary goals:</strong> {content.project_context.primary_goals.join(", ")}
              </p>
              <h3 style={{ marginTop: 24 }}>Assumptions</h3>
              <ul>
                {content.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "contract" && (
          <div className="bp-section">
            <div className="card">
              <h3>Objective</h3>
              <p>{content.agent_contract.objective}</p>
            </div>
            <div className="bp-grid" style={{ marginTop: 16 }}>
              <div className="card">
                <h4>MUST</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {content.agent_contract.must.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h4>MUST NOT</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {content.agent_contract.must_not.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h4>Allowed Changes</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {content.agent_contract.allowed_changes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h4>Prohibited Changes</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {content.agent_contract.prohibited_changes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h4>Required Checks</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {content.agent_contract.required_checks.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h4>Escalation Rules</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {content.agent_contract.escalation_rules.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h4>Completion Rules</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {content.agent_contract.completion_rules.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Rule</th>
                </tr>
              </thead>
              <tbody>
                {content.project_rules.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge badge-neutral">{r.category}</span>
                    </td>
                    <td>{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "strategy" && (
          <div className="bp-section">
            <div className="card">
              <h3>Implementation Phases</h3>
              {content.implementation_strategy.phases.map((p) => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <strong>{p.name}</strong>
                  <p className="bp-text-small">Modules: {p.modules.join(", ")}</p>
                </div>
              ))}
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Dependency Order</h3>
              <p className="bp-text-small">
                {content.implementation_strategy.dependency_order.join(" → ")}
              </p>
            </div>
          </div>
        )}

        {activeTab === "modules" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.modules.map((m) => (
                <div key={m.id} className="card">
                  <div className="card-header">
                    <h3>
                      {m.name}{" "}
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        ({m.code})
                      </span>
                    </h3>
                  </div>
                  <div className="card-content">
                    <p>{m.purpose}</p>
                    <p className="bp-text-small">
                      <strong>Order:</strong> {m.implementation_order}
                    </p>
                    <p className="bp-text-small">
                      <strong>Roles:</strong> {m.authorization.roles.join(", ")}
                    </p>
                    {m.dependencies.length > 0 && (
                      <p className="bp-text-small">
                        <strong>Dependencies:</strong> {m.dependencies.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.database_instructions.map((d) => (
                <div key={d.table_name} className="card">
                  <h4>{d.table_name}</h4>
                  <p className="bp-text-small">
                    <strong>Source Entity:</strong> {d.source_entity_id}
                  </p>
                  <p className="bp-text-small">
                    <strong>PK:</strong> {d.primary_key}
                  </p>
                  <p className="bp-text-small">
                    <strong>Timestamps:</strong> {d.timestamps_required ? "Required" : "Not required"}
                  </p>
                  {d.rls_requirements.length > 0 && (
                    <div className="bp-text-small" style={{ marginTop: 8 }}>
                      <strong>RLS:</strong>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {d.rls_requirements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {content.api_contracts.map((api) => (
                  <tr key={api.id}>
                    <td>
                      <strong>{api.method}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: 12 }}>{api.route}</code>
                    </td>
                    <td>{api.module_id}</td>
                    <td>{api.authentication_required ? "Yes" : "No"}</td>
                    <td>{api.authorization.roles.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "frontend" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.frontend_instructions.map((f) => (
                <div key={f.module_id} className="card">
                  <h4>{f.module_id}</h4>
                  <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                    {f.instructions.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "backend" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.backend_instructions.map((b) => (
                <div key={b.module_id} className="card">
                  <h4>{b.module_id}</h4>
                  <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                    {b.instructions.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "authn" && (
          <div className="bp-section">
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {content.authentication_instructions.map((a, i) => (
                    <tr key={i}>
                      <td>{a.component}</td>
                      <td>{a.instruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "authz" && (
          <div className="bp-section">
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Role / Permission</th>
                    <th>Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {content.authorization_instructions.map((a, i) => (
                    <tr key={i}>
                      <td>{a.role_or_permission}</td>
                      <td>{a.instruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "validation" && (
          <div className="bp-section">
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {content.validation_instructions.map((v, i) => (
                    <tr key={i}>
                      <td>{v.target}</td>
                      <td>{v.instruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bp-section">
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {content.security_instructions.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <span className="badge badge-neutral">{s.category}</span>
                      </td>
                      <td>{s.instruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "testing" && (
          <div className="bp-section">
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Category</th>
                    <th>Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {content.testing_instructions.map((t, i) => (
                    <tr key={i}>
                      <td>{t.module_id}</td>
                      <td>
                        <span className="badge badge-neutral">{t.category}</span>
                      </td>
                      <td>{t.instruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "forbidden" && (
          <div className="bp-section">
            <div className="card">
              <div className="bp-grid">
                {content.forbidden_changes.map((f, i) => (
                  <div key={i} className="alert alert-danger">
                    <div>
                      <strong>{f.category}</strong>
                      <p style={{ margin: "4px 0 0" }}>{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "uncertainty" && (
          <div className="bp-section">
            <div className="card">
              <h3>Triggers</h3>
              <ul style={{ paddingLeft: 20 }}>
                {content.uncertainty_protocol.triggers.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <h3 style={{ marginTop: 16 }}>Required Actions</h3>
              <ol style={{ paddingLeft: 20 }}>
                {content.uncertainty_protocol.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {activeTab === "dod" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.definition_of_done.map((d, i) => (
                <div key={i} className="card">
                  <h4>{d.category}</h4>
                  <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                    {d.criteria.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "traceability" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Requirements</th>
                  <th>Architecture</th>
                  <th>Blueprint</th>
                </tr>
              </thead>
              <tbody>
                {content.traceability.map((t) => (
                  <tr key={t.module_id}>
                    <td>{t.module_id}</td>
                    <td>{t.upstream_links.requirement_ids.join(", ")}</td>
                    <td>{t.upstream_links.architecture_module_ids.join(", ")}</td>
                    <td>{t.upstream_links.blueprint_module_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "report" && (
          <div className="bp-section">
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Deterministic Validation</h3>
              {errorIssues.length === 0 && warningIssues.length === 0 ? (
                <div className="alert alert-success">Validation passed. No issues found.</div>
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
                      <div
                        className="card-header"
                        style={{ display: "flex", justifyContent: "space-between" }}
                      >
                        <h4 style={{ margin: 0 }}>
                          <span
                            className={`badge ${isImportant ? "badge-danger" : "badge-warning"}`}
                            style={{ marginRight: 8 }}
                          >
                            {issue.severity}
                          </span>
                          {issue.title}
                        </h4>
                      </div>
                      <div className="card-content">
                        <p className="bp-text-small">{issue.description}</p>
                        <p className="bp-text-small" style={{ fontStyle: "italic" }}>
                          Evidence: {issue.evidence}
                        </p>
                        <p className="bp-text-small">
                          <strong>Recommendation:</strong> {issue.recommendation}
                        </p>
                        {issue.requires_user_decision && !isApproved && (
                          <div
                            style={{
                              marginTop: 16,
                              paddingTop: 16,
                              borderTop: "1px solid var(--color-border)",
                            }}
                          >
                            {decision ? (
                              <p className="bp-text-small">
                                <strong>Decision:</strong>{" "}
                                <span style={{ textTransform: "capitalize" }}>
                                  {decision.action}
                                </span>
                                {decision.custom_text ? ` - ${decision.custom_text}` : ""}
                              </p>
                            ) : isOwner ? (
                              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleDecision(issue.id, "accept")}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDecision(issue.id, "ignore")}
                                  >
                                    Ignore
                                  </button>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <input
                                    className="input"
                                    style={{ flex: 1 }}
                                    placeholder="Custom resolution..."
                                    value={customInputs[issue.id] || ""}
                                    onChange={(e) =>
                                      setCustomInputs({
                                        ...customInputs,
                                        [issue.id]: e.target.value,
                                      })
                                    }
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
                              <p className="bp-text-small" style={{ color: "var(--color-warning)" }}>
                                Awaiting owner decision.
                              </p>
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

        {activeTab === "export" && (
          <div className="bp-section">
            {!isApproved ? (
              <div className="empty-state">
                <h3>Export available after approval.</h3>
                <p>
                  The delivery package can only be generated from an approved
                  Agent Package.
                </p>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <h3>Export Package</h3>
                </div>
                <div className="card-content">
                  <div className="bp-grid">
                    <div>
                      <p className="bp-text-small">Project</p>
                      <p>{projectName}</p>
                    </div>
                    <div>
                      <p className="bp-text-small">Status</p>
                      <p>
                        <span className="badge badge-approved">Approved</span>
                      </p>
                    </div>
                    <div>
                      <p className="bp-text-small">Files</p>
                      <p>
                        {exportPreviewPending
                          ? "Loading…"
                          : exportManifest
                            ? `${exportManifest.files.length} files + MANIFEST.json`
                            : exportPreviewError
                              ? "Unavailable"
                              : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="bp-text-small">Format</p>
                      <p>
                        VibePlan Agent Package v
                        {exportManifest?.format_version ?? "1.0"}
                      </p>
                    </div>
                    <div>
                      <p className="bp-text-small">Package version</p>
                      <p>{content.version}</p>
                    </div>
                    <div>
                      <p className="bp-text-small">Source artifacts</p>
                      <p>6 approved documents</p>
                    </div>
                    <div>
                      <p className="bp-text-small">Last approved</p>
                      <p>
                        {doc.approved_at
                          ? new Date(doc.approved_at).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <p className="bp-text-small">Includes</p>
                    <p>
                      ✓ Agent Contract ✓ Implementation Strategy ✓ Modules ✓
                      API Contracts ✓ Database Plan ✓ Security Plan ✓ Testing
                      Plan ✓ Traceability ✓ Approved upstream artifacts ✓
                      Blueprint
                    </p>
                  </div>

                  {exportPreviewError && (
                    <div
                      className="alert alert-danger"
                      style={{ marginTop: 16 }}
                    >
                      {exportPreviewError}
                    </div>
                  )}

                  {exportManifest && (
                    <details style={{ marginTop: 16 }}>
                      <summary className="bp-text-small">
                        File list ({exportManifest.files.length})
                      </summary>
                      <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                        {exportManifest.files.map((f) => (
                          <li key={f.path}>
                            <code>{f.path}</code> — {f.bytes} bytes
                          </li>
                        ))}
                        <li>
                          <code>MANIFEST.json</code>
                        </li>
                      </ul>
                    </details>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <a
                      className="btn btn-primary"
                      href={`/api/projects/${projectId}/agent-package/${doc.id}/export`}
                      aria-label="Download export package as ZIP"
                    >
                      Download Export Package
                    </a>
                    <p className="bp-text-small" style={{ marginTop: 8 }}>
                      Downloads a deterministic ZIP of the approved artifacts.
                      It does not run a coding agent or generate source code.
                    </p>
                  </div>
                </div>
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
