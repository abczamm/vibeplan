export default function Loading() {
  return (
    <div className="state-page" role="status" aria-live="polite">
      <span className="loading-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <p style={{ marginTop: 16 }}>Loading VibePlan…</p>
    </div>
  );
}
