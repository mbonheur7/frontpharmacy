import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="center-page">
      <h2>Page not found</h2>
      <p style={{ color: "var(--ink-dim)" }}>The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 8 }}>
        Back to dashboard
      </Link>
    </div>
  );
}
