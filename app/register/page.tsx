"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setMessage(
      "Account created. Please check your email to confirm your account.",
    );

    setLoading(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <svg
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width="28"
            height="28"
            aria-hidden="true"
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
          <span className="auth-brand-name">VibePlan</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">
          Start turning ideas into implementation-ready blueprints.
        </p>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              className="input"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <span className="help-text">At least 8 characters.</span>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary btn-block${loading ? " is-loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}