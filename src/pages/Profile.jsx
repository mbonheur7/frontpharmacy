import React from "react";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/formatters";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>Account details</h3>
        <Field label="Full name" value={user.fullname} />
        <Field label="Username" value={user.username} />
        <Field label="Role" value={user.role} />
        <Field label="Account created" value={formatDateTime(user.created_at)} />

        <div
          style={{
            marginTop: 18,
            padding: "10px 12px",
            background: "var(--blue-50)",
            border: "1px solid var(--blue-100)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12.5,
            color: "var(--ink-dim)",
          }}
        >
          Password changes are handled by an administrator. If you need your
          password reset, contact one.
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-dim)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14.5, marginTop: 2 }}>{value}</div>
    </div>
  );
}
