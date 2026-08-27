import React, { useState } from "react";
import { Modal } from "./Modal";

const emptyForm = {
  generic_name: "",
  brand_name: "",
  medicine_class: "",
  dosage: "",
  expiry_date: "",
  batch_number: "",
  supplier: "",
  date_received: "",
  notes: "",
  purchase_price: "",
  selling_price: "",
  initial_quantity: "",
  minimum_stock: "10",
  critical_stock: "3",
};

/**
 * mode="create": all fields shown, including pricing/initial stock — the
 *   backend's POST /medicines is @login_required (not admin-gated), so
 *   both roles can set initial pricing when adding a brand-new medicine.
 *   This is different from *changing* an existing medicine's price later,
 *   which is Admin-only (see PricingModal).
 * mode="edit": only the non-price fields the backend's general PATCH
 *   accepts — price/status/quantity are never sent from here, matching
 *   the backend's BLOCKED_ON_GENERIC_PATCH rejection.
 */
export default function MedicineFormModal({ mode, initial, onClose, onSave, busy, error }) {
  const [form, setForm] = useState(() => {
    if (mode === "edit" && initial) {
      return {
        generic_name: initial.generic_name || "",
        brand_name: initial.brand_name || "",
        medicine_class: initial.medicine_class || "",
        dosage: initial.dosage || "",
        expiry_date: initial.expiry_date || "",
        batch_number: initial.batch_number || "",
        supplier: initial.supplier || "",
        date_received: initial.date_received || "",
        notes: initial.notes || "",
      };
    }
    return emptyForm;
  });
  const [localError, setLocalError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    if (!form.generic_name.trim() || !form.brand_name.trim()) {
      setLocalError("Generic name and brand name are required.");
      return;
    }
    if (!form.expiry_date) {
      setLocalError("Expiry date is required.");
      return;
    }

    if (mode === "create") {
      if (form.purchase_price === "" || form.selling_price === "") {
        setLocalError("Purchase price and selling price are required.");
        return;
      }
      onSave({
        generic_name: form.generic_name.trim(),
        brand_name: form.brand_name.trim(),
        medicine_class: form.medicine_class.trim() || null,
        dosage: form.dosage.trim() || null,
        expiry_date: form.expiry_date,
        batch_number: form.batch_number.trim() || null,
        supplier: form.supplier.trim() || null,
        date_received: form.date_received || null,
        notes: form.notes.trim() || null,
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        initial_quantity: form.initial_quantity === "" ? 0 : Number(form.initial_quantity),
        minimum_stock: form.minimum_stock === "" ? 10 : Number(form.minimum_stock),
        critical_stock: form.critical_stock === "" ? 3 : Number(form.critical_stock),
      });
    } else {
      onSave({
        generic_name: form.generic_name.trim(),
        brand_name: form.brand_name.trim(),
        medicine_class: form.medicine_class.trim() || null,
        dosage: form.dosage.trim() || null,
        expiry_date: form.expiry_date,
        batch_number: form.batch_number.trim() || null,
        supplier: form.supplier.trim() || null,
        date_received: form.date_received || null,
        notes: form.notes.trim() || null,
      });
    }
  }

  const shownError = localError || (error && error.message);

  return (
    <Modal title={mode === "create" ? "Add medicine" : "Edit medicine"} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field span-2">
            <label>Generic name</label>
            <input className="input" value={form.generic_name} onChange={set("generic_name")} />
          </div>
          <div className="field">
            <label>Brand name</label>
            <input className="input" value={form.brand_name} onChange={set("brand_name")} />
          </div>
          <div className="field">
            <label>Medicine class</label>
            <input className="input" value={form.medicine_class} onChange={set("medicine_class")} />
          </div>
          <div className="field">
            <label>Dosage</label>
            <input className="input" placeholder="e.g. 500mg" value={form.dosage} onChange={set("dosage")} />
          </div>
          <div className="field">
            <label>Expiry date</label>
            <input className="input" type="date" value={form.expiry_date} onChange={set("expiry_date")} />
          </div>
          <div className="field">
            <label>Batch number</label>
            <input className="input" value={form.batch_number} onChange={set("batch_number")} />
          </div>
          <div className="field">
            <label>Supplier</label>
            <input className="input" value={form.supplier} onChange={set("supplier")} />
          </div>
          <div className="field">
            <label>Date received</label>
            <input className="input" type="date" value={form.date_received} onChange={set("date_received")} />
          </div>
          <div className="field span-2">
            <label>Notes</label>
            <textarea className="input" value={form.notes} onChange={set("notes")} />
          </div>

          {mode === "create" && (
            <>
              <div className="field">
                <label>Purchase price (RWF)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.purchase_price} onChange={set("purchase_price")} />
              </div>
              <div className="field">
                <label>Selling price (RWF)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.selling_price} onChange={set("selling_price")} />
              </div>
              <div className="field">
                <label>Initial quantity</label>
                <input className="input" type="number" min="0" value={form.initial_quantity} onChange={set("initial_quantity")} />
                <div className="field-hint">Recorded as a "received" stock movement automatically.</div>
              </div>
              <div className="field">
                <label>Minimum stock</label>
                <input className="input" type="number" min="0" value={form.minimum_stock} onChange={set("minimum_stock")} />
              </div>
              <div className="field">
                <label>Critical stock</label>
                <input className="input" type="number" min="0" value={form.critical_stock} onChange={set("critical_stock")} />
              </div>
            </>
          )}
        </div>

        {shownError && <div className="field-error">{shownError}</div>}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Add medicine" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
