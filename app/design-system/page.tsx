import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

const COLORS: Array<{ token: string; label: string }> = [
  { token: "--color-primary", label: "Primary" },
  { token: "--color-primary-light", label: "Primary light" },
  { token: "--color-primary-dark", label: "Primary dark" },
  { token: "--color-accent", label: "Accent" },
  { token: "--color-background", label: "Background" },
  { token: "--color-surface", label: "Surface" },
  { token: "--color-surface-elevated", label: "Surface elevated" },
  { token: "--color-border", label: "Border" },
  { token: "--color-foreground", label: "Foreground" },
  { token: "--color-text-secondary", label: "Text secondary" },
  { token: "--color-success", label: "Success" },
  { token: "--color-warning", label: "Warning" },
  { token: "--color-danger", label: "Danger" },
  { token: "--color-info", label: "Info" },
];

const TYPE_SCALE: Array<{ token: string; label: string }> = [
  { token: "--text-display", label: "Display" },
  { token: "--text-page-title", label: "Page title" },
  { token: "--text-section-title", label: "Section title" },
  { token: "--text-card-title", label: "Card title" },
  { token: "--text-body", label: "Body" },
  { token: "--text-body-small", label: "Body small" },
  { token: "--text-caption", label: "Caption" },
  { token: "--text-code", label: "Code" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} style={{ marginBottom: 40 }}>
      <h2
        id={id}
        className="ws-panel-title"
        style={{ paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}
      >
        {title}
      </h2>
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

function BrandMarkSvg({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ color: "var(--color-primary)" }}
    >
      <path
        d="M 16 12 L 32 44 L 48 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="52" r="2" fill="currentColor" />
      <circle cx="26" cy="56" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="38" cy="56" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function BrandLogoSvg() {
  return (
    <svg
      viewBox="0 0 240 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      height={32}
      role="img"
      aria-label="VibePlan logo"
      style={{ width: 120, height: 32, color: "var(--color-foreground)" }}
    >
      <path
        d="M 16 12 L 32 44 L 48 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="52" r="2" fill="currentColor" />
      <text
        x="64"
        y="42"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="-0.5px"
      >
        VibePlan
      </text>
    </svg>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="vp-page">
      <nav className="vp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Design System</span>
      </nav>

      <header className="vp-page-header">
        <div>
          <p className="vp-eyebrow">Internal · Development only</p>
          <h1 className="vp-page-title">VibePlan Design System</h1>
          <p className="vp-page-desc">
            Reference for the reusable tokens and component classes used across
            the product. This page is only available in development builds.
          </p>
        </div>
      </header>

      <Section id="brand" title="Brand">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div
            className="card"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <BrandMarkSvg />
            <span style={{ fontWeight: 700 }}>VibePlan</span>
          </div>
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#0f0f0f",
              borderColor: "#333",
              color: "#fff",
            }}
          >
            <svg
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              width={32}
              height={32}
              aria-hidden="true"
              style={{ color: "#ffffff" }}
            >
              <path
                d="M 16 12 L 32 44 L 48 12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="52" r="2" fill="currentColor" />
              <circle cx="26" cy="56" r="1.5" fill="currentColor" opacity="0.6" />
              <circle cx="38" cy="56" r="1.5" fill="currentColor" opacity="0.6" />
            </svg>
            <span style={{ fontWeight: 700 }}>VibePlan</span>
          </div>
          <BrandLogoSvg />
        </div>
        <p className="vp-page-desc" style={{ marginTop: 12 }}>
          Product: VibePlan by zuroDev · AI Project Architect · “From Idea to
          Implementation.”
        </p>
      </Section>

      <Section id="colors" title="Color tokens">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {COLORS.map((c) => (
            <div
              key={c.token}
              className="card"
              style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: `var(${c.token})`,
                  flexShrink: 0,
                }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
                  {c.label}
                </span>
                <code style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                  {c.token}
                </code>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="typography" title="Typography">
        {TYPE_SCALE.map((t) => (
          <div key={t.token} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              {t.label} · {t.token}
            </div>
            <div style={{ font: `var(${t.token})`, color: "var(--color-foreground)" }}>
              The quick brown fox — 0123456789
            </div>
          </div>
        ))}
      </Section>

      <Section id="buttons" title="Buttons">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <button type="button" className="btn btn-primary">Primary</button>
          <button type="button" className="btn btn-secondary">Secondary</button>
          <button type="button" className="btn btn-accent">Accent</button>
          <button type="button" className="btn btn-danger">Danger</button>
          <button type="button" className="btn btn-ghost">Ghost</button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary btn-sm">Small</button>
          <button type="button" className="btn btn-primary">Default</button>
          <button type="button" className="btn btn-primary btn-lg">Large</button>
          <button type="button" className="btn btn-primary" disabled>
            Disabled
          </button>
        </div>
      </Section>

      <Section id="inputs" title="Inputs">
        <div style={{ maxWidth: 420 }}>
          <div className="form-group">
            <label htmlFor="ds-input">Project name</label>
            <input id="ds-input" className="input" placeholder="e.g. Inventory API" />
            <span className="help-text">Visible to project members.</span>
          </div>
          <div className="form-group">
            <label htmlFor="ds-textarea">Description</label>
            <textarea id="ds-textarea" className="textarea" placeholder="Short summary…" />
          </div>
          <div className="form-group">
            <label htmlFor="ds-select">Status</label>
            <select id="ds-select" className="select">
              <option>Active</option>
              <option>Archived</option>
            </select>
          </div>
        </div>
      </Section>

      <Section id="badges" title="Badges">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge badge-neutral">Not started</span>
          <span className="badge badge-draft">Draft</span>
          <span className="badge badge-review">In review</span>
          <span className="badge badge-approved">Approved</span>
          <span className="badge badge-completed">Completed</span>
          <span className="badge badge-blocked">Blocked</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-danger">Danger</span>
          <span className="badge badge-info">Info</span>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <div className="proj-grid" style={{ maxWidth: 720 }}>
          <article className="proj-card">
            <div className="proj-card-head">
              <h3 className="proj-card-title">Example project</h3>
              <span className="badge badge-neutral">Active</span>
            </div>
            <p className="proj-card-desc">
              Card body copy demonstrates description clamping and metadata
              spacing used on the dashboard.
            </p>
            <div className="proj-card-foot">
              <span className="proj-updated">Updated just now</span>
              <span className="btn btn-secondary btn-sm">Open project →</span>
            </div>
          </article>
        </div>
      </Section>

      <Section id="alerts" title="Alerts">
        <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
          <div className="alert alert-info">Informational message.</div>
          <div className="alert alert-success">Operation succeeded.</div>
          <div className="alert alert-warning">Review recommended.</div>
          <div className="alert alert-danger">Action failed.</div>
        </div>
      </Section>

      <Section id="tabs" title="Tabs">
        <div className="tabs" role="tablist" aria-label="Example tabs">
          <button type="button" className="tab is-active" role="tab" aria-selected="true">
            Document
          </button>
          <button type="button" className="tab" role="tab" aria-selected="false">
            AI Review
          </button>
          <button type="button" className="tab" role="tab" aria-selected="false">
            Decisions
          </button>
        </div>
      </Section>

      <Section id="dialogs" title="Dialog">
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            background: "var(--color-surface)",
            maxWidth: 480,
          }}
        >
          <div className="dialog">
            <div className="dialog-header">
              <h2 style={{ fontSize: "var(--font-size-lg)" }}>Approve document?</h2>
            </div>
            <div className="dialog-content" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Approval locks the current draft as the baseline for the next
              pipeline stage.
            </div>
            <div className="dialog-footer">
              <button type="button" className="btn btn-secondary btn-sm">Cancel</button>
              <button type="button" className="btn btn-primary btn-sm">Approve</button>
            </div>
          </div>
        </div>
      </Section>

      <Section id="table" title="Table">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Requirements</td>
                <td>
                  <span className="badge badge-approved">Approved</span>
                </td>
                <td>2026-09-30</td>
              </tr>
              <tr>
                <td>Architecture</td>
                <td>
                  <span className="badge badge-review">In review</span>
                </td>
                <td>2026-09-30</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="states" title="Empty & loading states">
        <div className="card" style={{ padding: 0, maxWidth: 560 }}>
          <div className="empty-state">
            <h3>Nothing here yet</h3>
            <p>Empty states explain what will appear and offer a next action.</p>
            <span className="btn btn-primary">Create item</span>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 16, maxWidth: 560 }}>
          <div className="skeleton" style={{ height: 20, borderRadius: 6, width: "40%" }} />
          <div className="skeleton" style={{ height: 14, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, borderRadius: 6, width: "80%" }} />
        </div>
      </Section>
    </div>
  );
}
