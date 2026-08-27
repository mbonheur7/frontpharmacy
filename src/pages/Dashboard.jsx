import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { alertsApi } from "../api/alerts";
import { salesApi } from "../api/sales";
import { reportsApi } from "../api/reports";
import { useFetch } from "../hooks/useFetch";
import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "../components/StateViews";
import { formatMoney, formatDateTime } from "../utils/formatters";
import logoWatermark from "../assets/logo/vi-pharmacy-logo-transparent.png";


export default function Dashboard() {
  /* -----------------------------------------------------------
     Dashboard summary
  ----------------------------------------------------------- */

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useFetch(() => alertsApi.dashboard(), []);


  /* -----------------------------------------------------------
     Recent sales
  ----------------------------------------------------------- */

  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
  } = useFetch(() => salesApi.list(), []);


  /* -----------------------------------------------------------
     Inventory
  ----------------------------------------------------------- */

  const {
    data: inventory,
    loading: inventoryLoading,
    error: inventoryError,
  } = useFetch(() => reportsApi.inventory(), []);


  /* -----------------------------------------------------------
     Best selling medicines
  ----------------------------------------------------------- */

  const {
    data: bestSellingData,
    loading: bestSellingLoading,
    error: bestSellingError,
  } = useFetch(() => reportsApi.bestSelling(), []);


  /* -----------------------------------------------------------
     Prepare data
  ----------------------------------------------------------- */

  const recentSales = (salesData?.sales || []).slice(0, 6);

  const bestSelling = (bestSellingData?.medicines || [])
    .slice(0, 7)
    .map((medicine) => ({
      name:
        medicine.generic_name?.length > 18
          ? medicine.generic_name.slice(0, 18) + "…"
          : medicine.generic_name,
      quantity: medicine.quantity_sold,
    }));


  const stockHealth = summary
    ? [
        {
          name: "Healthy",
          value: Math.max(
            0,
            (inventory?.different_medicines || 0) -
              (summary.low_stock || 0) -
              (summary.critical_stock || 0) -
              (summary.out_of_stock || 0)
          ),
        },
        {
          name: "Low",
          value: summary.low_stock || 0,
        },
        {
          name: "Critical",
          value: summary.critical_stock || 0,
        },
        {
          name: "Out",
          value: summary.out_of_stock || 0,
        },
      ].filter((item) => item.value > 0)
    : [];


  if (summaryLoading) {
    return <LoadingState label="Loading dashboard…" />;
  }

  if (summaryError) {
    return <ErrorBanner error={summaryError} />;
  }


  return (
    <div className="dashboard-page">

      {/* -------------------------------------------------------
          Logo watermark
      ------------------------------------------------------- */}

      <img
        src={logoWatermark}
        alt=""
        className="dashboard-watermark"
        aria-hidden="true"
      />


      {/* -------------------------------------------------------
          Welcome / overview heading
      ------------------------------------------------------- */}

      <section className="dashboard-heading">
        <div>
          <div className="dashboard-eyebrow">PHARMACY OVERVIEW</div>
          <h1>Dashboard</h1>
          <p>
            A quick view of today's pharmacy activity and stock health.
          </p>
        </div>
      </section>


      {/* -------------------------------------------------------
          Main KPI cards
      ------------------------------------------------------- */}

      <div className="dashboard-stat-grid">

        <DashboardCard
          icon="₣"
          label="Today's revenue"
          value={formatMoney(summary.todays_revenue)}
          sub={`${summary.todays_transactions} transaction${
            summary.todays_transactions === 1 ? "" : "s"
          }`}
          tone="success"
        />

        <DashboardCard
          icon="▣"
          label="Inventory"
          value={inventoryLoading ? "…" : inventory?.total_items ?? 0}
          sub="items currently in stock"
          tone="info"
        />

        <DashboardCard
          icon="!"
          label="Critical stock"
          value={summary.critical_stock}
          sub="at or below critical level"
          tone="critical"
          to="/alerts"
        />

        <DashboardCard
          icon="△"
          label="Low stock"
          value={summary.low_stock}
          sub="at or below minimum"
          tone="warning"
          to="/alerts"
        />

        <DashboardCard
          icon="×"
          label="Out of stock"
          value={summary.out_of_stock}
          sub="currently unavailable"
          tone="danger"
          to="/alerts"
        />

        <DashboardCard
          icon="◷"
          label="Expiring soon"
          value={summary.expiring_soon}
          sub="within 30 days"
          tone="expiry"
          to="/alerts"
        />

      </div>


      {/* -------------------------------------------------------
          Alert banner
      ------------------------------------------------------- */}

      {(summary.critical_stock > 0 ||
        summary.out_of_stock > 0 ||
        summary.expired > 0) && (

        <section className="dashboard-alert-banner">

          <div className="dashboard-alert-icon">
            !
          </div>

          <div className="dashboard-alert-content">

            <strong>Attention required</strong>

            <span>
              {summary.out_of_stock > 0 &&
                `${summary.out_of_stock} medicine${
                  summary.out_of_stock === 1 ? "" : "s"
                } out of stock. `}

              {summary.critical_stock > 0 &&
                `${summary.critical_stock} at critical stock level. `}

              {summary.expired > 0 &&
                `${summary.expired} expired medicine${
                  summary.expired === 1 ? "" : "s"
                }.`}
            </span>

          </div>

          <Link to="/alerts" className="dashboard-alert-link">
            Review alerts →
          </Link>

        </section>
      )}


      {/* -------------------------------------------------------
          Charts
      ------------------------------------------------------- */}

      <div className="dashboard-chart-grid">

        {/* Best sellers */}

        <section className="card dashboard-chart-card">

          <div className="dashboard-section-heading">
            <div>
              <h3>Best-selling medicines</h3>
              <p>Top medicines by quantity sold</p>
            </div>

            <Link to="/reports">
              View reports →
            </Link>
          </div>


          {bestSellingLoading ? (
            <LoadingState label="Loading sales data…" />
          ) : bestSellingError ? (
            <ErrorBanner error={bestSellingError} />
          ) : bestSelling.length === 0 ? (
            <EmptyState label="No medicine sales recorded yet." />
          ) : (

            <div className="dashboard-chart">

              <ResponsiveContainer width="100%" height={280}>

                <BarChart
                  data={bestSelling}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--line)"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="var(--ink-faint)"
                    fontSize={11}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={105}
                    stroke="var(--ink-faint)"
                    fontSize={11}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value} units`,
                      "Sold",
                    ]}
                    contentStyle={{
                      background: "var(--paper-alt)",
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      color: "var(--ink)",
                    }}
                  />

                  <Bar
                    dataKey="quantity"
                    fill="var(--blue-600)"
                    radius={[0, 5, 5, 0]}
                    barSize={18}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          )}

        </section>


        {/* Stock health */}

        <section className="card dashboard-chart-card">

          <div className="dashboard-section-heading">

            <div>
              <h3>Stock health</h3>
              <p>Current inventory condition</p>
            </div>

            <Link to="/alerts">
              View alerts →
            </Link>

          </div>


          {inventoryLoading ? (
            <LoadingState label="Loading inventory…" />
          ) : inventoryError ? (
            <ErrorBanner error={inventoryError} />
          ) : stockHealth.length === 0 ? (
            <EmptyState label="No inventory information available." />
          ) : (

            <div className="stock-health-chart">

              <ResponsiveContainer width="100%" height={220}>

                <PieChart>

                  <Pie
                    data={stockHealth}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                  >

                    {stockHealth.map((entry) => (

                      <Cell
                        key={entry.name}
                        fill={getStockColor(entry.name)}
                      />

                    ))}

                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name,
                    ]}
                    contentStyle={{
                      background: "var(--paper-alt)",
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      color: "var(--ink)",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>


              <div className="stock-health-center">

                <strong>
                  {inventory?.different_medicines || 0}
                </strong>

                <span>medicines</span>

              </div>


              <div className="stock-health-legend">

                {stockHealth.map((item) => (

                  <div
                    key={item.name}
                    className="stock-health-item"
                  >

                    <span
                      className="stock-health-dot"
                      style={{
                        background: getStockColor(item.name),
                      }}
                    />

                    <span>{item.name}</span>

                    <strong>{item.value}</strong>

                  </div>

                ))}

              </div>

            </div>

          )}

        </section>

      </div>


      {/* -------------------------------------------------------
          Secondary information
      ------------------------------------------------------- */}

      <div className="dashboard-secondary-grid">

        {/* Expiry overview */}

        <section className="card dashboard-mini-card">

          <div className="dashboard-mini-icon expiry">
            ◷
          </div>

          <div>

            <div className="dashboard-mini-label">
              EXPIRY MONITOR
            </div>

            <div className="dashboard-mini-value">
              {summary.expired}
            </div>

            <div className="dashboard-mini-sub">
              expired medicine{summary.expired === 1 ? "" : "s"}
            </div>

          </div>

          <Link to="/alerts" className="dashboard-mini-link">
            Review →
          </Link>

        </section>


        {/* Transactions */}

        <section className="card dashboard-mini-card">

          <div className="dashboard-mini-icon sales">
            ₣
          </div>

          <div>

            <div className="dashboard-mini-label">
              TODAY'S ACTIVITY
            </div>

            <div className="dashboard-mini-value">
              {summary.todays_transactions}
            </div>

            <div className="dashboard-mini-sub">
              completed transaction
              {summary.todays_transactions === 1 ? "" : "s"}
            </div>

          </div>

          <Link to="/sales" className="dashboard-mini-link">
            View →
          </Link>

        </section>

      </div>


      {/* -------------------------------------------------------
          Recent sales
      ------------------------------------------------------- */}

      <section className="card card-pad dashboard-sales-card">

        <div className="dashboard-section-heading">

          <div>
            <h3>Recent sales</h3>
            <p>Latest completed transactions</p>
          </div>

          <Link to="/sales">
            View all →
          </Link>

        </div>


        {salesLoading ? (

          <LoadingState label="Loading recent sales…" />

        ) : salesError ? (

          <ErrorBanner error={salesError} />

        ) : recentSales.length === 0 ? (

          <EmptyState label="No sales recorded yet." />

        ) : (

          <div className="table-wrap">

            <table className="table">

              <thead>

                <tr>
                  <th>Receipt</th>
                  <th>Cashier</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>
                    Total
                  </th>
                </tr>

              </thead>

              <tbody>

                {recentSales.map((sale) => (

                  <tr key={sale.id}>

                    <td className="mono">
                      {sale.receipt_number}
                    </td>

                    <td>
                      {sale.sold_by_name}
                    </td>

                    <td>
                      {formatDateTime(sale.sale_date)}
                    </td>

                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {formatMoney(sale.total_amount)}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


/* =============================================================
   Dashboard KPI card
============================================================= */

function DashboardCard({
  icon,
  label,
  value,
  sub,
  tone,
  to,
}) {
  const content = (
    <>
      <div className={`dashboard-card-icon ${tone || ""}`}>
        {icon}
      </div>

      <div className="dashboard-card-content">

        <div className="stat-label">
          {label}
        </div>

        <div className="stat-value">
          {value}
        </div>

        <div className="stat-sub">
          {sub}
        </div>

      </div>

      {to && (
        <div className="dashboard-card-arrow">
          →
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`stat-card dashboard-stat-card tone-${tone || "default"}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`stat-card dashboard-stat-card tone-${tone || "default"}`}
    >
      {content}
    </div>
  );
}


/* =============================================================
   Stock chart colors
============================================================= */

function getStockColor(name) {
  switch (name) {
    case "Healthy":
      return "var(--green-600)";

    case "Low":
      return "var(--warning)";

    case "Critical":
      return "var(--critical)";

    case "Out":
      return "var(--danger)";

    default:
      return "var(--blue-600)";
  }
}