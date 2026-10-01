"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { validateDesignSystemDocument } from "@/lib/ai/design-system";
import type {
  DesignSystemDocument,
  DesignSystemReview,
  DesignSystemReviewDecision,
  DesignSystemUpstreamContext,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: DesignSystemDocument;
  created_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  review_data: DesignSystemReview | null;
  decisions: DesignSystemReviewDecision[];
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
  validationContext: DesignSystemUpstreamContext | null;
  initialDoc: DocState | null;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "principles", label: "Principles" },
  { key: "tokens", label: "Tokens" },
  { key: "typography", label: "Typography" },
  { key: "colors", label: "Colors" },
  { key: "spacing", label: "Spacing" },
  { key: "radius", label: "Radius" },
  { key: "elevation", label: "Elevation" },
  { key: "components", label: "Components" },
  { key: "layout", label: "Layout" },
  { key: "responsive", label: "Responsive" },
  { key: "navigation", label: "Navigation" },
  { key: "pages", label: "Page Patterns" },
  { key: "forms", label: "Forms" },
  { key: "tables", label: "Tables" },
  { key: "feedback", label: "Feedback" },
  { key: "accessibility", label: "Accessibility" },
  { key: "interactions", label: "Interactions" },
  { key: "screens", label: "Screens" },
  { key: "traceability", label: "Traceability" },
  { key: "review", label: "Review" },
  { key: "report", label: "Validation" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function DesignSystemViewer({
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
    return validateDesignSystemDocument(
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
      complete: reviewData.issues.length > 0 && resolved === reviewData.issues.length,
    };
  }, [reviewData, resolvedIds]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/design-system`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate design system");
      setDoc({
        id: json.doc_id,
        status: "draft",
        content: json.design_system,
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
      const res = await fetch(`/api/projects/${projectId}/design-system/review`, {
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
        `/api/projects/${projectId}/design-system/${doc!.id}`,
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
        `/api/projects/${projectId}/design-system/${doc!.id}/approve`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve design system");
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
          <span className="badge badge-neutral">Design System</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>Prerequisites Not Met</h3>
          <p>
            The Design System cannot be generated until Requirements,
            Architecture, ERD, DFD, Flowchart, and Implementation Blueprint are
            approved.
          </p>
          <p className="bp-text-small">
            Blocking: {missing.join(", ")}
          </p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="vp-page bp-layout">
        <header className="bp-header">
          <span className="badge badge-neutral">Design System</span>
          <h1>{projectName}</h1>
        </header>
        <div className="empty-state">
          <h3>No Design System</h3>
          <p>
            Generate a project-specific design system derived from the approved
            requirements, architecture, data model, processes, and blueprint.
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
            {loading ? "Generating Design System..." : "Generate Design System"}
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

  return (
    <div className="bp-layout">
      <header className="bp-header">
        <div className="bp-header-inner">
          <div>
            <span className="badge badge-neutral">Design System</span>
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
                    Approve Design System
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
          <div className="bp-section">
            <div className="card">
              <h2>{content.title}</h2>
              <p>{content.description}</p>
              {isApproved && (
                <div className="alert alert-success" style={{ marginTop: 16 }}>
                  <strong>Approved</strong> — this design system is immutable.
                  {doc.approved_at && (
                    <>
                      {" "}
                      Approved at {new Date(doc.approved_at).toLocaleString()}.
                    </>
                  )}
                  {doc.approved_by && <> Approved by {doc.approved_by}.</>}
                </div>
              )}
              <div className="bp-grid" style={{ marginTop: 16 }}>
                <div>
                  <p className="bp-text-small">Version</p>
                  <p>{content.version}</p>
                </div>
                <div>
                  <p className="bp-text-small">Source artifacts</p>
                  <p>6 approved documents</p>
                </div>
                <div>
                  <p className="bp-text-small">Components</p>
                  <p>{content.component_system.components.length}</p>
                </div>
                <div>
                  <p className="bp-text-small">Screens</p>
                  <p>{content.screen_specifications.length}</p>
                </div>
                <div>
                  <p className="bp-text-small">Page patterns</p>
                  <p>{content.page_patterns.length}</p>
                </div>
                <div>
                  <p className="bp-text-small">Accessibility rules</p>
                  <p>{content.accessibility_rules.length}</p>
                </div>
              </div>
              <h3 style={{ marginTop: 24 }}>Source Documents</h3>
              <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                <li>Requirements: {content._metadata.requirements_document_id}</li>
                <li>Architecture: {content._metadata.architecture_document_id}</li>
                <li>ERD: {content._metadata.erd_document_id}</li>
                <li>DFD: {content._metadata.dfd_document_id}</li>
                <li>Flowchart: {content._metadata.flowchart_document_id}</li>
                <li>Blueprint: {content._metadata.blueprint_document_id}</li>
              </ul>
              <h3 style={{ marginTop: 24 }}>Assumptions</h3>
              <ul>
                {content.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "principles" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.design_principles.map((p) => (
                <div key={p.id} className="card">
                  <h4>{p.principle}</h4>
                  <p className="bp-text-small">{p.description}</p>
                  <p className="bp-text-small">
                    <code>{p.id}</code>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Swatch</th>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Usage</th>
                  <th>Contrast</th>
                </tr>
              </thead>
              <tbody>
                {content.design_tokens.colors.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span
                        className="ds-swatch"
                        style={{ background: t.value }}
                        aria-hidden="true"
                      />
                    </td>
                    <td>
                      <strong>{t.name}</strong>
                      <br />
                      <code style={{ fontSize: 11 }}>{t.id}</code>
                    </td>
                    <td>
                      <code>{t.value}</code>
                    </td>
                    <td>{t.usage}</td>
                    <td className="bp-text-small">{t.contrast_notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "typography" && (
          <div className="bp-section">
            <div className="card">
              <h3>Font Family</h3>
              <p>
                <strong>{content.typography.font_family.primary}</strong> (fallback:{" "}
                {content.typography.font_family.fallback})
              </p>
              <p className="bp-text-small">{content.typography.font_family.usage}</p>
            </div>
            <div className="bp-grid" style={{ marginTop: 16 }}>
              <div className="card">
                <h4>Heading Scale</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Size</th>
                      <th>LH</th>
                      <th>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.typography.heading_scale.map((e) => (
                      <tr key={e.level}>
                        <td>{e.level}</td>
                        <td>
                          <code>{e.font_size}</code>
                        </td>
                        <td>
                          <code>{e.line_height}</code>
                        </td>
                        <td className="bp-text-small">{e.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h4>Body Scale</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Size</th>
                      <th>LH</th>
                      <th>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.typography.body_scale.map((e) => (
                      <tr key={e.level}>
                        <td>{e.level}</td>
                        <td>
                          <code>{e.font_size}</code>
                        </td>
                        <td>
                          <code>{e.line_height}</code>
                        </td>
                        <td className="bp-text-small">{e.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h4>Caption Scale</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Size</th>
                      <th>LH</th>
                      <th>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.typography.caption_scale.map((e) => (
                      <tr key={e.level}>
                        <td>{e.level}</td>
                        <td>
                          <code>{e.font_size}</code>
                        </td>
                        <td>
                          <code>{e.line_height}</code>
                        </td>
                        <td className="bp-text-small">{e.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h4>Font Weights</h4>
                <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                  {content.typography.font_weights.map((w) => (
                    <li key={w.id}>
                      <strong>{w.id}</strong>: <code>{w.value}</code> — {w.usage}
                    </li>
                  ))}
                </ul>
                <h4 style={{ marginTop: 12 }}>Line Heights</h4>
                <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                  {content.typography.line_heights.map((l) => (
                    <li key={l.id}>
                      <strong>{l.id}</strong>: <code>{l.value}</code> — {l.usage}
                    </li>
                  ))}
                </ul>
                <h4 style={{ marginTop: 12 }}>Letter Spacing</h4>
                <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                  {content.typography.letter_spacing.map((l) => (
                    <li key={l.id}>
                      <strong>{l.id}</strong>: <code>{l.value}</code> — {l.usage}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "colors" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Swatch</th>
                  <th>Role</th>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Usage</th>
                  <th>Contrast</th>
                </tr>
              </thead>
              <tbody>
                {content.color_system.colors.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span
                        className="ds-swatch"
                        style={{ background: c.value }}
                        aria-hidden="true"
                      />
                    </td>
                    <td>
                      <span className="badge badge-neutral">{c.id}</span>
                    </td>
                    <td>
                      <code>{c.token_id}</code>
                    </td>
                    <td>
                      <code>{c.value}</code>
                    </td>
                    <td>{c.usage}</td>
                    <td className="bp-text-small">{c.contrast_notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "spacing" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {content.spacing_system.scale.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.id}</strong>
                    </td>
                    <td>
                      <code>{s.value}</code>
                    </td>
                    <td>{s.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "radius" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {content.radius_system.scale.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.id}</strong>
                    </td>
                    <td>
                      <code>{r.value}</code>
                    </td>
                    <td>{r.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "elevation" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Value</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {content.elevation_system.levels.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.id}</strong>
                    </td>
                    <td>
                      <code>{e.value}</code>
                    </td>
                    <td>{e.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "components" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.component_system.components.map((c) => (
                <div key={c.id} className="card">
                  <div className="card-header">
                    <h3>
                      {c.name}{" "}
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        <code>{c.id}</code>
                      </span>
                    </h3>
                  </div>
                  <div className="card-content">
                    <p className="bp-text-small">{c.purpose}</p>
                    <p className="bp-text-small">
                      <strong>Interactive:</strong> {c.interactive ? "Yes" : "No"}
                    </p>
                    {c.variants.length > 0 && (
                      <p className="bp-text-small">
                        <strong>Variants:</strong> {c.variants.map((v) => v.name).join(", ")}
                      </p>
                    )}
                    {c.states.length > 0 && (
                      <p className="bp-text-small">
                        <strong>States:</strong> {c.states.map((s) => s.name).join(", ")}
                      </p>
                    )}
                    {c.anatomy.length > 0 && (
                      <p className="bp-text-small">
                        <strong>Anatomy:</strong> {c.anatomy.map((a) => a.part).join(", ")}
                      </p>
                    )}
                    <details style={{ marginTop: 8 }}>
                      <summary className="bp-text-small">Rules & accessibility</summary>
                      <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                        {c.behavior.map((b, i) => (
                          <li key={`b${i}`}>{b}</li>
                        ))}
                        {c.accessibility_requirements.map((a, i) => (
                          <li key={`a${i}`}>{a}</li>
                        ))}
                        {c.usage_rules.map((u, i) => (
                          <li key={`u${i}`}>{u}</li>
                        ))}
                        {c.forbidden_usage.map((f, i) => (
                          <li key={`f${i}`} style={{ color: "var(--color-danger)" }}>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "layout" && (
          <div className="bp-section">
            <div className="card">
              <div className="bp-grid">
                <div>
                  <p className="bp-text-small">Container strategy</p>
                  <p>{content.layout_rules.container_strategy}</p>
                </div>
                <div>
                  <p className="bp-text-small">Content width</p>
                  <p>{content.layout_rules.content_width}</p>
                </div>
                <div>
                  <p className="bp-text-small">Page padding</p>
                  <p>{content.layout_rules.page_padding}</p>
                </div>
                <div>
                  <p className="bp-text-small">Section spacing</p>
                  <p>{content.layout_rules.section_spacing}</p>
                </div>
                <div>
                  <p className="bp-text-small">Sidebar behavior</p>
                  <p>{content.layout_rules.sidebar_behavior}</p>
                </div>
                <div>
                  <p className="bp-text-small">Header behavior</p>
                  <p>{content.layout_rules.header_behavior}</p>
                </div>
              </div>
            </div>
            <div className="bp-grid" style={{ marginTop: 16 }}>
              <div className="card">
                <h4>Grid Rules</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Applies when</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.layout_rules.grid_rules.map((g) => (
                      <tr key={g.id}>
                        <td>{g.rule}</td>
                        <td className="bp-text-small">{g.applies_when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h4>Column Rules</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Applies when</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.layout_rules.column_rules.map((c) => (
                      <tr key={c.id}>
                        <td>{c.rule}</td>
                        <td className="bp-text-small">{c.applies_when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "responsive" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.responsive_rules.breakpoints.map((b) => (
                <div key={b.id} className="card">
                  <h4>
                    <span className="badge badge-neutral">{b.id}</span>{" "}
                    <code style={{ fontSize: 12 }}>{b.width_range}</code>
                  </h4>
                  <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                    {b.behaviors.map((behavior, i) => (
                      <li key={i}>{behavior}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "navigation" && (
          <div className="bp-section">
            <div className="card">
              <h3>Primary Navigation</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Route</th>
                    <th>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {content.navigation_system.primary_navigation.map((n) => (
                    <tr key={n.id}>
                      <td>{n.label}</td>
                      <td>
                        <code>{n.route}</code>
                      </td>
                      <td className="bp-text-small">{n.visibility}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {content.navigation_system.secondary_navigation.length > 0 && (
                <>
                  <h3 style={{ marginTop: 16 }}>Secondary Navigation</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Route</th>
                        <th>Visibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {content.navigation_system.secondary_navigation.map((n) => (
                        <tr key={n.id}>
                          <td>{n.label}</td>
                          <td>
                            <code>{n.route}</code>
                          </td>
                          <td className="bp-text-small">{n.visibility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="bp-grid" style={{ marginTop: 16 }}>
              <div className="card">
                <h4>Mobile Navigation</h4>
                <p className="bp-text-small">
                  {content.navigation_system.mobile_navigation}
                </p>
              </div>
              <div className="card">
                <h4>Active State</h4>
                <p className="bp-text-small">{content.navigation_system.active_state}</p>
              </div>
              <div className="card">
                <h4>Permission Visibility</h4>
                <p className="bp-text-small">
                  {content.navigation_system.permission_visibility}
                </p>
              </div>
              <div className="card">
                <h4>Breadcrumbs</h4>
                <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                  {content.navigation_system.breadcrumb_rules.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.page_patterns.map((p) => (
                <div key={p.id} className="card">
                  <div className="card-header">
                    <h3>{p.name}</h3>
                  </div>
                  <div className="card-content">
                    <p className="bp-text-small">{p.purpose}</p>
                    <p className="bp-text-small">
                      <strong>Layout:</strong> {p.layout}
                    </p>
                    <p className="bp-text-small">
                      <strong>Required sections:</strong>{" "}
                      {p.required_sections.join(", ")}
                    </p>
                    {p.optional_sections.length > 0 && (
                      <p className="bp-text-small">
                        <strong>Optional:</strong> {p.optional_sections.join(", ")}
                      </p>
                    )}
                    <p className="bp-text-small">
                      <strong>Responsive:</strong> {p.responsive_behavior}
                    </p>
                    <p className="bp-text-small">
                      <strong>Accessibility:</strong> {p.accessibility}
                    </p>
                    <p className="bp-text-small">
                      <strong>Blueprint pages:</strong>{" "}
                      {p.traceability.blueprint_page_ids.join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "forms" && (
          <div className="bp-section">
            {content.form_patterns.length === 0 ? (
              <div className="empty-state">
                <p>No form patterns defined.</p>
              </div>
            ) : (
              <div className="bp-grid">
                {content.form_patterns.map((f) => (
                  <div key={f.id} className="card">
                    <div className="card-header">
                      <h3>{f.name}</h3>
                    </div>
                    <div className="card-content">
                      <p className="bp-text-small">
                        <strong>Field layout:</strong> {f.field_layout}
                      </p>
                      <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                        {f.label_rules.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                      <p className="bp-text-small">
                        <strong>Help text:</strong> {f.help_text}
                      </p>
                      <p className="bp-text-small">
                        <strong>Validation:</strong> {f.validation_display}
                      </p>
                      <p className="bp-text-small">
                        <strong>Errors:</strong> {f.error_display}
                      </p>
                      <p className="bp-text-small">
                        <strong>Required:</strong> {f.required_field_indicator}
                      </p>
                      <p className="bp-text-small">
                        <strong>Submission:</strong> {f.submission_behavior}
                      </p>
                      <p className="bp-text-small">
                        <strong>Loading:</strong> {f.loading_behavior}
                      </p>
                      <p className="bp-text-small">
                        <strong>Success:</strong> {f.success_behavior}
                      </p>
                      {f.traceability.blueprint_api_ids.length > 0 && (
                        <p className="bp-text-small">
                          <strong>APIs:</strong>{" "}
                          {f.traceability.blueprint_api_ids.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tables" && (
          <div className="bp-section">
            {content.table_patterns.length === 0 ? (
              <div className="empty-state">
                <p>No table patterns defined.</p>
              </div>
            ) : (
              <div className="bp-grid">
                {content.table_patterns.map((t) => (
                  <div key={t.id} className="card">
                    <div className="card-header">
                      <h3>{t.name}</h3>
                    </div>
                    <div className="card-content">
                      <p className="bp-text-small">
                        <strong>Columns:</strong> {t.column_rules.join("; ")}
                      </p>
                      <p className="bp-text-small">
                        <strong>Sorting:</strong>{" "}
                        {t.sorting.supported
                          ? t.sorting.rules.join("; ")
                          : "Not supported"}
                      </p>
                      <p className="bp-text-small">
                        <strong>Filtering:</strong>{" "}
                        {t.filtering.supported
                          ? t.filtering.rules.join("; ")
                          : "Not supported"}
                      </p>
                      <p className="bp-text-small">
                        <strong>Pagination:</strong>{" "}
                        {t.pagination.supported
                          ? t.pagination.rules.join("; ")
                          : "Not supported"}
                      </p>
                      <p className="bp-text-small">
                        <strong>Empty:</strong> {t.empty_state}
                      </p>
                      <p className="bp-text-small">
                        <strong>Loading:</strong> {t.loading_state}
                      </p>
                      <p className="bp-text-small">
                        <strong>Error:</strong> {t.error_state}
                      </p>
                      <p className="bp-text-small">
                        <strong>Responsive:</strong> {t.responsive_behavior}
                      </p>
                      {t.row_actions.length > 0 && (
                        <p className="bp-text-small">
                          <strong>Row actions:</strong> {t.row_actions.join(", ")}
                        </p>
                      )}
                      {t.bulk_actions.length > 0 && (
                        <p className="bp-text-small">
                          <strong>Bulk actions:</strong> {t.bulk_actions.join(", ")}
                        </p>
                      )}
                      {t.traceability.erd_entity_ids.length > 0 && (
                        <p className="bp-text-small">
                          <strong>Entities:</strong>{" "}
                          {t.traceability.erd_entity_ids.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.feedback_states.states.map((f) => (
                <div key={f.id} className="card">
                  <h4>
                    <span className="badge badge-neutral">{f.id}</span>
                  </h4>
                  <p className="bp-text-small">
                    <strong>Visual:</strong> {f.visual_treatment}
                  </p>
                  <p className="bp-text-small">
                    <strong>Message:</strong> {f.message_rules}
                  </p>
                  <p className="bp-text-small">
                    <strong>User action:</strong> {f.user_action}
                  </p>
                  <p className="bp-text-small">
                    <strong>Accessibility:</strong> {f.accessibility}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "accessibility" && (
          <div className="bp-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Category</th>
                  <th>Requirement</th>
                  <th>Applies to</th>
                </tr>
              </thead>
              <tbody>
                {content.accessibility_rules.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <code style={{ fontSize: 11 }}>{a.id}</code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{a.category}</span>
                    </td>
                    <td>{a.rule}</td>
                    <td className="bp-text-small">
                      {a.applies_to.length > 0 ? a.applies_to.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "interactions" && (
          <div className="bp-section">
            <div className="bp-grid">
              <div className="card">
                <h4>Hover</h4>
                <p className="bp-text-small">{content.interaction_rules.hover_behavior}</p>
              </div>
              <div className="card">
                <h4>Focus</h4>
                <p className="bp-text-small">{content.interaction_rules.focus_behavior}</p>
              </div>
              <div className="card">
                <h4>Click feedback</h4>
                <p className="bp-text-small">{content.interaction_rules.click_feedback}</p>
              </div>
              <div className="card">
                <h4>Loading feedback</h4>
                <p className="bp-text-small">{content.interaction_rules.loading_feedback}</p>
              </div>
              <div className="card">
                <h4>Transitions</h4>
                <p className="bp-text-small">{content.interaction_rules.transition_rules}</p>
              </div>
              <div className="card">
                <h4>Modal behavior</h4>
                <p className="bp-text-small">{content.interaction_rules.modal_behavior}</p>
              </div>
              <div className="card">
                <h4>Confirmations</h4>
                <p className="bp-text-small">
                  {content.interaction_rules.confirmation_rules}
                </p>
              </div>
              <div className="card">
                <h4>Destructive actions</h4>
                <p className="bp-text-small">
                  {content.interaction_rules.destructive_action_rules}
                </p>
              </div>
              <div className="card">
                <h4>Keyboard</h4>
                <p className="bp-text-small">
                  {content.interaction_rules.keyboard_behavior}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "screens" && (
          <div className="bp-section">
            <div className="bp-grid">
              {content.screen_specifications.map((s) => (
                <div key={s.id} className="card">
                  <div className="card-header">
                    <h3>
                      {s.name}{" "}
                      <code style={{ fontSize: 12 }}>{s.route}</code>
                    </h3>
                  </div>
                  <div className="card-content">
                    <p className="bp-text-small">{s.purpose}</p>
                    <p className="bp-text-small">
                      <strong>Roles:</strong>{" "}
                      {s.user_roles.length > 0 ? s.user_roles.join(", ") : "—"}
                    </p>
                    <p className="bp-text-small">
                      <strong>Layout pattern:</strong> {s.layout_pattern}
                    </p>
                    <p className="bp-text-small">
                      <strong>Components:</strong> {s.components.join(", ")}
                    </p>
                    <p className="bp-text-small">
                      <strong>States:</strong> {s.states.join(", ")}
                    </p>
                    {s.actions.length > 0 && (
                      <p className="bp-text-small">
                        <strong>Actions:</strong> {s.actions.join(", ")}
                      </p>
                    )}
                    {s.data_requirements.length > 0 && (
                      <p className="bp-text-small">
                        <strong>Data:</strong> {s.data_requirements.join(", ")}
                      </p>
                    )}
                    <p className="bp-text-small">
                      <strong>Responsive:</strong> {s.responsive_behavior}
                    </p>
                    <p className="bp-text-small">
                      <strong>Accessibility:</strong> {s.accessibility.join("; ")}
                    </p>
                  </div>
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
                  <th>Screen</th>
                  <th>Requirements</th>
                  <th>Architecture</th>
                  <th>ERD</th>
                  <th>DFD</th>
                  <th>Flowchart</th>
                  <th>Blueprint modules</th>
                  <th>Blueprint pages</th>
                  <th>Blueprint APIs</th>
                </tr>
              </thead>
              <tbody>
                {content.traceability.screens.map((t) => (
                  <tr key={t.screen_id}>
                    <td>
                      <code>{t.screen_id}</code>
                    </td>
                    <td className="bp-text-small">
                      {t.requirement_ids.join(", ") || "—"}
                    </td>
                    <td className="bp-text-small">
                      {t.architecture_module_ids.join(", ") || "—"}
                    </td>
                    <td className="bp-text-small">{t.erd_entity_ids.join(", ") || "—"}</td>
                    <td className="bp-text-small">{t.dfd_process_ids.join(", ") || "—"}</td>
                    <td className="bp-text-small">
                      {t.flowchart_process_ids.join(", ") || "—"}
                    </td>
                    <td className="bp-text-small">
                      {t.blueprint_module_ids.join(", ") || "—"}
                    </td>
                    <td className="bp-text-small">
                      {t.blueprint_page_ids.join(", ") || "—"}
                    </td>
                    <td className="bp-text-small">
                      {t.blueprint_api_ids.join(", ") || "—"}
                    </td>
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
                <div className="alert alert-success">
                  Validation passed. No issues found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {errorIssues.map((issue) => (
                    <div key={issue.id} className="alert alert-danger">
                      <strong>{issue.title}</strong> ({issue.category}):{" "}
                      {issue.description}
                    </div>
                  ))}
                  {warningIssues.map((issue) => (
                    <div key={issue.id} className="alert alert-warning">
                      <strong>{issue.title}</strong> ({issue.category}):{" "}
                      {issue.description}
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
                  <p className="bp-text-small" style={{ marginTop: 8 }}>
                    <strong>
                      {coverage.resolved} / {coverage.total} reviewed
                    </strong>
                    {!coverage.complete && isReview && (
                      <>
                        {" "}
                        — all issues need a decision before approval.
                      </>
                    )}
                  </p>
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
                        <span className="badge badge-neutral">{issue.category}</span>
                      </div>
                      <div className="card-content">
                        <p className="bp-text-small">{issue.description}</p>
                        <p className="bp-text-small" style={{ fontStyle: "italic" }}>
                          Evidence: {issue.evidence}
                        </p>
                        {issue.source_references.length > 0 && (
                          <p className="bp-text-small">
                            <strong>Sources:</strong>{" "}
                            {issue.source_references.join("; ")}
                          </p>
                        )}
                        <p className="bp-text-small">
                          <strong>Suggested resolution:</strong>{" "}
                          {issue.suggested_resolution}
                        </p>
                        {!isApproved && (
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
                                  {decision.decision}
                                </span>
                                {decision.rationale ? ` — ${decision.rationale}` : ""}
                              </p>
                            ) : isOwner ? (
                              <div
                                style={{ display: "flex", gap: 8, flexDirection: "column" }}
                              >
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
                                    placeholder="Custom rationale (required for custom)..."
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
                                    disabled={!customInputs[issue.id]?.trim()}
                                    onClick={() => handleDecision(issue.id, "custom")}
                                  >
                                    Custom
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p
                                className="bp-text-small"
                                style={{ color: "var(--color-warning)" }}
                              >
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
                {error && (
                  <div className="alert alert-danger" style={{ marginTop: 12 }}>
                    {error}
                  </div>
                )}
                {isOwner && (
                  <button
                    className={`btn btn-primary ${reviewLoading ? "is-loading" : ""}`}
                    onClick={handleGenerateReview}
                    disabled={reviewLoading || errorIssues.length > 0}
                  >
                    {reviewLoading ? "Generating Review..." : "Generate AI Review"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
        .ds-swatch {
          display: inline-block;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .tabs { margin: 0 auto; max-width: 1024px; overflow-x: auto; }
      `,
        }}
      />
    </div>
  );
}
