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

        {/* Action search */}
        <div className="activity-log-action-filter">
          <input
            className="input"
            placeholder="Filter by action (e.g. login)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>


        {/* Start date */}
        <label className="date-filter">
          <span>Start date</span>

          <input
            className="input"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-label="Start date"
          />
        </label>


        {/* End date */}
        <label className="date-filter">
          <span>End date</span>

          <input
            className="input"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="End date"
          />
        </label>

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

          <div className="table-wrap activity-log-table-wrap">

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

                {logs.map((log) => (

                  <tr key={log.id}>

                    <td className="activity-log-date">
                      {formatDateTime(log.occurred_at)}
                    </td>

                    <td className="activity-log-user">
                      {log.user_name || "-"}
                    </td>

                    <td className="activity-log-action">
                      <span className="badge badge-neutral">
                        {log.action}
                      </span>
                    </td>

                    <td
                      className="activity-log-details"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {log.details || "-"}
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