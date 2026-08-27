import React from "react";
import { alertsApi } from "../api/alerts";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, ErrorBanner } from "../components/StateViews";
import { formatDate, daysUntil } from "../utils/formatters";

export default function Alerts() {
  const critical = useFetch(() => alertsApi.criticalStock(), []);
  const outOfStock = useFetch(() => alertsApi.outOfStock(), []);
  const lowStock = useFetch(() => alertsApi.lowStock(), []);
  const expired = useFetch(() => alertsApi.expired(), []);
  const expiringSoon = useFetch(() => alertsApi.expiringSoon(), []);

  const sections = [
    { key: "critical", title: "Critical stock", tone: "critical", ...critical, kind: "stock" },
    { key: "out", title: "Out of stock", tone: "danger", ...outOfStock, kind: "stock" },
    { key: "low", title: "Low stock", tone: "warning", ...lowStock, kind: "stock" },
    { key: "expired", title: "Expired", tone: "danger", ...expired, kind: "expiry" },
    { key: "expiring", title: "Expiring soon", tone: "info", ...expiringSoon, kind: "expiry" },
  ];

  const anyLoading = sections.some((s) => s.loading);

  return (
    <div>
      {anyLoading && <LoadingState label="Loading alerts…" />}
      <div className="stat-grid">
        {sections.map((section) => {
          const medicines = section.data?.medicines || [];
          return (
            <div key={section.key} className="card card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14.5 }}>{section.title}</h3>
                {!section.loading && !section.error && (
                  <span className={`badge badge-${section.tone}`}>{medicines.length}</span>
                )}
              </div>
              {section.loading ? (
                <div style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>Loading…</div>
              ) : section.error ? (
                <ErrorBanner error={section.error} />
              ) : medicines.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>Nothing to flag here.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 240, overflowY: "auto" }}>
                  {medicines.map((m) => (
                    <div key={m.id} style={{ fontSize: 12.5, paddingBottom: 7, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 600 }}>{m.generic_name}</div>
                      <div style={{ color: "var(--ink-dim)" }}>
                        {section.kind === "expiry"
                          ? `${section.key === "expired" ? "Expired" : "Expires"} ${formatDate(m.expiry_date)} (${daysUntil(m.expiry_date)}d)`
                          : `Qty ${m.quantity} (min ${m.minimum_stock}, critical ${m.critical_stock})`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
