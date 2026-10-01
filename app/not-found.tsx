import Link from "next/link";

export default function NotFound() {
  return (
    <div className="state-page">
      <p className="vp-eyebrow">404</p>
      <h1>Page not found</h1>
      <p>
        The page you are looking for does not exist or you do not have access
        to it.
      </p>
      <div className="state-actions">
        <Link href="/dashboard" className="btn btn-primary">
          Back to dashboard
        </Link>
        <Link href="/" className="btn btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
