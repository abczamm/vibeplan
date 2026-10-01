"use client";

import { Fragment, useMemo, useState } from "react";
import { validateFlowchartDocument } from "@/lib/ai/flowchart";
import type {
  FlowchartDocument,
  FlowchartEdge,
  FlowchartNode,
  FlowchartNodeType,
  FlowchartProcess,
  FlowchartReview,
  FlowchartReviewDecision,
  FlowchartReviewIssue,
  FlowchartUpstreamContext,
  FlowchartValidationCategory,
} from "@/lib/ai/types";

type DocState = {
  id: string;
  status: string;
  content: FlowchartDocument;
  created_at: string;
  review_data: FlowchartReview | null;
  decisions: FlowchartReviewDecision[];
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
  };
  validationContext: FlowchartUpstreamContext | null;
  initialDoc: DocState | null;
};

type TabKey = "flowchart" | "processes" | "traceability" | "validation" | "ai_review";

const NODE_LABELS: Record<FlowchartNodeType, string> = {
  start: "Start",
  end: "End",
  process: "Process",
  decision: "Decision",
  input: "Input",
  output: "Output",
  subprocess: "Subprocess",
  validation: "Validation",
  error: "Error",
  connector: "Connector",
};

const CATEGORY_LABELS: Record<FlowchartValidationCategory, string> = {
  graph: "Graph",
  decision: "Decision",
  traceability: "Traceability",
  scope: "Scope",
  data: "Data",
  architecture: "Architecture",
  dfd_consistency: "DFD Consistency",
};

function nodeMapOf(doc: FlowchartDocument): Map<string, FlowchartNode> {
  return new Map(doc.nodes.map((n) => [n.id, n]));
}

function orderedNodesForProcess(
  doc: FlowchartDocument,
  process: FlowchartProcess,
  nodeMap: Map<string, FlowchartNode>,
): FlowchartNode[] {
  const inProcess = new Set(process.node_ids);
  const adjacency = new Map<string, string[]>();
  for (const edge of doc.edges) {
    if (!inProcess.has(edge.source) || !inProcess.has(edge.target)) continue;
    const list = adjacency.get(edge.source);
    if (list) list.push(edge.target);
    else adjacency.set(edge.source, [edge.target]);
  }

  const visited = new Set<string>();
  const order: FlowchartNode[] = [];
  const queue: string[] = [];

  if (inProcess.has(process.entry_node_id)) {
    queue.push(process.entry_node_id);
    visited.add(process.entry_node_id);
  }

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const node = nodeMap.get(current);
    if (node) order.push(node);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  for (const nodeId of process.node_ids) {
    if (visited.has(nodeId)) continue;
    const node = nodeMap.get(nodeId);
    if (node) order.push(node);
  }

  return order;
}

function edgeBetween(
  doc: FlowchartDocument,
  sourceId: string,
  targetId: string,
): FlowchartEdge | undefined {
  return doc.edges.find((e) => e.source === sourceId && e.target === targetId);
}

function chipList(values: string[], emptyLabel: string) {
  if (values.length === 0) {
    return <span className="fc-muted">{emptyLabel}</span>;
  }
  return (
    <span className="fc-chips">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="fc-chip">
          {value}
        </span>
      ))}
    </span>
  );
}

function statusBadge(status: string) {
  if (status === "approved") return <span className="badge badge-approved">Approved</span>;
  if (status === "review") return <span className="badge badge-review">Under Review</span>;
  return <span className="badge badge-draft">Draft</span>;
}

export function FlowchartViewer({
  projectId,
  projectName,
  isOwner,
  prerequisites,
  validationContext,
  initialDoc,
}: Props) {
  const [doc, setDoc] = useState<DocState | null>(initialDoc);
  const [activeTab, setActiveTab] = useState<TabKey>("flowchart");
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const allPrerequisites =
    prerequisites.requirements &&
    prerequisites.architecture &&
    prerequisites.erd &&
    prerequisites.dfd;

  const validation = useMemo(() => {
    if (!doc) return null;
    return validateFlowchartDocument(
      doc.content,
      validationContext ?? undefined,
    );
  }, [doc, validationContext]);

  const errorIssues = useMemo(
    () => (validation ? validation.issues.filter((i) => i.severity === "error") : []),
    [validation],
  );
  const warningIssues = useMemo(
    () =>
      validation ? validation.issues.filter((i) => i.severity === "warning") : [],
    [validation],
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

  const importantIssues = useMemo(
    () => (reviewData ? reviewData.issues.filter((i) => i.severity === "important") : []),
    [reviewData],
  );
  const minorIssues = useMemo(
    () => (reviewData ? reviewData.issues.filter((i) => i.severity === "minor") : []),
    [reviewData],
  );

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/flowchart`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const body = data as { error?: string };
        setError(body.error ?? "Failed to generate flowchart.");
        return;
      }
      const body = data as { doc_id: string; flowchart: FlowchartDocument };
      setDoc({
        id: body.doc_id,
        status: "draft",
        content: body.flowchart,
        created_at: new Date().toISOString(),
        review_data: null,
        decisions: [],
      });
      setActiveTab("flowchart");
    } catch {
      setError("Failed to generate flowchart. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestReview() {
    if (!doc) return;
    setReviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/flowchart/review`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const body = data as { error?: string };
        setError(body.error ?? "Failed to generate AI review.");
        return;
      }
      const body = data as { doc_id: string; review: FlowchartReview };
      setDoc((prev) =>
        prev ? { ...prev, status: "review", review_data: body.review, decisions: [] } : prev,
      );
      setActiveTab("ai_review");
    } catch {
      setError("Failed to generate AI review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleDecision(
    issueId: string,
    action: "accept" | "ignore" | "custom",
    customText?: string,
  ) {
    if (!doc) return;
    const decision: FlowchartReviewDecision = {
      issue_id: issueId,
      action,
      custom_text: action === "custom" ? customText : undefined,
      resolved_at: new Date().toISOString(),
    };
    try {
      const res = await fetch(`/api/projects/${projectId}/flowchart/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const body = data as { error?: string };
        setError(body.error ?? "Failed to save decision.");
        return;
      }
      const body = data as { doc: { review_data: FlowchartReview; decisions: FlowchartReviewDecision[] } };
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              review_data: body.doc.review_data ?? prev.review_data,
              decisions: body.doc.decisions ?? prev.decisions,
            }
          : prev,
      );
    } catch {
      setError("Failed to save decision.");
    }
  }

  async function handleApprove() {
    if (!doc) return;
    setApproveLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/flowchart/${doc.id}/approve`,
        { method: "POST" },
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        const body = data as { error?: string; unresolved_count?: number };
        setError(
          body.error ??
            (body.unresolved_count
              ? `${body.unresolved_count} decision(s) still required.`
              : "Failed to approve flowchart."),
        );
        return;
      }
      setDoc((prev) => (prev ? { ...prev, status: "approved" } : prev));
    } catch {
      setError("Failed to approve flowchart.");
    } finally {
      setApproveLoading(false);
    }
  }

  if (!doc) {
    const missing: string[] = [];
    if (!prerequisites.requirements) missing.push("Approved Requirements");
    if (!prerequisites.architecture) missing.push("Approved Architecture");
    if (!prerequisites.erd) missing.push("Approved ERD");
    if (!prerequisites.dfd) missing.push("Approved DFD");

    return (
      <div className="fc-layout">
        <header className="fc-header">
          <div className="fc-header-inner">
            <div>
              <span className="fc-label">Business Process Flowchart</span>
              <h1 className="fc-project-name">{projectName}</h1>
            </div>
          </div>
        </header>

        <div className="fc-empty">
          <p className="fc-empty-title">No flowchart draft yet.</p>
          {missing.length > 0 ? (
            <div className="fc-notice-error">
              The following must be approved before generating the flowchart:{" "}
              {missing.join(", ")}.
            </div>
          ) : (
            <>
              <p className="fc-empty-desc">
                Generate a structured business process flowchart describing what
                happens, in what order, with decisions, branches, validation,
                and error paths — derived strictly from the approved
                Requirements, Architecture, ERD, and DFD.
                This process takes 30-90 seconds.
              </p>
              <button
                type="button"
                className="fc-btn-primary"
                onClick={handleGenerate}
                disabled={loading || !allPrerequisites}
              >
                {loading ? "Generating Flowchart..." : "Generate Flowchart"}
              </button>
            </>
          )}
          {error && <div className="fc-error">{error}</div>}
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  const content = doc.content;
  const nodeMap = nodeMapOf(content);
  const coveredNodeIds = new Set<string>();
  for (const process of content.processes) {
    for (const nodeId of process.node_ids) coveredNodeIds.add(nodeId);
  }
  const unassignedNodes = content.nodes.filter((n) => !coveredNodeIds.has(n.id));

  const canReview = doc.status !== "approved" && allPrerequisites;
  const canApprove =
    isOwner &&
    doc.status !== "approved" &&
    errorIssues.length === 0 &&
    unresolvedRequired.length === 0;

  return (
    <div className="fc-layout">
      <header className="fc-header">
        <div className="fc-header-inner">
          <div>
            <span className="fc-label">Business Process Flowchart</span>
            <h1 className="fc-project-name">{projectName}</h1>
          </div>
          <div className="fc-header-right">
            {statusBadge(doc.status)}
            {doc.status !== "approved" && canReview && (
              <button
                type="button"
                className="fc-btn-secondary"
                onClick={handleRequestReview}
                disabled={reviewLoading}
              >
                {reviewLoading ? "Generating Review..." : "AI Review"}
              </button>
            )}
            {canApprove && reviewData && (
              <button
                type="button"
                className="fc-btn-approve"
                onClick={handleApprove}
                disabled={approveLoading}
              >
                {approveLoading ? "Approving..." : "Approve Flowchart"}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="fc-toolbar">
        <div className="fc-tabs">
          <button
            type="button"
            className={`fc-tab${activeTab === "flowchart" ? " fc-tab-active" : ""}`}
            onClick={() => setActiveTab("flowchart")}
          >
            Flowchart
          </button>
          <button
            type="button"
            className={`fc-tab${activeTab === "processes" ? " fc-tab-active" : ""}`}
            onClick={() => setActiveTab("processes")}
          >
            Processes
            <span className="fc-tab-count">{content.processes.length}</span>
          </button>
          <button
            type="button"
            className={`fc-tab${activeTab === "traceability" ? " fc-tab-active" : ""}`}
            onClick={() => setActiveTab("traceability")}
          >
            Traceability
            {warningIssues.length > 0 && (
              <span className="fc-tab-count">{warningIssues.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`fc-tab${activeTab === "validation" ? " fc-tab-active" : ""}`}
            onClick={() => setActiveTab("validation")}
          >
            Validation
            <span
              className={`fc-tab-count${
                errorIssues.length > 0 ? " fc-tab-count-important" : ""
              }`}
            >
              {errorIssues.length + warningIssues.length}
            </span>
          </button>
          <button
            type="button"
            className={`fc-tab${activeTab === "ai_review" ? " fc-tab-active" : ""}`}
            onClick={() => setActiveTab("ai_review")}
          >
            AI Review
            {reviewData && unresolvedRequired.length > 0 && (
              <span className="fc-tab-count fc-tab-count-important">
                {unresolvedRequired.length}
              </span>
            )}
            {reviewData && unresolvedRequired.length === 0 && importantIssues.length > 0 && (
              <span className="fc-tab-count">{importantIssues.length}</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="fc-error" role="alert">
          {error}
        </div>
      )}

      <div className="fc-body">
        <div className="fc-container">
          {doc.status === "draft" && (
            <div className="fc-draft-notice">
              DRAFT — control flow derived from approved Requirements,
              Architecture, ERD, and DFD.
            </div>
          )}
          {doc.status === "review" && (
            <div className="fc-review-notice">
              UNDER REVIEW — AI review generated. Resolve required decisions before approving.
            </div>
          )}
          {doc.status === "approved" && (
            <div className="fc-approved-notice">
              APPROVED — this flowchart is immutable.
            </div>
          )}

          <section className="fc-section">
            <h2 className="fc-section-title">{content.title}</h2>
            <p className="fc-text">{content.description}</p>
          </section>

          {activeTab === "flowchart" && (
            <>
              {content.processes.map((process) => {
                const ordered = orderedNodesForProcess(
                  content,
                  process,
                  nodeMap,
                );
                return (
                  <section key={process.id} className="fc-section">
                    <div className="fc-process-header">
                      <h3 className="fc-process-title">
                        <span className="fc-process-code">{process.code}</span>
                        {process.name}
                      </h3>
                      {process.purpose && (
                        <p className="fc-process-purpose">{process.purpose}</p>
                      )}
                    </div>

                    <div className="fc-chain">
                      {ordered.map((node, index) => {
                        const next = ordered[index + 1];
                        const connectingEdge = next
                          ? edgeBetween(content, node.id, next.id)
                          : undefined;
                        const branches = content.edges.filter(
                          (e) => e.source === node.id,
                        );
                        return (
                          <Fragment key={node.id}>
                            <div
                              className={`fc-node fc-node-${node.type}`}
                            >
                              <span className="fc-node-type">
                                {NODE_LABELS[node.type]}
                              </span>
                              <span className="fc-node-label">{node.label}</span>
                              {node.description && (
                                <span className="fc-node-desc">
                                  {node.description}
                                </span>
                              )}
                            </div>

                            {node.type === "decision" && branches.length > 0 && (
                              <div className="fc-branches">
                                <div className="fc-branches-title">
                                  Branches from &ldquo;{node.label}&rdquo;
                                </div>
                                {branches.map((branch) => {
                                  const target = nodeMap.get(branch.target);
                                  return (
                                    <div
                                      key={branch.id}
                                      className="fc-branch-row"
                                    >
                                      <span className="fc-branch-condition">
                                        {branch.label ??
                                          branch.condition ??
                                          "Continue"}
                                      </span>
                                      {branch.is_default && (
                                        <span className="fc-chip">
                                          Default
                                        </span>
                                      )}
                                      <span className="fc-branch-arrow">→</span>
                                      <span className="fc-branch-target">
                                        {target?.label ?? branch.target}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {next && (
                              <div className="fc-arrow">
                                {connectingEdge?.label ??
                                  connectingEdge?.condition ??
                                  "↓"}
                              </div>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {unassignedNodes.length > 0 && (
                <section className="fc-section">
                  <h3 className="fc-subsection-title">Unassigned nodes</h3>
                  <div className="fc-node-list">
                    {unassignedNodes.map((node) => (
                      <div
                        key={node.id}
                        className={`fc-node fc-node-${node.type}`}
                      >
                        <span className="fc-node-type">
                          {NODE_LABELS[node.type]}
                        </span>
                        <span className="fc-node-label">{node.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="fc-section">
                <h3 className="fc-subsection-title">Edges</h3>
                <table className="fc-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Label / Condition</th>
                      <th>Target</th>
                      <th>Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.edges.map((edge) => (
                      <tr key={edge.id}>
                        <td>
                          {nodeMap.get(edge.source)?.label ?? edge.source}
                        </td>
                        <td>{edge.label ?? edge.condition ?? "—"}</td>
                        <td>
                          {nodeMap.get(edge.target)?.label ?? edge.target}
                        </td>
                        <td>{edge.is_default ? "Yes" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {content.assumptions.length > 0 && (
                <section className="fc-section">
                  <h3 className="fc-subsection-title">Assumptions</h3>
                  <ul className="fc-list">
                    {content.assumptions.map((assumption, index) => (
                      <li key={index}>{assumption}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {activeTab === "processes" && (
            <section className="fc-section">
              <p className="fc-text-small">
                Business process groups. Each group owns a connected subgraph of
                nodes with an explicit entry and exit.
              </p>
              <div className="fc-grid">
                {content.processes.map((process) => (
                  <div key={process.id} className="fc-card">
                    <div className="fc-card-header">
                      <span className="fc-process-code">{process.code}</span>
                      <span className="fc-card-name">{process.name}</span>
                    </div>
                    {process.purpose && (
                      <p className="fc-card-purpose">{process.purpose}</p>
                    )}

                    <div className="fc-card-row">
                      <span className="fc-card-label">Requirements</span>
                      {chipList(process.requirement_ids, "Not linked")}
                    </div>
                    <div className="fc-card-row">
                      <span className="fc-card-label">Architecture</span>
                      {chipList(
                        process.architecture_module_ids,
                        "Not linked",
                      )}
                    </div>
                    <div className="fc-card-row">
                      <span className="fc-card-label">DFD processes</span>
                      {chipList(process.dfd_process_ids, "Not mapped")}
                    </div>
                    <div className="fc-card-row">
                      <span className="fc-card-label">Entry</span>
                      <span className="fc-chip">
                        {nodeMap.get(process.entry_node_id)?.label ??
                          process.entry_node_id}
                      </span>
                    </div>
                    <div className="fc-card-row">
                      <span className="fc-card-label">Exits</span>
                      {chipList(
                        process.exit_node_ids.map(
                          (id) => nodeMap.get(id)?.label ?? id,
                        ),
                        "None",
                      )}
                    </div>
                    <div className="fc-card-row">
                      <span className="fc-card-label">Nodes</span>
                      <span className="fc-chips">
                        {process.node_ids.map((id) => (
                          <span key={id} className="fc-chip">
                            {nodeMap.get(id)?.label ?? id}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "traceability" && (
            <section className="fc-section">
              <p className="fc-text-small">
                Requirement → Flowchart Process → DFD Process → Architecture
                Module → ERD Entity.
              </p>

              <div className="fc-trace-list">
                {content.processes.map((process) => {
                  const erdEntities = new Set<string>();
                  for (const nodeId of process.node_ids) {
                    const node = nodeMap.get(nodeId);
                    for (const entity of node?.erd_entity_ids ?? []) {
                      erdEntities.add(entity);
                    }
                  }
                  return (
                    <div key={process.id} className="fc-trace-card">
                      <div className="fc-trace-chain">
                        <span className="fc-trace-step">
                          {process.requirement_ids.length > 0
                            ? process.requirement_ids.join(" · ")
                            : "Requirement not linked"}
                        </span>
                        <span className="fc-trace-arrow">→</span>
                        <span className="fc-trace-step fc-trace-strong">
                          {process.code} {process.name}
                        </span>
                        <span className="fc-trace-arrow">→</span>
                        <span className="fc-trace-step">
                          {process.dfd_process_ids.length > 0
                            ? process.dfd_process_ids.join(" · ")
                            : "DFD process not mapped"}
                        </span>
                        <span className="fc-trace-arrow">→</span>
                        <span className="fc-trace-step">
                          {process.architecture_module_ids.length > 0
                            ? process.architecture_module_ids.join(" · ")
                            : "Architecture module not linked"}
                        </span>
                        <span className="fc-trace-arrow">→</span>
                        <span className="fc-trace-step">
                          {erdEntities.size > 0
                            ? [...erdEntities].join(" · ")
                            : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 className="fc-subsection-title">Warnings</h3>
              {warningIssues.length === 0 ? (
                <p className="fc-muted">No traceability warnings.</p>
              ) : (
                <div className="fc-issue-list">
                  {warningIssues.map((issue) => (
                    <div key={issue.id} className="fc-issue fc-issue-warning">
                      <div className="fc-issue-meta">
                        <span className="fc-badge fc-badge-warning">
                          {CATEGORY_LABELS[issue.category]}
                        </span>
                        {issue.process_code && (
                          <span className="fc-chip">{issue.process_code}</span>
                        )}
                        {issue.node_id && (
                          <span className="fc-chip">{issue.node_id}</span>
                        )}
                      </div>
                      <p className="fc-issue-message">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "validation" && validation && (
            <section className="fc-section">
              <div
                className={`fc-validation-summary${
                  errorIssues.length > 0
                    ? " fc-validation-failed"
                    : " fc-validation-passed"
                }`}
              >
                <span className="fc-validation-status">
                  {errorIssues.length > 0 ? "NEEDS REVIEW" : "VALID"}
                </span>
                <span className="fc-validation-detail">
                  {errorIssues.length} error(s), {warningIssues.length}{" "}
                  warning(s) — deterministic graph validation
                </span>
              </div>

              <div className="fc-issue-list">
                {validation.issues.length === 0 && (
                  <p className="fc-muted">
                    No structural, decision, or traceability issues detected.
                  </p>
                )}
                {validation.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`fc-issue fc-issue-${issue.severity}`}
                  >
                    <div className="fc-issue-meta">
                      <span
                        className={`fc-badge ${
                          issue.severity === "error"
                            ? "fc-badge-error"
                            : "fc-badge-warning"
                        }`}
                      >
                        {issue.severity === "error" ? "Error" : "Warning"}
                      </span>
                      <span className="fc-badge fc-badge-category">
                        {CATEGORY_LABELS[issue.category]}
                      </span>
                      {issue.process_code && (
                        <span className="fc-chip">{issue.process_code}</span>
                      )}
                      {issue.node_id && (
                        <span className="fc-chip">{issue.node_id}</span>
                      )}
                      {issue.edge_id && (
                        <span className="fc-chip">{issue.edge_id}</span>
                      )}
                    </div>
                    <p className="fc-issue-message">{issue.message}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "ai_review" && (
            <section className="fc-section">
              {!reviewData ? (
                <div className="fc-ai-empty">
                  <p className="fc-text">No AI review generated yet.</p>
                  {doc.status !== "approved" && canReview && (
                    <button
                      type="button"
                      className="fc-btn-primary"
                      onClick={handleRequestReview}
                      disabled={reviewLoading}
                    >
                      {reviewLoading ? "Generating Review..." : "Generate AI Review"}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className={`fc-review-summary-box${
                      reviewData.ready_for_approval
                        ? " fc-review-ready"
                        : " fc-review-not-ready"
                    }`}
                  >
                    <div className="fc-review-summary-header">
                      <span className="fc-review-readiness">
                        {reviewData.ready_for_approval
                          ? "READY FOR APPROVAL"
                          : "NOT READY — ISSUES REQUIRE ATTENTION"}
                      </span>
                      <span className="fc-review-counts">
                        {importantIssues.length} important · {minorIssues.length} minor ·{" "}
                        {unresolvedRequired.length} unresolved decisions
                      </span>
                    </div>
                    <p className="fc-review-summary-text">{reviewData.summary}</p>
                  </div>

                  {importantIssues.length > 0 && (
                    <>
                      <h3 className="fc-subsection-title" style={{ marginTop: 16 }}>
                        Important Issues
                      </h3>
                      <div className="fc-issue-list">
                        {importantIssues.map((issue) => (
                          <AIReviewIssueCard
                            key={issue.id}
                            issue={issue}
                            decision={decisions.find((d) => d.issue_id === issue.id) ?? null}
                            disabled={doc.status === "approved"}
                            customInput={customInputs[issue.id] ?? ""}
                            onCustomChange={(v) =>
                              setCustomInputs((prev) => ({ ...prev, [issue.id]: v }))
                            }
                            onDecide={(action) =>
                              handleDecision(
                                issue.id,
                                action,
                                action === "custom" ? customInputs[issue.id] : undefined,
                              )
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {minorIssues.length > 0 && (
                    <>
                      <h3 className="fc-subsection-title" style={{ marginTop: 20 }}>
                        Minor Issues
                      </h3>
                      <div className="fc-issue-list">
                        {minorIssues.map((issue) => (
                          <AIReviewIssueCard
                            key={issue.id}
                            issue={issue}
                            decision={decisions.find((d) => d.issue_id === issue.id) ?? null}
                            disabled={doc.status === "approved"}
                            customInput={customInputs[issue.id] ?? ""}
                            onCustomChange={(v) =>
                              setCustomInputs((prev) => ({ ...prev, [issue.id]: v }))
                            }
                            onDecide={(action) =>
                              handleDecision(
                                issue.id,
                                action,
                                action === "custom" ? customInputs[issue.id] : undefined,
                              )
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {reviewData.issues.length === 0 && (
                    <p className="fc-muted" style={{ marginTop: 12 }}>
                      No AI review issues found. The flowchart looks consistent with upstream artifacts.
                    </p>
                  )}

                  {canApprove && (
                    <div className="fc-approve-panel">
                      <p className="fc-text-small">
                        All required decisions resolved and deterministic validation passed.
                        The project owner can now approve this flowchart.
                      </p>
                      <button
                        type="button"
                        className="fc-btn-approve"
                        onClick={handleApprove}
                        disabled={approveLoading}
                      >
                        {approveLoading ? "Approving..." : "Approve Flowchart"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  );
}

function AIReviewIssueCard({
  issue,
  decision,
  disabled,
  customInput,
  onCustomChange,
  onDecide,
}: {
  issue: FlowchartReviewIssue;
  decision: FlowchartReviewDecision | null;
  disabled: boolean;
  customInput: string;
  onCustomChange: (v: string) => void;
  onDecide: (action: "accept" | "ignore" | "custom") => void;
}) {
  const isResolved = !!decision;
  return (
    <div
      className={`fc-ai-issue${
        issue.severity === "important" ? " fc-ai-issue-important" : " fc-ai-issue-minor"
      }${isResolved ? " fc-ai-issue-resolved" : ""}`}
    >
      <div className="fc-issue-meta">
        <span
          className={`fc-badge ${
            issue.severity === "important" ? "fc-badge-error" : "fc-badge-warning"
          }`}
        >
          {issue.severity === "important" ? "Important" : "Minor"}
        </span>
        <span className="fc-badge fc-badge-category">{issue.kind.replace(/_/g, " ")}</span>
        <span className="fc-badge fc-badge-category">{issue.section}</span>
        {issue.process_code && (
          <span className="fc-chip">{issue.process_code}</span>
        )}
        {issue.requires_user_decision && !isResolved && (
          <span className="fc-badge fc-badge-decision-required">Decision Required</span>
        )}
        {isResolved && (
          <span className="fc-badge fc-badge-resolved">
            {decision.action === "accept"
              ? "Accepted"
              : decision.action === "ignore"
              ? "Ignored"
              : "Custom"}
          </span>
        )}
      </div>

      <p className="fc-ai-issue-title">{issue.title}</p>
      <p className="fc-issue-message">{issue.description}</p>

      <div className="fc-ai-evidence">
        <span className="fc-ai-evidence-label">Evidence:</span> {issue.evidence}
      </div>
      <div className="fc-ai-recommendation">
        <span className="fc-ai-evidence-label">Recommendation:</span>{" "}
        {issue.recommendation}
      </div>

      {!disabled && (
        <div className="fc-decision-row">
          <button
            type="button"
            className={`fc-btn-decision${decision?.action === "accept" ? " fc-btn-decision-active" : ""}`}
            onClick={() => onDecide("accept")}
          >
            Accept
          </button>
          <button
            type="button"
            className={`fc-btn-decision${decision?.action === "ignore" ? " fc-btn-decision-active" : ""}`}
            onClick={() => onDecide("ignore")}
          >
            Ignore
          </button>
          <div className="fc-custom-row">
            <input
              type="text"
              className="fc-custom-input"
              placeholder="Custom resolution note..."
              value={customInput}
              onChange={(e) => onCustomChange(e.target.value)}
            />
            <button
              type="button"
              className={`fc-btn-decision${decision?.action === "custom" ? " fc-btn-decision-active" : ""}`}
              onClick={() => onDecide("custom")}
              disabled={!customInput.trim()}
            >
              Custom
            </button>
          </div>
          {decision?.action === "custom" && decision.custom_text && (
            <p className="fc-custom-saved">Saved: {decision.custom_text}</p>
          )}
        </div>
      )}
    </div>
  );
}

const CSS = `
  .fc-layout {
    min-height: 100vh;
    background: #fafafa;
    font-family: system-ui, sans-serif;
    color: #111;
  }
  .fc-header {
    position: sticky;
    top: 0;
    z-index: 5;
    background: rgba(255,255,255,0.95);
    border-bottom: 1px solid #e5e5e5;
    padding: 26px 24px 0;
  }
  .fc-header-inner {
    max-width: 940px;
    margin: 0 auto;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 14px;
  }
  .fc-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
  }
  .fc-project-name {
    margin: 2px 0 0;
    font-size: 22px;
    font-weight: 800;
  }
  .fc-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 3px 9px;
    border-radius: 4px;
    border: 1px solid;
  }
  .badge-draft {
    background: #fffbeb;
    color: #92400e;
    border-color: #fde68a;
  }
  .badge-review {
    background: #eff6ff;
    color: #1e40af;
    border-color: #bfdbfe;
  }
  .badge-approved {
    background: #f0fdf4;
    color: #166534;
    border-color: #bbf7d0;
  }
  .fc-toolbar {
    position: sticky;
    top: 74px;
    z-index: 4;
    background: #fafafa;
    padding: 0 24px;
    border-bottom: 1px solid #e5e5e5;
  }
  .fc-tabs {
    max-width: 940px;
    margin: 0 auto;
    display: flex;
    gap: 4px;
  }
  .fc-tab {
    appearance: none;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 11px 14px;
    font-size: 13px;
    font-weight: 600;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: inherit;
  }
  .fc-tab:hover { color: #111; }
  .fc-tab-active {
    color: #111;
    border-bottom-color: #111;
  }
  .fc-tab-count {
    font-size: 10px;
    font-weight: 700;
    background: #eee;
    color: #555;
    border-radius: 9px;
    padding: 1px 6px;
  }
  .fc-tab-count-important {
    background: #fee2e2;
    color: #991b1b;
  }
  .fc-body { padding: 20px 24px 80px; }
  .fc-container {
    max-width: 940px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .fc-draft-notice {
    font-size: 12px;
    font-weight: 600;
    color: #92400e;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 8px 12px;
  }
  .fc-review-notice {
    font-size: 12px;
    font-weight: 600;
    color: #1e40af;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 8px 12px;
  }
  .fc-approved-notice {
    font-size: 12px;
    font-weight: 600;
    color: #166534;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 8px 12px;
  }
  .fc-section {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 18px 20px;
  }
  .fc-section-title {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 800;
  }
  .fc-subsection-title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666;
  }
  .fc-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #444;
  }
  .fc-text-small {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.6;
    color: #666;
  }
  .fc-muted {
    font-size: 13px;
    color: #999;
    font-style: italic;
  }
  .fc-process-header { margin-bottom: 14px; }
  .fc-process-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fc-process-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 700;
    background: #111;
    color: #fff;
    border-radius: 4px;
    padding: 2px 7px;
  }
  .fc-process-purpose {
    margin: 6px 0 0;
    font-size: 13px;
    color: #666;
  }
  .fc-chain {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }
  .fc-node {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-width: 460px;
    padding: 9px 13px;
    border: 1px solid #d4d4d4;
    border-radius: 7px;
    background: #f9f9f9;
  }
  .fc-node-start {
    background: #ecfdf5;
    border-color: #a7f3d0;
  }
  .fc-node-end {
    background: #fef2f2;
    border-color: #fecaca;
  }
  .fc-node-decision {
    background: #eff6ff;
    border-color: #bfdbfe;
  }
  .fc-node-validation {
    background: #fffbeb;
    border-color: #fde68a;
  }
  .fc-node-error {
    background: #fef2f2;
    border-color: #fecaca;
  }
  .fc-node-input, .fc-node-output {
    background: #f5f3ff;
    border-color: #ddd6fe;
  }
  .fc-node-type {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
  }
  .fc-node-label {
    font-size: 14px;
    font-weight: 600;
  }
  .fc-node-desc {
    font-size: 12px;
    color: #666;
  }
  .fc-node-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .fc-arrow {
    font-size: 13px;
    color: #888;
    padding: 5px 0 5px 22px;
    font-weight: 600;
  }
  .fc-branches {
    margin: 4px 0 4px 22px;
    border: 1px dashed #bfdbfe;
    background: #f8fbff;
    border-radius: 7px;
    padding: 10px 12px;
    min-width: 300px;
  }
  .fc-branches-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #1e40af;
    margin-bottom: 7px;
  }
  .fc-branch-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    padding: 3px 0;
  }
  .fc-branch-condition { font-weight: 600; }
  .fc-branch-arrow { color: #888; }
  .fc-branch-target { color: #444; }
  .fc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .fc-table th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666;
    padding: 7px 9px;
    border-bottom: 1px solid #e5e5e5;
  }
  .fc-table td {
    padding: 8px 9px;
    border-bottom: 1px solid #f0f0f0;
    color: #333;
  }
  .fc-list {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    color: #555;
    line-height: 1.7;
  }
  .fc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
  }
  .fc-card {
    border: 1px solid #e5e5e5;
    border-radius: 7px;
    padding: 14px 15px;
    background: #fcfcfc;
  }
  .fc-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .fc-card-name {
    font-size: 14px;
    font-weight: 700;
  }
  .fc-card-purpose {
    margin: 0 0 10px;
    font-size: 12.5px;
    color: #666;
    line-height: 1.5;
  }
  .fc-card-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 0;
    border-top: 1px solid #f0f0f0;
    font-size: 12.5px;
  }
  .fc-card-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #888;
  }
  .fc-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .fc-chip {
    display: inline-block;
    font-size: 11px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 2px 7px;
    color: #374151;
    word-break: break-word;
  }
  .fc-trace-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  .fc-trace-card {
    border: 1px solid #e5e5e5;
    border-radius: 7px;
    padding: 12px 14px;
    background: #fcfcfc;
  }
  .fc-trace-chain {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
  }
  .fc-trace-step {
    color: #444;
    background: #f9f9f9;
    border: 1px solid #ececec;
    border-radius: 4px;
    padding: 3px 8px;
  }
  .fc-trace-strong {
    background: #111;
    color: #fff;
    border-color: #111;
    font-weight: 700;
  }
  .fc-trace-arrow { color: #999; font-weight: 700; }
  .fc-validation-summary {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-radius: 7px;
    padding: 14px 16px;
    margin-bottom: 16px;
    border: 1px solid;
  }
  .fc-validation-passed {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
  }
  .fc-validation-failed {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }
  .fc-validation-status {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }
  .fc-validation-detail {
    font-size: 12.5px;
  }
  .fc-issue-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .fc-issue {
    border: 1px solid #e5e5e5;
    border-left-width: 3px;
    border-radius: 6px;
    padding: 10px 13px;
    background: #fff;
  }
  .fc-issue-error { border-left-color: #dc2626; }
  .fc-issue-warning { border-left-color: #d97706; }
  .fc-issue-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .fc-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-radius: 4px;
    padding: 2px 7px;
    border: 1px solid;
  }
  .fc-badge-error {
    background: #fee2e2;
    color: #991b1b;
    border-color: #fecaca;
  }
  .fc-badge-warning {
    background: #fffbeb;
    color: #92400e;
    border-color: #fde68a;
  }
  .fc-badge-category {
    background: #f3f4f6;
    color: #374151;
    border-color: #e5e7eb;
  }
  .fc-badge-decision-required {
    background: #fdf4ff;
    color: #7e22ce;
    border-color: #e9d5ff;
  }
  .fc-badge-resolved {
    background: #f0fdf4;
    color: #166534;
    border-color: #bbf7d0;
  }
  .fc-issue-message {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: #333;
  }
  .fc-ai-issue {
    border: 1px solid #e5e5e5;
    border-left-width: 4px;
    border-radius: 6px;
    padding: 14px 16px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .fc-ai-issue-important { border-left-color: #dc2626; }
  .fc-ai-issue-minor { border-left-color: #d97706; }
  .fc-ai-issue-resolved { opacity: 0.7; }
  .fc-ai-issue-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #111;
  }
  .fc-ai-evidence {
    font-size: 12.5px;
    color: #555;
    line-height: 1.5;
  }
  .fc-ai-recommendation {
    font-size: 12.5px;
    color: #166534;
    line-height: 1.5;
  }
  .fc-ai-evidence-label {
    font-weight: 700;
    color: #111;
  }
  .fc-decision-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .fc-btn-decision {
    appearance: none;
    border: 1px solid #d4d4d4;
    background: #f5f5f5;
    color: #333;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    padding: 5px 13px;
    border-radius: 5px;
    cursor: pointer;
  }
  .fc-btn-decision:hover { background: #eee; }
  .fc-btn-decision-active {
    background: #111;
    color: #fff;
    border-color: #111;
  }
  .fc-custom-row {
    display: flex;
    gap: 6px;
    flex: 1;
    min-width: 200px;
  }
  .fc-custom-input {
    flex: 1;
    border: 1px solid #d4d4d4;
    border-radius: 5px;
    padding: 5px 10px;
    font-size: 12px;
    font-family: inherit;
    outline: none;
  }
  .fc-custom-input:focus { border-color: #111; }
  .fc-custom-saved {
    margin: 0;
    font-size: 11px;
    color: #166534;
    font-style: italic;
    width: 100%;
  }
  .fc-review-summary-box {
    border-radius: 8px;
    padding: 14px 16px;
    border: 1px solid;
    margin-bottom: 16px;
  }
  .fc-review-ready {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
  }
  .fc-review-not-ready {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }
  .fc-review-summary-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 8px;
  }
  .fc-review-readiness {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }
  .fc-review-counts {
    font-size: 12px;
    opacity: 0.8;
  }
  .fc-review-summary-text {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.6;
  }
  .fc-ai-empty {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .fc-approve-panel {
    margin-top: 20px;
    padding: 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .fc-empty {
    max-width: 560px;
    margin: 0 auto;
    padding: 90px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .fc-empty-title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }
  .fc-empty-desc {
    margin: 0;
    font-size: 14px;
    color: #555;
    line-height: 1.6;
  }
  .fc-notice-error {
    font-size: 13px;
    color: #991b1b;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 10px 14px;
  }
  .fc-btn-primary {
    appearance: none;
    border: none;
    background: #111;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    padding: 10px 22px;
    border-radius: 6px;
    cursor: pointer;
  }
  .fc-btn-primary:disabled {
    background: #999;
    cursor: not-allowed;
  }
  .fc-btn-secondary {
    appearance: none;
    border: 1px solid #d4d4d4;
    background: #f5f5f5;
    color: #333;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
  }
  .fc-btn-secondary:hover { background: #eee; }
  .fc-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .fc-btn-approve {
    appearance: none;
    border: none;
    background: #166534;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
  }
  .fc-btn-approve:hover { background: #14532d; }
  .fc-btn-approve:disabled { background: #999; cursor: not-allowed; }
  .fc-error {
    font-size: 13px;
    color: #991b1b;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 0 24px;
  }
  .fc-empty .fc-error { margin: 0; }
`;
