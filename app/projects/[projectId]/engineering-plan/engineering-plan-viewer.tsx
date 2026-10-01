"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { validateEngineeringPlanDocument } from "@/lib/ai/engineering-plan";
import type {
  EngineeringPlanDocument,
  EngineeringReview,
  EngineeringReviewDecision,
  EngineeringPlanUpstreamContext,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: EngineeringPlanDocument;
  created_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  review_data: EngineeringReview | null;
  decisions: EngineeringReviewDecision[];
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
    agent_package: boolean;
    design_system: boolean;
  };
  validationContext: EngineeringPlanUpstreamContext | null;
  initialDoc: DocState | null;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "stack", label: "Stack" },
  { key: "repository", label: "Repository" },
  { key: "modules", label: "Modules" },
  { key: "database", label: "Database" },
  { key: "api", label: "API" },
  { key: "authentication", label: "Authentication" },
  { key: "authorization", label: "Authorization" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "validation", label: "Validation (strategy)" },
  { key: "security", label: "Security" },
  { key: "testing", label: "Testing" },
  { key: "phases", label: "Phases" },
  { key: "tasks", label: "Tasks" },
  { key: "dependencies", label: "Dependencies" },
  { key: "traceability", label: "Traceability" },
  { key: "uncertainty", label: "Uncertainty" },
  { key: "forbidden", label: "Forbidden Changes" },
  { key: "completion", label: "Completion" },
  { key: "review", label: "Review" },
  { key: "report", label: "Validation (results)" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="ep-h">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="ep-p">{children}</p>;
}

function Muted() {
  return <p className="ep-muted">None</p>;
}

function Ul({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <Muted />;
  return (
    <ul className="ep-ul">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Chips({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <Muted />;
  return (
    <div className="ep-chips">
      {items.map((item, i) => (
        <span className="ep-chip" key={i}>
          {item}
        </span>
      ))}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ep-kv">
      <span>{label}</span>
      <div>{value}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="ep-card">{children}</div>;
}

function Badge({ text, kind }: { text: string; kind?: string }) {
  return <span className={`ep-badge ${kind ? `ep-badge-${kind}` : ""}`}>{text}</span>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ep-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function EngineeringPlanViewer({
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

  const allPrerequisites = Object.values(prerequisites).every(Boolean);

  const validation = useMemo(() => {
    if (!doc) return null;
    return validateEngineeringPlanDocument(
      doc.content,
      validationContext ?? undefined,
    );
  }, [doc, validationContext]);

  const errorIssues = useMemo(
    () =>
      validation ? validation.issues.filter((i) => i.severity === "error") : [],
    [validation],
  );
  const warningIssues = useMemo(
    () =>
      validation ? validation.issues.filter((i) => i.severity === "warning") : [],
    [validation],
  );

  const reviewData = doc?.review_data ?? null;
  const decisions = useMemo(() => doc?.decisions ?? [], [doc]);
  const resolvedIds = useMemo(
    () => new Set(decisions.map((d) => d.issue_id)),
    [decisions],
  );

  const coverage = useMemo(() => {
    if (!reviewData) return { resolved: 0, total: 0, complete: false };
    const resolved = reviewData.issues.filter((i) => resolvedIds.has(i.id)).length;
    return {
      resolved,
      total: reviewData.issues.length,
      complete: resolved === reviewData.issues.length,
    };
  }, [reviewData, resolvedIds]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/engineering-plan`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate engineering plan");
      setDoc({
        id: json.doc_id,
        status: "draft",
        content: json.engineering_plan,
        created_at: new Date().toISOString(),
        approved_at: null,
        approved_by: null,
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
      const res = await fetch(`/api/projects/${projectId}/engineering-plan/review`, {
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
    decision: "accept" | "ignore" | "custom",
  ) {
    setError(null);
    try {
      const rationale =
        decision === "custom" ? customInputs[issueId] : undefined;
      const res = await fetch(
        `/api/projects/${projectId}/engineering-plan/${doc!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: {
              issue_id: issueId,
              decision,
              rationale,
              resolved_at: new Date().toISOString(),
            },
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save decision");
      setDoc((prev) => (prev ? { ...prev, ...json.doc } : prev));
      if (decision === "custom") {
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
        `/api/projects/${projectId}/engineering-plan/${doc!.id}/approve`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve engineering plan");
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              status: "approved",
              approved_at: new Date().toISOString(),
              approved_by: prev.approved_by ?? null,
            }
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
    const missing = Object.entries(prerequisites)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);
    return (
      <div className="vp-page bp-layout">
        <header className="bp-header">
          <span className="badge badge-neutral">Engineering Plan</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>Prerequisites Not Met</h3>
          <p>
            The Engineering Plan cannot be generated until Requirements,
            Architecture, ERD, DFD, Flowchart, Implementation Blueprint, Agent
            Package, and Design System are approved.
          </p>
          <p className="bp-text-small">Blocking: {missing.join(", ")}</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="vp-page bp-layout">
        <header className="bp-header">
          <span className="badge badge-neutral">Engineering Plan</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>No Engineering Plan</h3>
          <p>
            Generate a project-specific engineering plan derived from the approved
            upstream artifacts: requirements, architecture, data model, processes,
            blueprint, agent package, and design system.
          </p>
          {error && (
            <div
              className="alert alert-danger"
              style={{ margin: "16px auto", maxWidth: 400 }}
            >
              {error}
            </div>
          )}
          <button
            className={`btn btn-primary ${loading ? "is-loading" : ""}`}
            onClick={handleGenerate}
            disabled={loading || !isOwner}
          >
            {loading ? "Generating Engineering Plan..." : "Generate Engineering Plan"}
          </button>
        </div>
      </div>
    );
  }

  const { content } = doc;
  const isApproved = doc.status === "approved";
  const isReview = doc.status === "review";
  const canApprove =
    isOwner && isReview && coverage.complete && errorIssues.length === 0;

  const taskCount = content.implementation_tasks?.length ?? 0;
  const phaseCount = content.implementation_phases?.length ?? 0;
  const moduleCount = content.modules?.length ?? 0;
  const apiCount = content.api_implementation?.length ?? 0;
  const tableCount = content.database_implementation?.tables?.length ?? 0;
  const pageCount = content.frontend_implementation?.pages?.length ?? 0;

  return (
    <div className="bp-layout">
      <header className="bp-header">
        <div className="bp-header-inner">
          <div>
            <span className="badge badge-neutral">Engineering Plan</span>
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
              <span className="badge badge-neutral" title="Approved documents are immutable">
                Immutable
              </span>
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
                    Approve Engineering Plan
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
              {tab.key === "review" && reviewData && !coverage.complete
                ? ` (${coverage.total - coverage.resolved})`
                : ""}
            </button>
          ))}
        </div>
      </header>

      <main className="bp-content">
        {activeTab === "overview" && (
          <section>
            <H>{content.title}</H>
            <P>{content.description}</P>
            <div className="ep-stats">
              <Stat label="Modules" value={moduleCount} />
              <Stat label="Phases" value={phaseCount} />
              <Stat label="Tasks" value={taskCount} />
              <Stat label="API Endpoints" value={apiCount} />
              <Stat label="Tables" value={tableCount} />
              <Stat label="Frontend Pages" value={pageCount} />
            </div>
            <H>Project Summary</H>
            <KV label="Project" value={content.project_summary?.project_name} />
            <P>{content.project_summary?.overview}</P>
            <KV label="Target Users" value={<Chips items={content.project_summary?.target_users} />} />
            <KV label="Primary Goals" value={<Ul items={content.project_summary?.primary_goals} />} />
            <H>Engineering Principles</H>
            <div className="ep-grid">
              {content.engineering_principles?.map((p) => (
                <Card key={p.id}>
                  <div className="ep-card-head">
                    <Badge text={p.id} />
                    <strong>{p.principle}</strong>
                  </div>
                  <P>{p.description}</P>
                </Card>
              ))}
            </div>
            <KV label="Version" value={content.version} />
          </section>
        )}

        {activeTab === "stack" && (
          <section>
            <H>Technology Stack</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Technology</th>
                  <th>Version</th>
                  <th>Justification</th>
                </tr>
              </thead>
              <tbody>
                {content.technology_stack?.map((s) => (
                  <tr key={s.id}>
                    <td>{s.category}</td>
                    <td>
                      <strong>{s.technology}</strong>
                    </td>
                    <td>{s.version}</td>
                    <td>{s.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <H>Environments</H>
            <div className="ep-grid">
              {content.environment_requirements?.environments?.map((env) => (
                <Card key={env.id}>
                  <div className="ep-card-head">
                    <strong>{env.name}</strong>
                    <Badge text={env.id} />
                  </div>
                  <P>{env.purpose}</P>
                  <table className="ep-table ep-table-tight">
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Description</th>
                        <th>Secret</th>
                      </tr>
                    </thead>
                    <tbody>
                      {env.variables.map((v) => (
                        <tr key={v.name}>
                          <td>
                            <code>{v.name}</code>
                          </td>
                          <td>{v.description}</td>
                          <td>{v.secret ? <Badge text="secret" kind="warn" /> : "no"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))}
            </div>
            <H>Local Setup</H>
            <Ul items={content.environment_requirements?.local_setup} />
            <H>CI Requirements</H>
            <Ul items={content.environment_requirements?.ci_requirements} />
          </section>
        )}

        {activeTab === "repository" && (
          <section>
            <H>Repository Strategy</H>
            <KV label="Branching Model" value={content.repository_strategy?.branching_model} />
            <KV label="Commit Conventions" value={content.repository_strategy?.commit_conventions} />
            <KV label="Review Process" value={content.repository_strategy?.review_process} />
            <KV label="Release Strategy" value={content.repository_strategy?.release_strategy} />
            <KV label="Structure Notes" value={<Ul items={content.repository_strategy?.structure_notes} />} />
            <H>File Plan</H>
            <div className="ep-grid ep-grid-3">
              <Card>
                <div className="ep-card-head">
                  <Badge text="Create" kind="ok" />
                </div>
                <table className="ep-table ep-table-tight">
                  <tbody>
                    {content.directory_structure?.file_plan?.create?.map((f) => (
                      <tr key={f.path}>
                        <td>
                          <code>{f.path}</code>
                        </td>
                        <td>{f.module_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card>
                <div className="ep-card-head">
                  <Badge text="Modify" kind="warn" />
                </div>
                <table className="ep-table ep-table-tight">
                  <tbody>
                    {content.directory_structure?.file_plan?.modify?.map((f) => (
                      <tr key={f.path}>
                        <td>
                          <code>{f.path}</code>
                        </td>
                        <td>{f.module_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card>
                <div className="ep-card-head">
                  <Badge text="Preserve" kind="neutral" />
                </div>
                <table className="ep-table ep-table-tight">
                  <tbody>
                    {content.directory_structure?.file_plan?.preserve?.map((f) => (
                      <tr key={f.path}>
                        <td>
                          <code>{f.path}</code>
                        </td>
                        <td>{f.module_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
            <H>Conventions</H>
            <Ul items={content.directory_structure?.conventions} />
          </section>
        )}

        {activeTab === "modules" && (
          <section>
            <H>Modules ({moduleCount})</H>
            <div className="ep-grid">
              {content.modules?.map((m) => (
                <Card key={m.module_id}>
                  <div className="ep-card-head">
                    <strong>{m.name}</strong>
                    <Badge text={`#${m.implementation_order}`} kind="ok" />
                  </div>
                  <P>{m.purpose}</P>
                  <KV label="Frontend Work" value={<Ul items={m.frontend_work} />} />
                  <KV label="Backend Work" value={<Ul items={m.backend_work} />} />
                  <KV label="Database Work" value={<Ul items={m.database_work} />} />
                  <KV label="API Work" value={<Ul items={m.api_work} />} />
                  <KV label="Auth Work" value={<Ul items={m.auth_work} />} />
                  <KV label="Validation Work" value={<Ul items={m.validation_work} />} />
                  <KV label="Testing Work" value={<Ul items={m.testing_work} />} />
                  <KV label="Dependencies" value={<Chips items={m.dependencies} />} />
                  <div className="ep-meta-row">
                    <Badge text={`${m.traceability.requirement_ids.length} reqs`} />
                    <Badge text={`${m.traceability.architecture_module_ids.length} arch`} />
                    <Badge text={`${m.traceability.erd_entity_ids.length} entities`} />
                    <Badge text={`${m.traceability.blueprint_module_ids.length} blueprint`} />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {activeTab === "database" && (
          <section>
            <H>Tables ({tableCount})</H>
            <div className="ep-grid">
              {content.database_implementation?.tables?.map((t) => (
                <Card key={t.table_name}>
                  <div className="ep-card-head">
                    <strong>{t.table_name}</strong>
                    <Badge text={t.entity_id} />
                  </div>
                  <P>{t.purpose}</P>
                  {t.assumption && (
                    <div className="alert alert-warning">Assumption: {t.assumption}</div>
                  )}
                  <table className="ep-table ep-table-tight">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Constraints</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.columns.map((c) => (
                        <tr key={c.name}>
                          <td>
                            <code>{c.name}</code>
                          </td>
                          <td>{c.type}</td>
                          <td>{c.constraints.join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {t.relationships.length > 0 && (
                    <>
                      <div className="ep-sub">Relationships</div>
                      <Ul
                        items={t.relationships.map(
                          (r) =>
                            `${r.from_column} → ${r.to_table}.${r.to_column} (${r.type})`,
                        )}
                      />
                    </>
                  )}
                  {t.indexes.length > 0 && (
                    <>
                      <div className="ep-sub">Indexes</div>
                      <Ul
                        items={t.indexes.map(
                          (i) => `${i.name} (${i.columns.join(", ")})${i.unique ? " unique" : ""}`,
                        )}
                      />
                    </>
                  )}
                  <KV label="Constraints" value={<Ul items={t.constraints} />} />
                  <div className="ep-sub">RLS Policies</div>
                  <Ul
                    items={t.rls.map((p) => `[${p.mode}] ${p.policy_name}: ${p.description}`)}
                  />
                </Card>
              ))}
            </div>
            <H>Migrations</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>ID</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[...(content.database_implementation?.migrations ?? [])]
                  .sort((a, b) => a.order - b.order)
                  .map((m) => (
                    <tr key={m.id}>
                      <td>{m.order}</td>
                      <td>
                        <code>{m.id}</code>
                      </td>
                      <td>{m.description}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <H>Seed Requirements</H>
            <Ul items={content.database_implementation?.seed_requirements} />
          </section>
        )}

        {activeTab === "api" && (
          <section>
            <H>API Endpoints ({apiCount})</H>
            <div className="ep-grid">
              {content.api_implementation?.map((api) => (
                <Card key={api.id}>
                  <div className="ep-card-head">
                    <Badge
                      text={api.method}
                      kind={api.method === "GET" ? "ok" : api.method === "DELETE" ? "warn" : "info"}
                    />
                    <code className="ep-path">{api.path}</code>
                    {api.authentication_required && <Badge text="auth required" kind="warn" />}
                  </div>
                  <P>{api.purpose}</P>
                  <div className="ep-meta-row">
                    <Badge text={api.module_id} kind="neutral" />
                    <Badge text={`${api.authorization.roles.length} roles`} />
                  </div>
                  <KV label="Roles" value={<Chips items={api.authorization.roles} />} />
                  <KV label="Permissions" value={<Chips items={api.authorization.permissions} />} />
                  <KV label="Request" value={api.request.description} />
                  <KV label="Body Fields" value={<Chips items={api.request.body_fields} />} />
                  <KV label="Query Params" value={<Chips items={api.request.query_params} />} />
                  <KV label="Response" value={api.response.description} />
                  <KV label="Response Fields" value={<Chips items={api.response.body_fields} />} />
                  <KV label="Validation" value={<Ul items={api.validation} />} />
                  <table className="ep-table ep-table-tight">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Condition</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {api.errors.map((e, i) => (
                        <tr key={i}>
                          <td>{e.status}</td>
                          <td>{e.condition}</td>
                          <td>{e.response_message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <KV label="DB Operations" value={<Ul items={api.database_operations} />} />
                  <KV label="Testing" value={<Ul items={api.testing} />} />
                </Card>
              ))}
            </div>
          </section>
        )}

        {activeTab === "authentication" && (
          <section>
            <H>Authentication</H>
            <KV label="Flow" value={content.authentication_implementation?.flow} />
            <H>Session Handling</H>
            <KV label="Strategy" value={content.authentication_implementation?.session_handling?.strategy} />
            <KV label="Storage" value={content.authentication_implementation?.session_handling?.storage} />
            <KV label="Expiration" value={content.authentication_implementation?.session_handling?.expiration} />
            <H>Mechanisms</H>
            <Chips items={content.authentication_implementation?.mechanisms} />
            <H>Protected Routes</H>
            <Chips items={content.authentication_implementation?.protected_routes} />
            <H>Public Routes</H>
            <Chips items={content.authentication_implementation?.public_routes} />
            <H>Implementation Notes</H>
            <Ul items={content.authentication_implementation?.implementation_notes} />
          </section>
        )}

        {activeTab === "authorization" && (
          <section>
            <H>Roles</H>
            <div className="ep-grid">
              {content.authorization_implementation?.roles?.map((r) => (
                <Card key={r.role}>
                  <div className="ep-card-head">
                    <strong>{r.role}</strong>
                    <Badge text={r.source} kind="neutral" />
                  </div>
                  <KV label="Permissions" value={<Chips items={r.permissions} />} />
                  <KV label="Module Access" value={<Chips items={r.module_access} />} />
                </Card>
              ))}
            </div>
            <H>Route Protection</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Methods</th>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {content.authorization_implementation?.route_protection?.map((rp) => (
                  <tr key={rp.route}>
                    <td>
                      <code>{rp.route}</code>
                    </td>
                    <td>{rp.methods.join(", ")}</td>
                    <td>{rp.roles.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <H>Frontend Visibility</H>
            <Ul items={content.authorization_implementation?.frontend_visibility} />
            <H>Server Enforcement</H>
            <Ul items={content.authorization_implementation?.server_enforcement} />
          </section>
        )}

        {activeTab === "frontend" && (
          <section>
            <H>Pages ({pageCount})</H>
            <div className="ep-grid">
              {content.frontend_implementation?.pages?.map((p) => (
                <Card key={p.id}>
                  <div className="ep-card-head">
                    <code className="ep-path">{p.route}</code>
                    <Badge text={p.screen_id} kind="info" />
                  </div>
                  <P>{p.purpose}</P>
                  <KV label="Components" value={<Chips items={p.components} />} />
                  <KV label="Forms" value={<Chips items={p.forms} />} />
                  <KV label="Tables" value={<Chips items={p.tables} />} />
                  <div className="ep-sub">Page States</div>
                  <div className="ep-meta-row">
                    <Badge text={`loading: ${p.states.loading}`} kind="neutral" />
                    <Badge text={`empty: ${p.states.empty}`} kind="neutral" />
                    <Badge text={`error: ${p.states.error}`} kind="neutral" />
                    <Badge text={`success: ${p.states.success}`} kind="neutral" />
                  </div>
                  <KV label="Responsive" value={p.responsive_behavior} />
                  <KV label="Accessibility" value={<Ul items={p.accessibility} />} />
                </Card>
              ))}
            </div>
            <H>Global Components</H>
            <Chips items={content.frontend_implementation?.global_components} />
            <H>Navigation Notes</H>
            <Ul items={content.frontend_implementation?.navigation_notes} />
          </section>
        )}

        {activeTab === "backend" && (
          <section>
            <H>Services</H>
            <div className="ep-grid">
              {content.backend_implementation?.services?.map((s) => (
                <Card key={s.id}>
                  <div className="ep-card-head">
                    <strong>{s.name}</strong>
                    <Badge text={s.module_id} kind="neutral" />
                  </div>
                  <P>{s.purpose}</P>
                  <Ul items={s.responsibilities} />
                </Card>
              ))}
            </div>
            <H>Data Access</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Table</th>
                  <th>Operations</th>
                  <th>Service</th>
                </tr>
              </thead>
              <tbody>
                {content.backend_implementation?.data_access?.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <code>{d.id}</code>
                    </td>
                    <td>{d.table}</td>
                    <td>{d.operations.join(", ")}</td>
                    <td>{d.service_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <H>Business Rules</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rule</th>
                  <th>Source Requirement</th>
                  <th>Service</th>
                </tr>
              </thead>
              <tbody>
                {content.backend_implementation?.business_rules?.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <code>{b.id}</code>
                    </td>
                    <td>{b.rule}</td>
                    <td>{b.source_requirement_id}</td>
                    <td>{b.service_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <H>Transactions</H>
            <div className="ep-grid">
              {content.backend_implementation?.transactions?.map((t) => (
                <Card key={t.id}>
                  <div className="ep-card-head">
                    <Badge text={t.id} />
                  </div>
                  <P>{t.description}</P>
                  <Ul items={t.steps} />
                </Card>
              ))}
            </div>
            <H>Error Boundaries</H>
            <Ul items={content.backend_implementation?.error_boundaries} />
          </section>
        )}

        {activeTab === "validation" && (
          <section>
            <H>Validation Strategy</H>
            <div className="ep-grid ep-grid-2">
              <div>
                <H>Client-Side</H>
                {content.validation_strategy?.client_side?.map((layer) => (
                  <Card key={layer.id}>
                    <div className="ep-card-head">
                      <strong>{layer.target}</strong>
                      <Badge text={layer.id} kind="neutral" />
                    </div>
                    <Ul items={layer.rules} />
                  </Card>
                ))}
              </div>
              <div>
                <H>Server-Side</H>
                {content.validation_strategy?.server_side?.map((layer) => (
                  <Card key={layer.id}>
                    <div className="ep-card-head">
                      <strong>{layer.target}</strong>
                      <Badge text={layer.id} kind="neutral" />
                    </div>
                    <Ul items={layer.rules} />
                  </Card>
                ))}
              </div>
            </div>
            <H>Shared Rules</H>
            <Ul items={content.validation_strategy?.shared_rules} />
            <H>Error Handling</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>HTTP</th>
                  <th>User Message</th>
                  <th>Logging</th>
                </tr>
              </thead>
              <tbody>
                {content.error_handling?.categories?.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.category}</strong>
                    </td>
                    <td>{c.http_status}</td>
                    <td>{c.user_message}</td>
                    <td>{c.logging}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <H>Retry Policies</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Strategy</th>
                </tr>
              </thead>
              <tbody>
                {content.error_handling?.retry_policies?.map((r) => (
                  <tr key={r.id}>
                    <td>{r.target}</td>
                    <td>{r.strategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <H>Global Handlers</H>
            <Ul items={content.error_handling?.global_handlers} />
          </section>
        )}

        {activeTab === "security" && (
          <section>
            <H>Security Implementation</H>
            <H>Secrets Handling</H>
            <Ul items={content.security_implementation?.secrets_handling} />
            <H>Input Sanitization</H>
            <Ul items={content.security_implementation?.input_sanitization} />
            <H>RLS Strategy</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Policies</th>
                </tr>
              </thead>
              <tbody>
                {content.security_implementation?.rls_strategy?.map((r) => (
                  <tr key={r.table}>
                    <td>
                      <code>{r.table}</code>
                    </td>
                    <td>{r.policies.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <H>Rate Limiting</H>
            <Ul items={content.security_implementation?.rate_limiting} />
            <H>Security Headers</H>
            <Chips items={content.security_implementation?.security_headers} />
            <H>Audit Logging</H>
            <Ul items={content.security_implementation?.audit_logging} />
          </section>
        )}

        {activeTab === "testing" && (
          <section>
            <H>Testing Strategy</H>
            <div className="ep-grid">
              {content.testing_strategy?.levels?.map((level) => (
                <Card key={level.id}>
                  <div className="ep-card-head">
                    <strong>{level.id}</strong>
                    <Badge text="required" kind="ok" />
                  </div>
                  <P>{level.approach}</P>
                  <KV label="Tools" value={<Chips items={level.tools} />} />
                  <KV label="Scope" value={<Ul items={level.scope} />} />
                </Card>
              ))}
            </div>
            <H>Coverage Expectations</H>
            <Ul items={content.testing_strategy?.coverage_expectations} />
            <H>Required Suites</H>
            <Ul items={content.testing_strategy?.required_suites} />
          </section>
        )}

        {activeTab === "phases" && (
          <section>
            <H>Implementation Phases ({phaseCount})</H>
            <div className="ep-grid">
              {[...(content.implementation_phases ?? [])]
                .sort((a, b) => a.order - b.order)
                .map((phase) => (
                  <Card key={phase.id}>
                    <div className="ep-card-head">
                      <Badge text={`Phase ${phase.order}`} kind="ok" />
                      <strong>{phase.name}</strong>
                      <Badge text={phase.kind} kind="info" />
                    </div>
                    <KV label="Tasks" value={<Chips items={phase.tasks} />} />
                    <KV label="Prerequisites" value={<Chips items={phase.dependencies} />} />
                    <KV label="Completion Checks" value={<Ul items={phase.completion_checks} />} />
                  </Card>
                ))}
            </div>
          </section>
        )}

        {activeTab === "tasks" && (
          <section>
            <H>Implementation Tasks ({taskCount})</H>
            <div className="ep-grid">
              {[...(content.implementation_tasks ?? [])]
                .sort((a, b) => a.implementation_order - b.implementation_order)
                .map((task) => (
                  <Card key={task.id}>
                    <div className="ep-card-head">
                      <Badge text={`#${task.implementation_order}`} kind="ok" />
                      <strong>{task.title}</strong>
                      <Badge
                        text={task.priority}
                        kind={
                          task.priority === "critical"
                            ? "danger"
                            : task.priority === "high"
                              ? "warn"
                              : "neutral"
                        }
                      />
                    </div>
                    <div className="ep-meta-row">
                      <Badge text={task.id} kind="neutral" />
                      <Badge text={`phase: ${task.phase}`} kind="info" />
                      <Badge text={`module: ${task.module_id}`} kind="neutral" />
                    </div>
                    <P>{task.description}</P>
                    <KV label="Depends On" value={<Chips items={task.dependencies} />} />
                    <div className="ep-grid ep-grid-3">
                      <div>
                        <div className="ep-sub ep-sub-ok">Files to Create</div>
                        <Ul items={task.files_to_create} />
                      </div>
                      <div>
                        <div className="ep-sub ep-sub-warn">Files to Modify</div>
                        <Ul items={task.files_to_modify} />
                      </div>
                      <div>
                        <div className="ep-sub">Do Not Modify</div>
                        <Ul items={task.files_not_to_modify} />
                      </div>
                    </div>
                    <KV label="Acceptance Criteria" value={<Ul items={task.acceptance_criteria} />} />
                    <KV label="Test Requirements" value={<Ul items={task.test_requirements} />} />
                  </Card>
                ))}
            </div>
          </section>
        )}

        {activeTab === "dependencies" && (
          <section>
            <H>External Dependencies ({content.dependencies?.length ?? 0})</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Version</th>
                  <th>Purpose</th>
                  <th>Required By</th>
                </tr>
              </thead>
              <tbody>
                {content.dependencies?.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Badge text={d.type} kind="info" />
                    </td>
                    <td>
                      <strong>{d.name}</strong>
                    </td>
                    <td>{d.version}</td>
                    <td>{d.purpose}</td>
                    <td>{d.required_by.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === "traceability" && (
          <section>
            {(() => {
              const tasks = content.traceability?.tasks ?? [];
              const uniq = (pick: (t: (typeof tasks)[number]) => string[]) =>
                new Set(tasks.flatMap(pick)).size;
              return (
                <>
                  <H>Traceability Rollup</H>
                  <div className="ep-stats">
                    <Stat label="Requirements" value={uniq((t) => t.requirement_ids)} />
                    <Stat label="Arch Modules" value={uniq((t) => t.architecture_module_ids)} />
                    <Stat label="ERD Entities" value={uniq((t) => t.erd_entity_ids)} />
                    <Stat label="DFD Processes" value={uniq((t) => t.dfd_process_ids)} />
                    <Stat label="Flowchart Processes" value={uniq((t) => t.flowchart_process_ids)} />
                    <Stat label="Blueprint Modules" value={uniq((t) => t.blueprint_module_ids)} />
                    <Stat label="Agent Package Modules" value={uniq((t) => t.agent_package_module_ids)} />
                    <Stat label="DS Screens" value={uniq((t) => t.design_system_screen_ids)} />
                    <Stat label="DS Components" value={uniq((t) => t.design_system_component_ids)} />
                  </div>
                  <H>Per-Task</H>
                  <table className="ep-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Requirements</th>
                        <th>Arch</th>
                        <th>ERD</th>
                        <th>Blueprint</th>
                        <th>DS Screens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t) => (
                        <tr key={t.task_id}>
                          <td>
                            <code>{t.task_id}</code>
                          </td>
                          <td>{t.requirement_ids.join(", ") || "—"}</td>
                          <td>{t.architecture_module_ids.join(", ") || "—"}</td>
                          <td>{t.erd_entity_ids.join(", ") || "—"}</td>
                          <td>{t.blueprint_module_ids.join(", ") || "—"}</td>
                          <td>{t.design_system_screen_ids.join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              );
            })()}
          </section>
        )}

        {activeTab === "uncertainty" && (
          <section>
            <H>Uncertainty Protocol</H>
            <div className="alert alert-warning">{content.uncertainty_protocol?.protocol}</div>
            <H>Stop Triggers ({content.uncertainty_protocol?.stop_triggers?.length ?? 0})</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Trigger</th>
                  <th>Condition</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {content.uncertainty_protocol?.stop_triggers?.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.id}</code>
                    </td>
                    <td>{s.trigger}</td>
                    <td>{s.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === "forbidden" && (
          <section>
            <H>Forbidden Changes ({content.forbidden_changes?.length ?? 0})</H>
            <div className="ep-grid">
              {content.forbidden_changes?.map((f) => (
                <Card key={f.id}>
                  <div className="ep-card-head">
                    <Badge text="blocking" kind="danger" />
                    <code>{f.id}</code>
                  </div>
                  <P>{f.rule}</P>
                  <div className="ep-sub">Rationale</div>
                  <P>{f.rationale}</P>
                </Card>
              ))}
            </div>
          </section>
        )}

        {activeTab === "completion" && (
          <section>
            <H>Completion Checks ({content.completion_checks?.length ?? 0})</H>
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Command</th>
                  <th>Description</th>
                  <th>Blocking</th>
                </tr>
              </thead>
              <tbody>
                {content.completion_checks?.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code>{c.id}</code>
                    </td>
                    <td>
                      <code>{c.command}</code>
                    </td>
                    <td>{c.description}</td>
                    <td>{c.blocking ? <Badge text="blocking" kind="danger" /> : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === "review" && (
          <section>
            {!reviewData ? (
              <div className="empty-state">
                <h3>No Review Yet</h3>
                <p>
                  Generate an AI review to get issue-by-issue feedback on this
                  engineering plan. Every issue must receive a decision before
                  approval.
                </p>
              </div>
            ) : (
              <>
                <H>
                  Review — {coverage.resolved}/{coverage.total} resolved
                </H>
                <div className="ep-progress">
                  <div
                    className="ep-progress-fill"
                    style={{
                      width: `${
                        coverage.total === 0 ? 100 : (coverage.resolved / coverage.total) * 100
                      }%`,
                    }}
                  />
                </div>
                {reviewData.issues.length === 0 && (
                  <div className="alert alert-success">
                    The review found no issues. The document is ready for approval.
                  </div>
                )}
                <div className="ep-grid">
                  {reviewData.issues.map((issue) => {
                    const decision = decisions.find((d) => d.issue_id === issue.id);
                    const isCritical = issue.severity === "critical";
                    return (
                      <Card key={issue.id}>
                        <div className="ep-card-head">
                          <span className={`ep-sev ep-sev-${issue.severity}`}>
                            {issue.severity}
                          </span>
                          <strong>{issue.title}</strong>
                          <Badge text={issue.category} kind="neutral" />
                        </div>
                        <P>{issue.description}</P>
                        {issue.evidence && (
                          <>
                            <div className="ep-sub">Evidence</div>
                            <P>{issue.evidence}</P>
                          </>
                        )}
                        {issue.suggested_resolution && (
                          <>
                            <div className="ep-sub">Suggested Resolution</div>
                            <P>{issue.suggested_resolution}</P>
                          </>
                        )}
                        {issue.source_references.length > 0 && (
                          <div className="ep-meta-row">
                            {issue.source_references.map((ref, i) => (
                              <Badge key={i} text={ref} kind="neutral" />
                            ))}
                          </div>
                        )}
                        <div className="ep-decisions">
                          <button
                            className={`btn btn-secondary ${decision?.decision === "accept" ? "is-active" : ""}`}
                            onClick={() => handleDecision(issue.id, "accept")}
                            disabled={!isOwner || isApproved}
                          >
                            Accept
                          </button>
                          <button
                            className={`btn btn-secondary ${decision?.decision === "ignore" ? "is-active" : ""}`}
                            onClick={() => handleDecision(issue.id, "ignore")}
                            disabled={!isOwner || isApproved || isCritical}
                            title={
                              isCritical
                                ? "Critical issues cannot be ignored and block approval."
                                : undefined
                            }
                          >
                            Ignore
                          </button>
                          <input
                            className="ep-input"
                            placeholder="Custom rationale..."
                            value={customInputs[issue.id] ?? ""}
                            onChange={(e) =>
                              setCustomInputs((prev) => ({
                                ...prev,
                                [issue.id]: e.target.value,
                              }))
                            }
                            disabled={!isOwner || isApproved}
                          />
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDecision(issue.id, "custom")}
                            disabled={
                              !isOwner ||
                              isApproved ||
                              !(customInputs[issue.id] ?? "").trim()
                            }
                          >
                            Save Custom
                          </button>
                        </div>
                        {decision && (
                          <div className="ep-decision-state">
                            Decision: <strong>{decision.decision}</strong>
                            {decision.rationale ? ` — ${decision.rationale}` : ""}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
                {isReview && coverage.complete && errorIssues.length === 0 && isOwner && (
                  <div className="alert alert-success">
                    All issues resolved and validation passed. Approve to finalize.
                  </div>
                )}
                {isReview && (!coverage.complete || errorIssues.length > 0) && (
                  <div className="alert alert-warning">
                    {!coverage.complete
                      ? `${coverage.total - coverage.resolved} issue(s) still need a decision.`
                      : "Deterministic validation has errors — fix before approving."}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === "report" && (
          <section>
            <H>Validation Results</H>
            <div className="ep-stats">
              <Stat label="Errors" value={errorIssues.length} />
              <Stat label="Warnings" value={warningIssues.length} />
              <Stat
                label="Other"
                value={
                  validation
                    ? validation.issues.length - errorIssues.length - warningIssues.length
                    : 0
                }
              />
            </div>
            {!validationContext && (
              <div className="alert alert-warning">
                Upstream validation context unavailable — cross-artifact checks are
                skipped.
              </div>
            )}
            {validation && validation.valid && (
              <div className="alert alert-success">
                The engineering plan passed all deterministic validation checks.
              </div>
            )}
            {validation && validation.issues.length > 0 && (
              <table className="ep-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Category</th>
                    <th>ID</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.issues.map((issue, i) => (
                    <tr key={`${issue.id}-${i}`}>
                      <td>
                        <span className={`ep-sev ep-sev-${issue.severity}`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td>{issue.category}</td>
                      <td>
                        <code>{issue.id}</code>
                      </td>
                      <td>{issue.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
.ep-h { font-size: 15px; font-weight: 700; margin: 20px 0 10px; }
.ep-h:first-child { margin-top: 0; }
.ep-p { color: var(--text-2, #555); font-size: 13.5px; line-height: 1.55; margin: 6px 0; }
.ep-muted { color: var(--text-3, #999); font-size: 12.5px; font-style: italic; margin: 4px 0; }
.ep-ul { margin: 4px 0; padding-left: 18px; font-size: 13px; color: var(--text-2, #555); }
.ep-ul li { margin: 3px 0; }
.ep-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0; }
.ep-chip { background: var(--surface-2, #eef1f5); border: 1px solid var(--border, #dfe3ea); border-radius: 999px; padding: 2px 10px; font-size: 12px; color: var(--text-1, #222); }
.ep-kv { display: grid; grid-template-columns: 160px 1fr; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border-soft, #eef1f5); font-size: 13px; }
.ep-kv > span { color: var(--text-3, #888); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; padding-top: 2px; }
.ep-card { background: var(--surface-1, #fff); border: 1px solid var(--border, #dfe3ea); border-radius: 10px; padding: 14px; }
.ep-card-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.ep-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: var(--surface-2, #eef1f5); color: var(--text-1, #222); }
.ep-badge-ok { background: #e5f6ec; color: #14713d; }
.ep-badge-warn { background: #fff4e0; color: #8a5a00; }
.ep-badge-danger { background: #fdecec; color: #a11; }
.ep-badge-info { background: #e8f1fd; color: #1d4f91; }
.ep-badge-neutral { background: var(--surface-2, #eef1f5); color: var(--text-2, #555); }
.ep-stats { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
.ep-stat { background: var(--surface-1, #fff); border: 1px solid var(--border, #dfe3ea); border-radius: 10px; padding: 10px 16px; min-width: 110px; text-align: center; }
.ep-stat strong { display: block; font-size: 22px; }
.ep-stat span { font-size: 11.5px; color: var(--text-3, #888); text-transform: uppercase; letter-spacing: 0.04em; }
.ep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
.ep-grid-2 { grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); }
.ep-grid-3 { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.ep-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0 16px; }
.ep-table th { text-align: left; padding: 8px 10px; background: var(--surface-2, #f3f5f8); border-bottom: 2px solid var(--border, #dfe3ea); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-3, #888); }
.ep-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-soft, #eef1f5); vertical-align: top; color: var(--text-1, #222); }
.ep-table-tight th, .ep-table-tight td { padding: 5px 8px; font-size: 12.5px; }
.ep-path { font-weight: 700; font-size: 13.5px; }
.ep-meta-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
.ep-sub { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3, #888); margin: 12px 0 4px; }
.ep-sub-ok { color: #14713d; }
.ep-sub-warn { color: #8a5a00; }
.ep-sev { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.ep-sev-error { background: #fdecec; color: #a11; }
.ep-sev-warning { background: #fff4e0; color: #8a5a00; }
.ep-sev-info { background: #e8f1fd; color: #1d4f91; }
.ep-progress { height: 8px; background: var(--surface-2, #eef1f5); border-radius: 999px; overflow: hidden; margin: 10px 0 16px; }
.ep-progress-fill { height: 100%; background: #2f9e63; transition: width 0.3s ease; }
.ep-decisions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
.ep-input { flex: 1; min-width: 180px; padding: 7px 10px; border: 1px solid var(--border, #dfe3ea); border-radius: 8px; font-size: 13px; background: var(--surface-1, #fff); }
.ep-decision-state { margin-top: 8px; font-size: 12.5px; color: var(--text-2, #555); }
`,
        }}
      />
    </div>
  );
}
