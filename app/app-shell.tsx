"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const GENERAL_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
];

const PROJECT_STAGES = [
  { key: "", label: "Overview", step: "00" },
  { key: "discovery", label: "Discovery", step: "01" },
  { key: "requirements", label: "Requirements", step: "02" },
  { key: "architecture", label: "Architecture", step: "03" },
  { key: "erd", label: "ERD", step: "04" },
  { key: "dfd", label: "DFD", step: "05" },
  { key: "flowchart", label: "Flowchart", step: "06" },
  { key: "blueprint", label: "Blueprint", step: "07" },
  { key: "agent-package", label: "Agent Package", step: "08" },
  { key: "design-system", label: "Design System", step: "09" },
  { key: "engineering-plan", label: "Engineering Plan", step: "10" },
];

const PUBLIC_PATHS = ["/", "/login", "/register"];

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M 16 12 L 32 44 L 48 12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="53" r="3" fill="currentColor" />
    </svg>
  );
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      className="shell-nav-icon"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICON_DASHBOARD = "M2 8.5 L8 2.5 L14 8.5 M4 7.5 V13.5 H12 V7.5";
const ICON_PROJECTS = "M2.5 4 H6 L7.5 5.5 H13.5 V13 H2.5 Z";

function extractProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^\/]+)/);
  if (!match) return null;
  const segment = match[1];
  if (segment === "new") return null;
  return segment;
}

export function AppShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const [projectNameState, setProjectNameState] = useState<{
    id: string | null;
    name: string | null;
  }>({ id: null, name: null });
  const [signingOut, setSigningOut] = useState(false);

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const projectId = isPublic ? null : extractProjectId(pathname);

  const closeNav = useCallback(() => setNavOpen(false), []);

  // Close drawer on route change (adjust state during render)
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setNavOpen(false);
  }

  // Close drawer on Escape
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNav();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen, closeNav]);

  // Load project name when inside a project (RLS-protected, user session)
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setProjectNameState({ id: projectId, name: data?.name ?? null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const projectName =
    projectNameState.id === projectId ? projectNameState.name : null;

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPublic) {
    return <div className="shell-public">{children}</div>;
  }

  const projectActive = (key: string) => {
    if (!projectId) return false;
    const base = `/projects/${projectId}`;
    if (key === "") return pathname === base;
    return pathname === `${base}/${key}`;
  };

  const generalActive = (href: string) =>
    href === "/projects"
      ? pathname.startsWith("/projects") && !projectId
      : pathname === href;

  return (
    <div className={`shell${navOpen ? " is-nav-open" : ""}`}>
      <a href="#vp-main" className="skip-to-content">
        Skip to main content
      </a>

      {/* Topbar */}
      <header className="shell-topbar">
        <button
          type="button"
          className="shell-menu-btn"
          aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={navOpen}
          aria-controls="vp-sidebar"
          onClick={() => setNavOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d={navOpen ? "M4 4 L14 14 M14 4 L4 14" : "M3 5 H15 M3 9 H15 M3 13 H15"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <Link href="/dashboard" className="shell-brand" aria-label="VibePlan home">
          <BrandMark className="shell-brand-mark" />
          <span className="shell-brand-name">VibePlan</span>
          <span className="shell-brand-by">by zuroDev</span>
        </Link>

        <div className="shell-topbar-right">
          <span className="shell-topbar-tagline">AI Project Architect</span>
        </div>
      </header>

      {/* Overlay for mobile drawer */}
      <div
        className="shell-overlay"
        onClick={closeNav}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <nav
        id="vp-sidebar"
        className="shell-sidebar"
        aria-label="Primary navigation"
      >
        <div className="shell-nav">
          <div>
            <p className="shell-nav-group-label">General</p>
            <ul className="shell-nav-list">
              {GENERAL_NAV.map((item) => {
                const active = generalActive(item.href);
                const icon =
                  item.href === "/dashboard" ? ICON_DASHBOARD : ICON_PROJECTS;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`shell-nav-link${active ? " is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      onClick={closeNav}
                    >
                      <NavIcon d={icon} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {projectId && (
            <div>
              <p className="shell-nav-group-label">
                Current Project
                {projectName ? ` — ${projectName}` : ""}
              </p>
              <ul className="shell-nav-list">
                {PROJECT_STAGES.map((stage) => {
                  const active = projectActive(stage.key);
                  const href =
                    stage.key === ""
                      ? `/projects/${projectId}`
                      : `/projects/${projectId}/${stage.key}`;
                  return (
                    <li key={stage.key || "overview"}>
                      <Link
                        href={href}
                        className={`shell-nav-link${active ? " is-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                        onClick={closeNav}
                      >
                        <span className="shell-nav-step">{stage.step}</span>
                        {stage.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="shell-sidebar-footer">
          {userEmail && <div className="shell-user">{userEmail}</div>}
          {process.env.NODE_ENV !== "production" && (
            <Link href="/design-system" className="shell-signout" onClick={closeNav}>
              Design system (dev)
            </Link>
          )}
          <button
            type="button"
            className="shell-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="shell-main" id="vp-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
