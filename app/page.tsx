import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-background)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-6)",
    }}>
      <main style={{
        maxWidth: "600px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-8)",
      }}>
        {/* Logo & Branding */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", alignItems: "center" }}>
          <div style={{ width: "4rem", height: "4rem", color: "var(--color-primary)" }}>
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: "100%", height: "100%" }}>
              <path d="M 16 12 L 32 44 L 48 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="32" cy="52" r="2" fill="currentColor" />
            </svg>
          </div>
          <h1 style={{
            font: "var(--text-page-title)",
            margin: 0,
            color: "var(--color-foreground)",
          }}>
            VibePlan
          </h1>
          <p style={{
            font: "var(--text-body)",
            color: "var(--color-text-secondary)",
            margin: 0,
          }}>
            AI Project Architect
          </p>
        </div>

        {/* Hero Text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h2 style={{
            font: "var(--text-section-title)",
            margin: 0,
            color: "var(--color-foreground)",
          }}>
            From Idea to Implementation.
          </h2>
          <p style={{
            font: "var(--text-body)",
            color: "var(--color-text-secondary)",
            margin: 0,
            lineHeight: "var(--line-height-relaxed)",
          }}>
            Transform rough software ideas into structured, validated, implementation-ready project blueprints through AI-powered analysis and guided discovery.
          </p>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          <Link href="/login" className="btn btn-primary btn-lg" style={{ textAlign: "center" }}>
            Sign In
          </Link>
          <Link href="/register" className="btn btn-secondary btn-lg" style={{ textAlign: "center" }}>
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <p style={{
          font: "var(--text-caption)",
          color: "var(--color-text-tertiary)",
          margin: "var(--space-8) 0 0",
          borderTop: "1px solid var(--color-border)",
          paddingTop: "var(--space-6)",
        }}>
          VibePlan by zuroDev
        </p>
      </main>
    </div>
  );
}

