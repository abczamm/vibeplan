"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="state-page" role="alert">
      <svg
        className="empty-state-icon"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
        <path
          d="M24 15 V27 M24 33 V33.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <h1>Something went wrong</h1>
      <p>
        An unexpected error occurred while loading this page.
        {error?.digest ? ` (Reference: ${error.digest})` : ""}
      </p>
      <div className="state-actions">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
