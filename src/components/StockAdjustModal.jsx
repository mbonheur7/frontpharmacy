import React, { useState } from "react";
import { Modal } from "./Modal";
import { STOCK_MOVEMENT_REASONS } from "../api/medicines";

export default function StockAdjustModal({ medicine, onClose, onSave, busy, error }) {
  const [direction, setDirection] = useState("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("received");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    const n = Number(amount);
    if (!amount || Number.isNaN(n) || n <= 0) {
      setLocalError("Enter an amount greater than zero.");
      return;
    }
    const changeQty = direction === "remove" ? -n : n;
    onSave({ change_qty: changeQty, reason, note: note.trim() || undefined });
  }

  const shownError = localError || (error && error.message);

  return (
    <Modal title={`Adjust stock — ${medicine.generic_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 14 }}>
          Current quantity: <strong style={{ color: "var(--ink)" }}>{medicine.quantity}</strong>
          {medicine.status === "Discontinued" && (
            <span className="badge badge-neutral" style={{ marginLeft: 8 }}>
              Discontinued
            </span>
          )}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            className="btn"
            style={
              direction === "add"
                ? { background: "var(--green-100)", borderColor: "var(--green-700)", color: "var(--green-700)", flex: 1 }
                : { flex: 1 }
            }
            onClick={() => setDirection("add")}
          >
            + Add stock
          </button>
          <button
            type="button"
            className="btn"
            style={
              direction === "remove"
                ? { background: "var(--danger-bg)", borderColor: "var(--danger)", color: "var(--danger)", flex: 1 }
                : { flex: 1 }
            }
            onClick={() => setDirection("remove")}
          >
            − Remove stock
          </button>
        </div>

        <div className="field">
          <label>Amount</label>
          <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>

        <div className="field">
          <label>Reason</label>
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {STOCK_MOVEMENT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {medicine.status === "Discontinued" && reason === "received" && (
            <div className="field-hint">
              The backend will reject "received" for a discontinued medicine — reactivate it first if you
              genuinely intend to restock it.
            </div>
          )}
        </div>

        <div className="field">
          <label>Note (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Recount after stocktake" />
        </div>

        {shownError && <div className="field-error">{shownError}</div>}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Applying…" : "Apply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
