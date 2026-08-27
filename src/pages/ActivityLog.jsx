import React, { useState } from "react";
import { activityLogsApi } from "../api/activityLogs";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, EmptyState, ErrorBanner } from "../components/StateViews";
import { formatDateTime } from "../utils/formatters";

export default function ActivityLog() {
  const [action, setAction] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const { data, loading, error } = useFetch(
    () => activityLogsApi.list({ action: action || undefined, start: start || undefined, end: end || undefined }),
    [action, start, end]
  );
  const logs = data?.activity_logs || [];

  return (
    <div>
      <div className="toolbar">
        <input
          className="input"
          style={{ maxWidth: 220 }}
          placeholder="Filter by action (e.g. login)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
        <input className="input" style={{ maxWidth: 170 }} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input className="input" style={{ maxWidth: 170 }} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>

      <div className="card">
        {loading ? (
          <LoadingState label="Loading activity log…" />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : logs.length === 0 ? (
          <EmptyState label="No matching activity found." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date/time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(l.occurred_at)}</td>
                    <td>{l.user_name || "-"}</td>
                    <td>
                      <span className="badge badge-neutral">{l.action}</span>
                    </td>
                    <td style={{ color: "var(--ink-dim)" }}>{l.details || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
