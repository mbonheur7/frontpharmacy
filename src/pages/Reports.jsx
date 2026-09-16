import React, {
  useState,
} from "react";

import {
  reportsApi,
} from "../api/reports";

import {
  useFetch,
} from "../hooks/useFetch";

import {
  useAuth,
} from "../context/AuthContext";

import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "../components/StateViews";

import {
  formatMoney,
  formatDate,
} from "../utils/formatters";


// =========================================================
// REPORTS PAGE
// =========================================================

export default function Reports() {

  const [
    tab,
    setTab,
  ] =
    useState(
      "overview"
    );


  return (

    <div>


      {/* ================================================
          TABS
          ================================================ */}

      <div
        className="tabs"
      >


        {/* OVERVIEW */}

        <div

          className={
            "tab" +
            (
              tab === "overview"
                ? " active"
                : ""
            )
          }

          onClick={() =>
            setTab(
              "overview"
            )
          }

        >

          Overview

        </div>


        {/* SALES */}

        <div

          className={
            "tab" +
            (
              tab === "sales"
                ? " active"
                : ""
            )
          }

          onClick={() =>
            setTab(
              "sales"
            )
          }

        >

          Sales

        </div>


        {/* PRODUCTS */}

        <div

          className={
            "tab" +
            (
              tab === "products"
                ? " active"
                : ""
            )
          }

          onClick={() =>
            setTab(
              "products"
            )
          }

        >

          Products

        </div>


        {/* EXPIRED */}

        <div

          className={
            "tab" +
            (
              tab === "expired"
                ? " active"
                : ""
            )
          }

          onClick={() =>
            setTab(
              "expired"
            )
          }

        >

          Expired

        </div>


      </div>


      {/* ================================================
          TAB CONTENT
          ================================================ */}

      {tab === "overview" && (
        <OverviewTab />
      )}


      {tab === "sales" && (
        <SalesTab />
      )}


      {tab === "products" && (
        <ProductsTab />
      )}


      {tab === "expired" && (
        <ExpiredTab />
      )}


    </div>

  );

}


// =========================================================
// REPORT CARD
// =========================================================

function ReportCard({
  title,
  children,
}) {

  return (

    <div
      className="card card-pad"
    >

      <h3
        style={{
          fontSize: 14.5,
          marginBottom: 12,
        }}
      >

        {title}

      </h3>


      {children}


    </div>

  );

}


// =========================================================
// ROW
// =========================================================

function Row({
  label,
  value,
  highlight,
}) {

  return (

    <div

      style={{

        display:
          "flex",

        justifyContent:
          "space-between",

        fontSize:
          13,

        padding:
          "6px 0",

        borderBottom:
          "1px solid var(--line)",

      }}

    >


      <span

        style={{
          color:
            "var(--ink-dim)",
        }}

      >

        {label}

      </span>


      <span

        className="mono"

        style={{

          fontWeight:
            highlight
              ? 700
              : 500,

          color:
            highlight
              ? "var(--green-700)"
              : "var(--ink)",

        }}

      >

        {value}

      </span>


    </div>

  );

}


// =========================================================
// OVERVIEW
// =========================================================

function OverviewTab() {

  const {
    canViewAdminControls,
  } =
    useAuth();


  // =====================================================
  // INVENTORY
  // Available to all logged-in users
  // =====================================================

  const inv =
    useFetch(
      () =>
        reportsApi.inventory(),
      []
    );


  // =====================================================
  // PURCHASE
  // Available to:
  // - Super Admin
  // - Admin Viewer
  // =====================================================

  const purchase =
    useFetch(

      () =>

        canViewAdminControls
          ? reportsApi.purchase()
          : Promise.resolve(null),

      [
        canViewAdminControls,
      ]

    );


  // =====================================================
  // PROFIT
  // Available to:
  // - Super Admin
  // - Admin Viewer
  // =====================================================

  const profit =
    useFetch(

      () =>

        canViewAdminControls
          ? reportsApi.profit()
          : Promise.resolve(null),

      [
        canViewAdminControls,
      ]

    );


  // =====================================================
  // INVENTORY LOADING
  // =====================================================

  if (inv.loading) {

    return (
      <LoadingState
        label="Loading inventory report…"
      />
    );

  }


  // =====================================================
  // INVENTORY ERROR
  // =====================================================

  if (inv.error) {

    return (
      <ErrorBanner
        error={inv.error}
      />
    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className="stat-grid"
    >


      {/* ================================================
          INVENTORY
          ================================================ */}

      <ReportCard
        title="Inventory"
      >

        <Row

          label="Different medicines"

          value={
            inv.data
              ?.different_medicines ??
            0
          }

        />


        <Row

          label="Total items in stock"

          value={
            inv.data
              ?.total_items ??
            0
          }

        />


        <Row

          label="Selling value"

          value={
            formatMoney(
              inv.data
                ?.selling_value ??
              0
            )
          }

          highlight

        />


      </ReportCard>


      {/* ================================================
          PURCHASE
          SUPER ADMIN + ADMIN VIEWER
          ================================================ */}

      {canViewAdminControls && (

        <ReportCard
          title="Purchase"
        >

          {purchase.loading ? (

            <LoadingState
              label="Loading…"
            />

          ) : purchase.error ? (

            <ErrorBanner
              error={
                purchase.error
              }
            />

          ) : (

            <>

              <Row

                label="Different medicines"

                value={
                  purchase.data
                    ?.different_medicines ??
                  0
                }

              />


              <Row

                label="Purchase value (cost)"

                value={
                  formatMoney(
                    purchase.data
                      ?.purchase_value ??
                    0
                  )
                }

                highlight

              />


            </>

          )}

        </ReportCard>

      )}


      {/* ================================================
          PROFIT
          SUPER ADMIN + ADMIN VIEWER
          ================================================ */}

      {canViewAdminControls && (

        <ReportCard
          title="Profit"
        >

          {profit.loading ? (

            <LoadingState
              label="Loading…"
            />

          ) : profit.error ? (

            <ErrorBanner
              error={
                profit.error
              }
            />

          ) : (

            <>

              <Row

                label="Expected inventory profit"

                value={
                  formatMoney(
                    profit.data
                      ?.expected_inventory_profit ??
                    0
                  )
                }

              />


              <Row

                label="Realized profit (all time)"

                value={
                  formatMoney(
                    profit.data
                      ?.realized_profit_all_time ??
                    0
                  )
                }

                highlight

              />


            </>

          )}

        </ReportCard>

      )}


    </div>

  );

}


// =========================================================
// SALES
// =========================================================

const PERIODS = [

  {
    key: "daily",
    label: "Today",
  },

  {
    key: "weekly",
    label: "This week",
  },

  {
    key: "monthly",
    label: "This month",
  },

  {
    key: "yearly",
    label: "This year",
  },

  {
    key: "range",
    label: "Custom range",
  },

];


// =========================================================
// SALES TAB
// =========================================================

function SalesTab() {

  const [
    period,
    setPeriod,
  ] =
    useState(
      "daily"
    );


  const [
    start,
    setStart,
  ] =
    useState(
      ""
    );


  const [
    end,
    setEnd,
  ] =
    useState(
      ""
    );


  const [
    rangeRequested,
    setRangeRequested,
  ] =
    useState(
      false
    );


  const {
    data,
    loading,
    error,
  } =
    useFetch(

      () => {

        if (
          period ===
          "daily"
        ) {

          return reportsApi.daily();

        }


        if (
          period ===
          "weekly"
        ) {

          return reportsApi.weekly();

        }


        if (
          period ===
          "monthly"
        ) {

          return reportsApi.monthly();

        }


        if (
          period ===
          "yearly"
        ) {

          return reportsApi.yearly();

        }


        if (

          period === "range" &&

          rangeRequested &&

          start &&

          end

        ) {

          return reportsApi.range(
            start,
            end
          );

        }


        return Promise.resolve(
          null
        );

      },

      [

        period,

        rangeRequested,

        start,

        end,

      ]

    );


  const breakdown =
    data?.breakdown ||
    [];


  return (

    <div>


      {/* ================================================
          PERIOD BUTTONS
          ================================================ */}

      <div
        className="toolbar"
      >

        {PERIODS.map(
          (p) => (

            <button

              key={p.key}

              className="btn btn-sm"

              style={

                period === p.key

                  ? {

                      background:
                        "var(--blue-100)",

                      borderColor:
                        "var(--blue-700)",

                      color:
                        "var(--blue-700)",

                    }

                  : undefined

              }

              onClick={() => {

                setPeriod(
                  p.key
                );

                setRangeRequested(
                  false
                );

              }}

            >

              {p.label}

            </button>

          )
        )}

      </div>


      {/* ================================================
          CUSTOM RANGE
          ================================================ */}

      {period === "range" && (

        <div
          className="sales-report-range"
        >


          <div
            className="sales-report-date-field"
          >

            <label>

              Start date

            </label>


            <input

              className="input"

              type="date"

              value={start}

              onChange={(e) => {

                setStart(
                  e.target.value
                );

                setRangeRequested(
                  false
                );

              }}

            />

          </div>


          <div
            className="sales-report-date-field"
          >

            <label>

              End date

            </label>


            <input

              className="input"

              type="date"

              value={end}

              onChange={(e) => {

                setEnd(
                  e.target.value
                );

                setRangeRequested(
                  false
                );

              }}

            />

          </div>


          <button

            className="btn btn-primary sales-report-run"

            disabled={
              !start ||
              !end
            }

            onClick={() =>
              setRangeRequested(
                true
              )
            }

          >

            Run report

          </button>


        </div>

      )}


      {/* ================================================
          SALES CONTENT
          ================================================ */}

      {period === "range" &&
      !rangeRequested ? (

        <EmptyState
          label="Choose a start and end date, then run the report."
        />

      ) : loading ? (

        <LoadingState
          label="Loading…"
        />

      ) : error ? (

        <ErrorBanner
          error={error}
        />

      ) : !data ? null : (

        <>


          {/* ============================================
              FINANCIAL SUMMARY
              ============================================ */}

          <div
            className="stat-grid"
          >


            {/* TRANSACTIONS */}

            <div
              className="stat-card"
            >

              <div
                className="stat-label"
              >

                Transactions

              </div>


              <div
                className="stat-value"
              >

                {
                  data.transactions ??
                  0
                }

              </div>


            </div>


            {/* GROSS REVENUE */}

            <div
              className="stat-card"
            >

              <div
                className="stat-label"
              >

                Gross Revenue

              </div>


              <div
                className="stat-value"
              >

                {
                  formatMoney(
                    data.gross_revenue ??
                    0
                  )
                }

              </div>


            </div>


            {/* EXPENSES */}

            <div
              className="stat-card"
            >

              <div
                className="stat-label"
              >

                Expenses

              </div>


              <div
                className="stat-value"
              >

                {
                  formatMoney(
                    data.expenses ??
                    0
                  )
                }

              </div>


            </div>


            {/* NET REVENUE */}

            <div
              className="stat-card tone-success"
            >

              <div
                className="stat-label"
              >

                Net Revenue

              </div>


              <div
                className="stat-value"
              >

                {
                  formatMoney(
                    data.net_revenue ??
                    0
                  )
                }

              </div>


            </div>


          </div>


          {/* ============================================
              BREAKDOWN
              ============================================ */}

          <div
            className="card"
            style={{
              marginTop: 18,
            }}
          >


            <div
              style={{
                padding:
                  "18px 18px 0",
              }}
            >

              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                }}
              >

                {period === "daily"
                  ? "Today's breakdown"
                  : period === "weekly"
                  ? "Daily breakdown"
                  : period === "monthly"
                  ? "Daily breakdown"
                  : period === "yearly"
                  ? "Monthly breakdown"
                  : "Daily breakdown"
                }

              </h3>


              <p
                style={{
                  marginTop: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  color:
                    "var(--ink-dim)",
                }}
              >

                Sales, expenses, and net revenue.

              </p>


            </div>


            {breakdown.length === 0 ? (

              <div
                style={{
                  padding: 18,
                }}
              >

                <EmptyState
                  label="No data available for this period."
                />

              </div>

            ) : (

              <div
                className="table-wrap"
              >

                <table
                  className="table"
                >


                  <thead>

                    <tr>

                      <th>

                        {
                          period === "yearly"
                            ? "Month"
                            : "Day"
                        }

                      </th>


                      <th>
                        Transactions
                      </th>


                      <th>
                        Gross Revenue
                      </th>


                      <th>
                        Expenses
                      </th>


                      <th>
                        Net Revenue
                      </th>


                    </tr>

                  </thead>


                  <tbody>


                    {breakdown.map(
                      (
                        item,
                        index
                      ) => (

                        <tr

                          key={
                            item.date ??
                            item.month ??
                            index
                          }

                        >


                          {/* DAY / MONTH */}

                          <td>

                            <div
                              style={{
                                fontWeight:
                                  600,
                              }}
                            >

                              {
                                item.label
                              }

                            </div>


                            {/* Show actual date
                                for daily reports */}

                            {item.date && (

                              <div
                                style={{
                                  fontSize:
                                    12,

                                  color:
                                    "var(--ink-dim)",

                                  marginTop:
                                    3,

                                }}
                              >

                                {
                                  formatDate(
                                    item.date
                                  )
                                }

                              </div>

                            )}


                          </td>


                          {/* TRANSACTIONS */}

                          <td
                            className="mono"
                          >

                            {
                              item.transactions ??
                              0
                            }

                          </td>


                          {/* GROSS REVENUE */}

                          <td
                            className="mono"
                          >

                            {
                              formatMoney(
                                item.gross_revenue ??
                                0
                              )
                            }

                          </td>


                          {/* EXPENSES */}

                          <td
                            className="mono"
                          >

                            {
                              formatMoney(
                                item.expenses ??
                                0
                              )
                            }

                          </td>


                          {/* NET REVENUE */}

                          <td
                            className="mono"
                            style={{

                              fontWeight:
                                700,

                              color:

                                (
                                  item.net_revenue ??
                                  0
                                ) >= 0

                                  ? "var(--green-700)"

                                  : "var(--red-700)",

                            }}
                          >

                            {
                              formatMoney(
                                item.net_revenue ??
                                0
                              )
                            }

                          </td>


                        </tr>

                      )
                    )}


                  </tbody>


                </table>


              </div>

            )}


          </div>


        </>

      )}


    </div>

  );

}


// =========================================================
// PRODUCTS TAB
// =========================================================

function ProductsTab() {

  const best =
    useFetch(
      () =>
        reportsApi.bestSelling(),
      []
    );


  const lowest =
    useFetch(
      () =>
        reportsApi.lowestSelling(),
      []
    );


  return (

    <div

      style={{

        display:
          "grid",

        gridTemplateColumns:
          "1fr 1fr",

        gap:
          14,

      }}

    >


      {/* ================================================
          BEST SELLING
          ================================================ */}

      <ReportCard
        title="Best selling"
      >

        {best.loading ? (

          <LoadingState
            label="Loading…"
          />

        ) : best.error ? (

          <ErrorBanner
            error={best.error}
          />

        ) : (
          best.data?.medicines ||
          []
        ).length === 0 ? (

          <EmptyState
            label="No sales yet."
          />

        ) : (

          best.data.medicines.map(
            (m) => (

              <Row

                key={
                  m.generic_name
                }

                label={
                  m.generic_name
                }

                value={
                  `${m.quantity_sold} sold`
                }

              />

            )
          )

        )}

      </ReportCard>


      {/* ================================================
          LOWEST SELLING
          ================================================ */}

      <ReportCard
        title="Lowest selling"
      >

        {lowest.loading ? (

          <LoadingState
            label="Loading…"
          />

        ) : lowest.error ? (

          <ErrorBanner
            error={lowest.error}
          />

        ) : (
          lowest.data?.medicines ||
          []
        ).length === 0 ? (

          <EmptyState
            label="No sales yet."
          />

        ) : (

          lowest.data.medicines.map(
            (m) => (

              <Row

                key={
                  m.generic_name
                }

                label={
                  m.generic_name
                }

                value={
                  `${m.quantity_sold} sold`
                }

              />

            )
          )

        )}

      </ReportCard>


    </div>

  );

}


// =========================================================
// EXPIRED MEDICINES TAB
// =========================================================

function ExpiredTab() {

  const {
    data,
    loading,
    error,
  } =
    useFetch(
      () =>
        reportsApi.expiredMedicines(),
      []
    );


  const medicines =
    data?.medicines ||
    [];


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <LoadingState
        label="Loading…"
      />
    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (
      <ErrorBanner
        error={error}
      />
    );

  }


  // =====================================================
  // EMPTY
  // =====================================================

  if (
    medicines.length === 0
  ) {

    return (
      <EmptyState
        label="No expired medicines."
      />
    );

  }


  // =====================================================
  // TABLE
  // =====================================================

  return (

    <div
      className="card"
    >

      <div
        className="table-wrap"
      >

        <table
          className="table"
        >


          <thead>

            <tr>

              <th>
                Medicine
              </th>

              <th>
                Expiry date
              </th>

              <th>
                Quantity
              </th>

            </tr>

          </thead>


          <tbody>

            {medicines.map(
              (
                m,
                i
              ) => (

                <tr
                  key={
                    m.id ??
                    i
                  }
                >

                  <td>

                    {
                      m.generic_name
                    }

                  </td>


                  <td>

                    {
                      formatDate(
                        m.expiry_date
                      )
                    }

                  </td>


                  <td
                    className="mono"
                  >

                    {
                      m.quantity
                    }

                  </td>


                </tr>

              )
            )}

          </tbody>


        </table>


      </div>


    </div>

  );

}