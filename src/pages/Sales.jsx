import React, { useState, useMemo } from "react";
import { medicinesApi } from "../api/medicines";
import { salesApi } from "../api/sales";
import { useFetch } from "../hooks/useFetch";
import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "../components/StateViews";
import ReceiptView from "../components/ReceiptView";
import {
  formatMoney,
  formatDateTime,
} from "../utils/formatters";

export default function Sales() {
  const [tab, setTab] = useState("new");

  return (
    <div className="sales-page">

      {/* =====================================================
          TABS
          ===================================================== */}

      <div className="tabs">
        <div
          className={
            "tab" +
            (tab === "new" ? " active" : "")
          }
          onClick={() => setTab("new")}
        >
          New sale
        </div>

        <div
          className={
            "tab" +
            (tab === "history" ? " active" : "")
          }
          onClick={() => setTab("history")}
        >
          Receipt history
        </div>
      </div>

      {tab === "new" ? (
        <NewSale
          onCompleted={() => setTab("history")}
        />
      ) : (
        <ReceiptHistory />
      )}

    </div>
  );
}


/* =========================================================
   NEW SALE
   ========================================================= */

function NewSale({ onCompleted }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);

  const {
    data: searchData,
  } = useFetch(
    () =>
      query.trim()
        ? medicinesApi.list({
            search: query.trim(),
            status: "Active",
          })
        : Promise.resolve({
            medicines: [],
          }),
    [query]
  );

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const results = useMemo(() => {
    return (searchData?.medicines || [])
      .filter(
        (m) =>
          m.quantity > 0 &&
          m.expiry_date >= today
      )
      .slice(0, 6);
  }, [searchData, today]);

  function addToCart(medicine) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) =>
          item.medicineId === medicine.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.medicineId === medicine.id
            ? {
                ...item,
                qty: Math.min(
                  item.qty + 1,
                  medicine.quantity
                ),
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          medicineId: medicine.id,
          qty: 1,
          medicine,
        },
      ];
    });

    setQuery("");
  }

  function updateQty(medicineId, qty) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.medicineId !== medicineId) {
          return item;
        }

        const capped = Math.max(
          1,
          Math.min(
            qty,
            item.medicine.quantity
          )
        );

        return {
          ...item,
          qty: capped,
        };
      })
    );
  }

  function removeItem(medicineId) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.medicineId !== medicineId
      )
    );
  }

  const total = cart.reduce(
    (sum, item) =>
      sum +
      item.medicine.selling_price *
        item.qty,
    0
  );

  async function handleCheckout() {
    if (cart.length === 0) return;

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const items = cart.map((item) => ({
        medicine_id: item.medicineId,
        quantity: item.qty,
      }));

      const result =
        await salesApi.checkout(items);

      setCompletedSale(result.sale);
      setCart([]);
    } catch (err) {
      setCheckoutError(err);
    } finally {
      setCheckingOut(false);
    }
  }

  /* =======================================================
     COMPLETED SALE
     ======================================================= */

  if (completedSale) {
    return (
      <div className="sale-completed">

        <ReceiptView
          sale={completedSale}
        />

        <div className="sale-completed-actions">

          <button
            className="btn btn-primary"
            onClick={() =>
              setCompletedSale(null)
            }
          >
            Start new sale
          </button>

          <button
            className="btn"
            onClick={onCompleted}
          >
            View receipt history
          </button>

        </div>

      </div>
    );
  }

  /* =======================================================
     NEW SALE LAYOUT
     ======================================================= */

  return (
    <div className="new-sale-layout">

      {/* ===================================================
          MEDICINE SEARCH + CART
          =================================================== */}

      <div className="new-sale-products">

        <div
          className="search-box sale-search"
          style={{ marginBottom: 14 }}
        >

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />

            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
            />
          </svg>

          <input
            className="input"
            placeholder="Search medicine to add to this sale…"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
          />

          {results.length > 0 && (
            <div className="card sale-search-results">

              {results.map((m) => (
                <div
                  key={m.id}
                  onClick={() =>
                    addToCart(m)
                  }
                  className="sale-search-result"
                >

                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13.5,
                      }}
                    >
                      {m.generic_name}
                    </div>

                    <div
                      style={{
                        fontSize: 11.5,
                        color:
                          "var(--ink-dim)",
                      }}
                    >
                      {m.brand_name}
                      {" · "}
                      {m.quantity} in stock
                    </div>
                  </div>

                  <div className="mono">
                    {formatMoney(
                      m.selling_price
                    )}
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>


        {/* =================================================
            CART
            ================================================= */}

        <div className="card sale-cart">

          {cart.length === 0 ? (
            <EmptyState
              label="Search above and select medicines to add them to this sale."
            />
          ) : (
            cart.map((item) => (
              <div
                key={item.medicineId}
                className="sale-cart-item"
              >

                <div className="sale-cart-medicine">

                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13.5,
                    }}
                  >
                    {item.medicine.generic_name}
                  </div>

                  <div
                    style={{
                      fontSize: 11.5,
                      color:
                        "var(--ink-dim)",
                    }}
                  >
                    {formatMoney(
                      item.medicine
                        .selling_price
                    )}
                    {" each · "}
                    {item.medicine.quantity}
                    {" available"}
                  </div>

                </div>


                <input
                  type="number"
                  min="1"
                  max={
                    item.medicine.quantity
                  }
                  value={item.qty}
                  onChange={(e) =>
                    updateQty(
                      item.medicineId,
                      Number(e.target.value)
                    )
                  }
                  className="input mono sale-qty"
                />


                <div
                  className="mono sale-line-total"
                >
                  {formatMoney(
                    item.medicine
                      .selling_price *
                      item.qty
                  )}
                </div>


                <button
                  className="btn btn-ghost btn-sm sale-remove"
                  style={{
                    color:
                      "var(--danger)",
                  }}
                  onClick={() =>
                    removeItem(
                      item.medicineId
                    )
                  }
                >
                  ✕
                </button>

              </div>
            ))
          )}

        </div>

      </div>


      {/* ===================================================
          SALE SUMMARY
          =================================================== */}

      <div className="card card-pad sale-summary">

        <h3
          style={{
            marginBottom: 14,
          }}
        >
          Sale summary
        </h3>

        <div className="sale-summary-row">

          <span
            style={{
              color: "var(--ink-dim)",
            }}
          >
            Items
          </span>

          <span className="mono">
            {cart.reduce(
              (sum, item) =>
                sum + item.qty,
              0
            )}
          </span>

        </div>


        <div className="sale-total">

          <span>Total</span>

          <span>
            {formatMoney(total)}
          </span>

        </div>


        {checkoutError && (
          <ErrorBanner
            error={checkoutError}
          />
        )}


        <button
          className="btn btn-primary btn-block"
          disabled={
            cart.length === 0 ||
            checkingOut
          }
          onClick={handleCheckout}
        >
          {checkingOut
            ? "Completing sale…"
            : "Complete sale"}
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   RECEIPT HISTORY
   ========================================================= */

function ReceiptHistory() {
  const [
    receiptSearch,
    setReceiptSearch,
  ] = useState("");

  const [
    selected,
    setSelected,
  ] = useState(null);

  const {
    data,
    loading,
    error,
  } = useFetch(
    () =>
      salesApi.list({
        receipt_number:
          receiptSearch || undefined,
      }),
    [receiptSearch]
  );

  const sales = data?.sales || [];

  return (
    <div
      className={
        "receipt-history-layout" +
        (selected
          ? " has-receipt"
          : "")
      }
    >

      {/* ===================================================
          RECEIPTS TABLE
          =================================================== */}

      <div className="receipt-history-list">

        <div
          className="search-box receipt-search"
          style={{
            marginBottom: 14,
            maxWidth: 320,
          }}
        >
          <input
            className="input"
            placeholder="Search by receipt number…"
            value={receiptSearch}
            onChange={(e) =>
              setReceiptSearch(
                e.target.value
              )
            }
          />
        </div>


        <div className="card receipt-table-card">

          {loading ? (
            <LoadingState
              label="Loading receipts…"
            />
          ) : error ? (
            <ErrorBanner error={error} />
          ) : sales.length === 0 ? (
            <EmptyState
              label="No sales found."
            />
          ) : (
            <div className="table-wrap receipt-table-wrap">

              <table className="table receipt-table">

                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Cashier</th>
                    <th>Date</th>
                    <th
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      Total
                    </th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>

                  {sales.map((s) => (
                    <tr key={s.id}>

                      <td className="mono">
                        {s.receipt_number}
                      </td>

                      <td>
                        {s.sold_by_name}
                      </td>

                      <td>
                        {formatDateTime(
                          s.sale_date
                        )}
                      </td>

                      <td
                        className="mono"
                        style={{
                          textAlign:
                            "right",
                          fontWeight: 600,
                        }}
                      >
                        {formatMoney(
                          s.total_amount
                        )}
                      </td>

                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            setSelected(s)
                          }
                        >
                          View
                        </button>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>


      {/* ===================================================
          SELECTED RECEIPT
          =================================================== */}

      {selected && (
        <div className="selected-receipt">

          <ReceiptView
            sale={selected}
          />

          <button
            className="btn btn-block"
            style={{
              marginTop: 12,
            }}
            onClick={() =>
              setSelected(null)
            }
          >
            Close
          </button>

        </div>
      )}

    </div>
  );
}