import React, { useState, useMemo } from "react";
import { medicinesApi } from "../api/medicines";
import { salesApi } from "../api/sales";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, EmptyState, ErrorBanner } from "../components/StateViews";
import ReceiptView from "../components/ReceiptView";
import { formatMoney, formatDateTime } from "../utils/formatters";

export default function Sales() {
  const [tab, setTab] = useState("new"); // "new" | "history"

  return (
    <div>
      <div className="tabs">
        <div className={"tab" + (tab === "new" ? " active" : "")} onClick={() => setTab("new")}>
          New sale
        </div>
        <div className={"tab" + (tab === "history" ? " active" : "")} onClick={() => setTab("history")}>
          Receipt history
        </div>
      </div>
      {tab === "new" ? <NewSale onCompleted={() => setTab("history")} /> : <ReceiptHistory />}
    </div>
  );
}

function NewSale({ onCompleted }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]); // [{medicineId, qty, medicine}]
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);

  const { data: searchData } = useFetch(
    () => (query.trim() ? medicinesApi.list({ search: query.trim(), status: "Active" }) : Promise.resolve({ medicines: [] })),
    [query]
  );

  const today = new Date().toISOString().slice(0, 10);
  const results = useMemo(() => {
    return (searchData?.medicines || [])
      .filter((m) => m.quantity > 0 && m.expiry_date >= today)
      .slice(0, 6);
  }, [searchData, today]);

  function addToCart(medicine) {
    setCart((c) => {
      const existing = c.find((i) => i.medicineId === medicine.id);
      if (existing) {
        return c.map((i) =>
          i.medicineId === medicine.id ? { ...i, qty: Math.min(i.qty + 1, medicine.quantity) } : i
        );
      }
      return [...c, { medicineId: medicine.id, qty: 1, medicine }];
    });
    setQuery("");
  }

  function updateQty(medicineId, qty) {
    setCart((c) =>
      c.map((i) => {
        if (i.medicineId !== medicineId) return i;
        const capped = Math.max(1, Math.min(qty, i.medicine.quantity));
        return { ...i, qty: capped };
      })
    );
  }

  function removeItem(medicineId) {
    setCart((c) => c.filter((i) => i.medicineId !== medicineId));
  }

  const total = cart.reduce((sum, i) => sum + i.medicine.selling_price * i.qty, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const items = cart.map((i) => ({ medicine_id: i.medicineId, quantity: i.qty }));
      const result = await salesApi.checkout(items);
      setCompletedSale(result.sale);
      setCart([]);
    } catch (err) {
      setCheckoutError(err);
    } finally {
      setCheckingOut(false);
    }
  }

  if (completedSale) {
    return (
      <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ReceiptView sale={completedSale} />
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="btn btn-primary" onClick={() => setCompletedSale(null)}>
            Start new sale
          </button>
          <button className="btn" onClick={onCompleted}>
            View receipt history
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, alignItems: "start" }}>
      <div>
        <div className="search-box" style={{ marginBottom: 14 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="input"
            placeholder="Search medicine to add to this sale…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="card" style={{ position: "absolute", top: 42, left: 0, right: 0, zIndex: 10 }}>
              {results.map((m) => (
                <div
                  key={m.id}
                  onClick={() => addToCart(m)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.generic_name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>
                      {m.brand_name} · {m.quantity} in stock
                    </div>
                  </div>
                  <div className="mono">{formatMoney(m.selling_price)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {cart.length === 0 ? (
            <EmptyState label="Search above and select medicines to add them to this sale." />
          ) : (
            cart.map((item) => (
              <div
                key={item.medicineId}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--line)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.medicine.generic_name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>
                    {formatMoney(item.medicine.selling_price)} each · {item.medicine.quantity} available
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max={item.medicine.quantity}
                  value={item.qty}
                  onChange={(e) => updateQty(item.medicineId, Number(e.target.value))}
                  className="input mono"
                  style={{ width: 60, textAlign: "center" }}
                />
                <div className="mono" style={{ fontWeight: 600, width: 74, textAlign: "right" }}>
                  {formatMoney(item.medicine.selling_price * item.qty)}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => removeItem(item.medicineId)}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginBottom: 14 }}>Sale summary</h3>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 8 }}>
          <span style={{ color: "var(--ink-dim)" }}>Items</span>
          <span className="mono">{cart.reduce((s, i) => s + i.qty, 0)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            fontWeight: 700,
            padding: "14px 0",
            borderTop: "1px solid var(--line)",
            marginTop: 8,
          }}
        >
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
        {checkoutError && <ErrorBanner error={checkoutError} />}
        <button
          className="btn btn-primary btn-block"
          disabled={cart.length === 0 || checkingOut}
          onClick={handleCheckout}
        >
          {checkingOut ? "Completing sale…" : "Complete sale"}
        </button>
      </div>
    </div>
  );
}

function ReceiptHistory() {
  const [receiptSearch, setReceiptSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const { data, loading, error } = useFetch(
    () => salesApi.list({ receipt_number: receiptSearch || undefined }),
    [receiptSearch]
  );

  const sales = data?.sales || [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 18 }}>
      <div>
        <div className="search-box" style={{ marginBottom: 14, maxWidth: 320 }}>
          <input
            className="input"
            placeholder="Search by receipt number…"
            value={receiptSearch}
            onChange={(e) => setReceiptSearch(e.target.value)}
          />
        </div>
        <div className="card">
          {loading ? (
            <LoadingState label="Loading receipts…" />
          ) : error ? (
            <ErrorBanner error={error} />
          ) : sales.length === 0 ? (
            <EmptyState label="No sales found." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Cashier</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.receipt_number}</td>
                      <td>{s.sold_by_name}</td>
                      <td>{formatDateTime(s.sale_date)}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatMoney(s.total_amount)}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(s)}>
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
      {selected && (
        <div>
          <ReceiptView sale={selected} />
          <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
