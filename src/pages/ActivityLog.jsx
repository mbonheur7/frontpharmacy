import React, { useState } from "react";
import { activityLogsApi } from "../api/activityLogs";
import { useFetch } from "../hooks/useFetch";
import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "../components/StateViews";
import { formatDateTime } from "../utils/formatters";

export default function ActivityLog() {
  const [action, setAction] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const { data, loading, error } = useFetch(
    () =>
      activityLogsApi.list({
        action: action || undefined,
        start: start || undefined,
        end: end || undefined,
      }),
    [action, start, end]
  );

  const logs = data?.activity_logs || [];

  return (
    <div className="activity-log-page">

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <div className="activity-log-filters">

        {/* Action filter */}
        <div className="activity-log-action-filter">
          <input
            className="input"
            placeholder="Filter by action (e.g. login)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>


        {/* Start date */}
        <div className="date-filter">
          <label htmlFor="activity-start-date">
            Start date
          </label>

          <div className="date-input-wrap">
            {!start && (
              <span className="date-placeholder">
                Start date
              </span>
            )}

            <input
              id="activity-start-date"
              className="input"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-label="Start date"
            />
          </div>
        </div>


        {/* End date */}
        <div className="date-filter">
          <label htmlFor="activity-end-date">
            End date
          </label>

          <div className="date-input-wrap">
            {!end && (
              <span className="date-placeholder">
                End date
              </span>
            )}

            <input
              id="activity-end-date"
              className="input"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              aria-label="End date"
            />
          </div>
        </div>

      </div>


      {/* =====================================================
          ACTIVITY TABLE
          ===================================================== */}

      <div className="card activity-log-card">

        {loading ? (
          <LoadingState label="Loading activity log…" />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : logs.length === 0 ? (
          <EmptyState label="No matching activity found." />
        ) : (
          <div className="activity-log-table-wrap">

            <table className="table activity-log-table">

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

                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(l.occurred_at)}
                    </td>

                    <td>
                      {l.user_name || "-"}
                    </td>

                    <td>
                      <span className="badge badge-neutral">
                        {l.action}
                      </span>
                    </td>

                    <td
                      className="activity-log-details"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {l.details || "-"}
                    </td>

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