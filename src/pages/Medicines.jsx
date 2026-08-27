import React, { useState, useMemo } from "react";
import { medicinesApi } from "../api/medicines";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { LoadingState, EmptyState, ErrorBanner } from "../components/StateViews";
import { MedicineStatusBadge, StockSeverityBadge } from "../components/StatusBadges";
import { ConfirmDialog } from "../components/Modal";
import MedicineFormModal from "../components/MedicineFormModal";
import PricingModal from "../components/PricingModal";
import StockAdjustModal from "../components/StockAdjustModal";
import { formatMoney, formatDate } from "../utils/formatters";
import { ApiError } from "../api/client";

export default function Medicines() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, loading, error, reload } = useFetch(
    () => medicinesApi.list({ search: search || undefined, status: statusFilter || undefined }),
    [search, statusFilter]
  );

  const [formModal, setFormModal] = useState(null); // { mode, initial } | null
  const [pricingModal, setPricingModal] = useState(null); // medicine | null
  const [stockModal, setStockModal] = useState(null); // medicine | null
  const [statusConfirm, setStatusConfirm] = useState(null); // { medicine, nextStatus } | null

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const medicines = useMemo(() => data?.medicines || [], [data]);

  async function handleSaveMedicine(payload) {
    setBusy(true);
    setActionError(null);
    try {
      if (formModal.mode === "create") {
        await medicinesApi.create(payload);
      } else {
        await medicinesApi.update(formModal.initial.id, payload);
      }
      setFormModal(null);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSavePricing(payload) {
    setBusy(true);
    setActionError(null);
    try {
      await medicinesApi.updatePricing(pricingModal.id, payload);
      setPricingModal(null);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveStock(payload) {
    setBusy(true);
    setActionError(null);
    try {
      await medicinesApi.addStockMovement(stockModal.id, payload);
      setStockModal(null);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmStatus() {
    setBusy(true);
    setActionError(null);
    try {
      const { medicine, nextStatus } = statusConfirm;
      if (nextStatus === "Discontinued") {
        await medicinesApi.deactivate(medicine.id);
      } else {
        await medicinesApi.reactivate(medicine.id);
      }
      setStatusConfirm(null);
      reload();
    } catch (err) {
      setActionError(err);
      setStatusConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {actionError && <ErrorBanner error={actionError} />}

      <div className="toolbar">
        <div className="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="input"
            placeholder="Search by generic name, brand, class, or supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Discontinued">Discontinued</option>
        </select>
        <button className="btn btn-primary" onClick={() => setFormModal({ mode: "create", initial: null })}>
          + Add medicine
        </button>
      </div>

      <div className="card">
        {loading ? (
          <LoadingState label="Loading medicines…" />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : medicines.length === 0 ? (
          <EmptyState label={search || statusFilter ? "No medicines match your filters." : "No medicines yet. Add your first one."} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Generic name</th>
                  <th>Brand</th>
                  <th>Dosage</th>
                  <th>Supplier</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.generic_name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{m.medicine_class}</div>
                    </td>
                    <td>{m.brand_name}</td>
                    <td className="mono">{m.dosage}</td>
                    <td>{m.supplier || "-"}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{m.quantity}</td>
                    <td className="mono">{formatMoney(m.selling_price)}</td>
                    <td>{formatDate(m.expiry_date)}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <MedicineStatusBadge status={m.status} />
                        <StockSeverityBadge medicine={m} />
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setFormModal({ mode: "edit", initial: m })}>
                          Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setStockModal(m)}>
                          Stock
                        </button>
                        {isAdmin && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setPricingModal(m)}>
                            Pricing
                          </button>
                        )}
                        {isAdmin && m.status === "Active" && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--danger)" }}
                            onClick={() => setStatusConfirm({ medicine: m, nextStatus: "Discontinued" })}
                          >
                            Deactivate
                          </button>
                        )}
                        {isAdmin && m.status === "Discontinued" && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--green-700)" }}
                            onClick={() => setStatusConfirm({ medicine: m, nextStatus: "Active" })}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formModal && (
        <MedicineFormModal
          mode={formModal.mode}
          initial={formModal.initial}
          onClose={() => { setFormModal(null); setActionError(null); }}
          onSave={handleSaveMedicine}
          busy={busy}
          error={actionError instanceof ApiError ? actionError : null}
        />
      )}

      {pricingModal && (
        <PricingModal
          medicine={pricingModal}
          onClose={() => { setPricingModal(null); setActionError(null); }}
          onSave={handleSavePricing}
          busy={busy}
          error={actionError instanceof ApiError ? actionError : null}
        />
      )}

      {stockModal && (
        <StockAdjustModal
          medicine={stockModal}
          onClose={() => { setStockModal(null); setActionError(null); }}
          onSave={handleSaveStock}
          busy={busy}
          error={actionError instanceof ApiError ? actionError : null}
        />
      )}

      {statusConfirm && (
        <ConfirmDialog
          title={statusConfirm.nextStatus === "Discontinued" ? "Deactivate medicine" : "Reactivate medicine"}
          message={
            statusConfirm.nextStatus === "Discontinued"
              ? `Deactivate ${statusConfirm.medicine.generic_name}? It will remain in the database and sales history, but can no longer be sold until reactivated.`
              : `Reactivate ${statusConfirm.medicine.generic_name}? It will become available for sale again.`
          }
          confirmLabel={statusConfirm.nextStatus === "Discontinued" ? "Deactivate" : "Reactivate"}
          danger={statusConfirm.nextStatus === "Discontinued"}
          busy={busy}
          onCancel={() => setStatusConfirm(null)}
          onConfirm={handleConfirmStatus}
        />
      )}
    </div>
  );
}
