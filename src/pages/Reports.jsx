import React, { useState } from "react";
import { reportsApi } from "../api/reports";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { LoadingState, EmptyState, ErrorBanner } from "../components/StateViews";
import { formatMoney, formatDate } from "../utils/formatters";

export default function Reports() {
  const [tab, setTab] = useState("overview");

  return (
    <div>
      <div className="tabs">
        <div className={"tab" + (tab === "overview" ? " active" : "")} onClick={() => setTab("overview")}>Overview</div>
        <div className={"tab" + (tab === "sales" ? " active" : "")} onClick={() => setTab("sales")}>Sales</div>
        <div className={"tab" + (tab === "products" ? " active" : "")} onClick={() => setTab("products")}>Products</div>
        <div className={"tab" + (tab === "expired" ? " active" : "")} onClick={() => setTab("expired")}>Expired</div>
      </div>
      {tab === "overview" && <OverviewTab />}
      {tab === "sales" && <SalesTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "expired" && <ExpiredTab />}
    </div>
  );
}

function ReportCard({ title, children }) {
  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 14.5, marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}
function Row({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ color: "var(--ink-dim)" }}>{label}</span>
      <span className="mono" style={{ fontWeight: highlight ? 700 : 500, color: highlight ? "var(--green-700)" : "var(--ink)" }}>
        {value}
      </span>
    </div>
  );
}

function OverviewTab() {
  const { isAdmin } = useAuth();
  const inv = useFetch(() => reportsApi.inventory(), []);
  const purchase = useFetch(() => (isAdmin ? reportsApi.purchase() : Promise.resolve(null)), [isAdmin]);
  const profit = useFetch(() => (isAdmin ? reportsApi.profit() : Promise.resolve(null)), [isAdmin]);

  if (inv.loading) return <LoadingState label="Loading inventory report…" />;
  if (inv.error) return <ErrorBanner error={inv.error} />;

  return (
    <div className="stat-grid">
      <ReportCard title="Inventory">
        <Row label="Different medicines" value={inv.data.different_medicines} />
        <Row label="Total items in stock" value={inv.data.total_items} />
        <Row label="Selling value" value={formatMoney(inv.data.selling_value)} highlight />
      </ReportCard>

      {isAdmin && (
        <ReportCard title="Purchase (Admin)">
          {purchase.loading ? (
            <LoadingState label="Loading…" />
          ) : purchase.error ? (
            <ErrorBanner error={purchase.error} />
          ) : (
            <>
              <Row label="Different medicines" value={purchase.data.different_medicines} />
              <Row label="Purchase value (cost)" value={formatMoney(purchase.data.purchase_value)} highlight />
            </>
          )}
        </ReportCard>
      )}

      {isAdmin && (
        <ReportCard title="Profit (Admin)">
          {profit.loading ? (
            <LoadingState label="Loading…" />
          ) : profit.error ? (
            <ErrorBanner error={profit.error} />
          ) : (
            <>
              <Row label="Expected inventory profit" value={formatMoney(profit.data.expected_inventory_profit)} />
              <Row label="Realized profit (all time)" value={formatMoney(profit.data.realized_profit_all_time)} highlight />
            </>
          )}
        </ReportCard>
      )}
    </div>
  );
}

const PERIODS = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "This week" },
  { key: "monthly", label: "This month" },
  { key: "yearly", label: "This year" },
  { key: "range", label: "Custom range" },
];

function SalesTab() {
  const [period, setPeriod] = useState("daily");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rangeRequested, setRangeRequested] = useState(false);

  const { data, loading, error } = useFetch(() => {
    if (period === "daily") return reportsApi.daily();
    if (period === "weekly") return reportsApi.weekly();
    if (period === "monthly") return reportsApi.monthly();
    if (period === "yearly") return reportsApi.yearly();
    if (period === "range" && rangeRequested && start && end) return reportsApi.range(start, end);
    return Promise.resolve(null);
  }, [period, rangeRequested, start, end]);

  return (
    <div>
      <div className="toolbar">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className="btn btn-sm"
            style={
              period === p.key
                ? { background: "var(--blue-100)", borderColor: "var(--blue-700)", color: "var(--blue-700)" }
                : undefined
            }
            onClick={() => { setPeriod(p.key); setRangeRequested(false); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "range" && (
  <div className="sales-report-range">
    <div className="sales-report-date-field">
      <label>Start date</label>
      <input
        className="input"
        type="date"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />
    </div>

    <div className="sales-report-date-field">
      <label>End date</label>
      <input
        className="input"
        type="date"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
      />
    </div>

    <button
      className="btn btn-primary sales-report-run"
      disabled={!start || !end}
      onClick={() => setRangeRequested(true)}
    >
      Run report
    </button>
  </div>
)}

      {period === "range" && !rangeRequested ? (
        <EmptyState label="Choose a start and end date, then run the report." />
      ) : loading ? (
        <LoadingState label="Loading…" />
      ) : error ? (
        <ErrorBanner error={error} />
      ) : !data ? null : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{data.transactions}</div>
          </div>
          <div className="stat-card tone-success">
            <div className="stat-label">Revenue</div>
            <div className="stat-value">{formatMoney(data.revenue)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const best = useFetch(() => reportsApi.bestSelling(), []);
  const lowest = useFetch(() => reportsApi.lowestSelling(), []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <ReportCard title="Best selling">
        {best.loading ? (
          <LoadingState label="Loading…" />
        ) : best.error ? (
          <ErrorBanner error={best.error} />
        ) : (best.data?.medicines || []).length === 0 ? (
          <EmptyState label="No sales yet." />
        ) : (
          best.data.medicines.map((m) => <Row key={m.generic_name} label={m.generic_name} value={`${m.quantity_sold} sold`} />)
        )}
      </ReportCard>
      <ReportCard title="Lowest selling">
        {lowest.loading ? (
          <LoadingState label="Loading…" />
        ) : lowest.error ? (
          <ErrorBanner error={lowest.error} />
        ) : (lowest.data?.medicines || []).length === 0 ? (
          <EmptyState label="No sales yet." />
        ) : (
          lowest.data.medicines.map((m) => <Row key={m.generic_name} label={m.generic_name} value={`${m.quantity_sold} sold`} />)
        )}
      </ReportCard>
    </div>
  );
}

function ExpiredTab() {
  const { data, loading, error } = useFetch(() => reportsApi.expiredMedicines(), []);
  const medicines = data?.medicines || [];

  if (loading) return <LoadingState label="Loading…" />;
  if (error) return <ErrorBanner error={error} />;
  if (medicines.length === 0) return <EmptyState label="No expired medicines." />;

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Expiry date</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => (
              <tr key={i}>
                <td>{m.generic_name}</td>
                <td>{formatDate(m.expiry_date)}</td>
                <td className="mono">{m.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
