import React, { useState } from "react";
import { Modal } from "./Modal";

export default function PricingModal({ medicine, onClose, onSave, busy, error }) {
  const [purchasePrice, setPurchasePrice] = useState(String(medicine.purchase_price));
  const [sellingPrice, setSellingPrice] = useState(String(medicine.selling_price));
  const [localError, setLocalError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    const pp = Number(purchasePrice);
    const sp = Number(sellingPrice);
    if (purchasePrice === "" || Number.isNaN(pp) || pp < 0) {
      setLocalError("Enter a valid purchase price.");
      return;
    }
    if (sellingPrice === "" || Number.isNaN(sp) || sp < 0) {
      setLocalError("Enter a valid selling price.");
      return;
    }
    onSave({ purchase_price: pp, selling_price: sp });
  }

  const shownError = localError || (error && error.message);

  return (
    <Modal title={`Edit pricing — ${medicine.generic_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Purchase price ($)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Selling price ($)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
          />
        </div>
        {shownError && <div className="field-error">{shownError}</div>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save pricing"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
