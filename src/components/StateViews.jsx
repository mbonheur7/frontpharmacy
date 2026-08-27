import React from "react";

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="state-block">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ label = "Nothing here yet." }) {
  return (
    <div className="state-block">
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ error, fallback = "Something went wrong." }) {
  if (!error) return null;
  const message = typeof error === "string" ? error : error.message || fallback;
  return (
    <div className="error-banner" role="alert">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  );
}
