import React from "react";
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="center-page">
      <h2>Access restricted</h2>
      <p style={{ color: "var(--ink-dim)", maxWidth: 380 }}>
        This section is only available to administrators. If you believe you
        should have access, contact an administrator.
      </p>
      <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 8 }}>
        Back to dashboard
      </Link>
    </div>
  );
}
