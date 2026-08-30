import React, { useState, useMemo } from "react";
import { medicinesApi } from "../api/medicines";
import { usersApi } from "../api/users";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "../components/StateViews";
import { MedicineStatusBadge } from "../components/StatusBadges";
import StockAdjustModal from "../components/StockAdjustModal";
import { formatDateTime } from "../utils/formatters";

const REASON_LABELS = {
  received: "Received",
  adjustment: "Adjustment",
  damaged: "Damaged",
  expired: "Expired",
  correction: "Correction",
  other: "Other",
  sale: "Sale",
};

export default function Stock() {
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  /* ---------------------------------------------------------
     Medicines
     --------------------------------------------------------- */

  const {
    data: listData,
    loading: listLoading,
    error: listError,
  } = useFetch(
    () =>
      medicinesApi.list({
        search: search || undefined,
      }),
    [search]
  );

  const medicines = listData?.medicines || [];

  /* ---------------------------------------------------------
     Selected medicine
     --------------------------------------------------------- */

  const {
    data: selected,
    loading: selectedLoading,
    reload: reloadSelected,
  } = useFetch(
    () =>
      selectedId
        ? medicinesApi.get(selectedId)
        : Promise.resolve(null),
    [selectedId]
  );

  /* ---------------------------------------------------------
     Stock movements
     --------------------------------------------------------- */

  const {
    data: movementsData,
    loading: movementsLoading,
    error: movementsError,
    reload: reloadMovements,
  } = useFetch(
    () =>
      selectedId
        ? medicinesApi.listStockMovements(selectedId)
        : Promise.resolve(null),
    [selectedId]
  );

  /* ---------------------------------------------------------
     Users
     --------------------------------------------------------- */

  const { data: usersData } = useFetch(
    () =>
      isAdmin
        ? usersApi.list()
        : Promise.resolve(null),
    [isAdmin]
  );

  const userNameById = useMemo(() => {
    const map = {};

    (usersData?.users || []).forEach((u) => {
      map[u.id] = u.fullname;
    });

    return map;
  }, [usersData]);

  /* ---------------------------------------------------------
     Stock adjustment
     --------------------------------------------------------- */

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function handleSaveStock(payload) {
    setBusy(true);
    setActionError(null);

    try {
      await medicinesApi.addStockMovement(
        selectedId,
        payload
      );

      setAdjustOpen(false);

      reloadSelected();
      reloadMovements();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */

  return (
    <div className="stock-page">

      {/* =====================================================
          MEDICINE LIST
          ===================================================== */}

      <div className="card stock-medicine-list">

        <div
          className="stock-search"
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <input
            className="input"
            placeholder="Search medicines…"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {listLoading ? (
          <LoadingState label="Loading…" />
        ) : listError ? (
          <ErrorBanner error={listError} />
        ) : medicines.length === 0 ? (
          <EmptyState label="No medicines found." />
        ) : (
          <div className="stock-medicine-scroll">
            {medicines.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedId(m.id);
                  setActionError(null);
                }}
                className={
                  "stock-medicine-item" +
                  (selectedId === m.id
                    ? " selected"
                    : "")
                }
              >
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
                    color: "var(--ink-dim)",
                  }}
                >
                  {m.brand_name} · Qty {m.quantity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          RIGHT / SELECTED MEDICINE AREA
          ===================================================== */}

      <div className="stock-details">

        {!selectedId ? (
          <div className="card">
            <EmptyState
              label="Select a medicine on the left to view or adjust its stock."
            />
          </div>
        ) : selectedLoading || !selected ? (
          <div className="card">
            <LoadingState label="Loading medicine…" />
          </div>
        ) : (
          <>
            {/* =================================================
                SELECTED MEDICINE
                ================================================= */}

            <div
              className="card card-pad stock-selected-card"
              style={{ marginBottom: 16 }}
            >
              <div className="stock-selected-header">

                <div className="stock-selected-title">

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <h3>
                      {selected.medicine.generic_name}
                    </h3>

                    <MedicineStatusBadge
                      status={selected.medicine.status}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink-dim)",
                      marginTop: 3,
                    }}
                  >
                    {selected.medicine.brand_name}
                    {" · "}
                    {selected.medicine.dosage}
                  </div>

                </div>

                <button
                  className="btn btn-primary stock-adjust-btn"
                  onClick={() =>
                    setAdjustOpen(true)
                  }
                >
                  Adjust stock
                </button>

              </div>

              {/* =================================================
                  STOCK STATS
                  ================================================= */}

              <div className="stock-stats">

                <Stat
                  label="Current quantity"
                  value={selected.medicine.quantity}
                />

                <Stat
                  label="Minimum stock"
                  value={selected.medicine.minimum_stock}
                />

                <Stat
                  label="Critical stock"
                  value={selected.medicine.critical_stock}
                />

              </div>

              {actionError && (
                <ErrorBanner error={actionError} />
              )}
            </div>

            {/* =================================================
                MOVEMENT HISTORY
                ================================================= */}

            <div className="card stock-history-card">

              <div
                style={{
                  padding: "14px 18px",
                  borderBottom:
                    "1px solid var(--line)",
                  fontWeight: 600,
                }}
              >
                Movement history
              </div>

              {movementsLoading ? (
                <LoadingState
                  label="Loading history…"
                />
              ) : movementsError ? (
                <ErrorBanner
                  error={movementsError}
                />
              ) : (
                (movementsData?.movements || [])
                  .length === 0
              ) ? (
                <EmptyState
                  label="No stock movements recorded yet."
                />
              ) : (
                <div className="table-wrap stock-table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date/time</th>
                        <th>Change</th>
                        <th>Reason</th>
                        <th>Note</th>
                        <th>Performed by</th>
                      </tr>
                    </thead>

                    <tbody>
                      {movementsData.movements.map(
                        (mv) => (
                          <tr key={mv.id}>

                            <td>
                              {formatDateTime(
                                mv.occurred_at
                              )}
                            </td>

                            <td
                              className="mono"
                              style={{
                                fontWeight: 600,
                                color:
                                  mv.change_qty > 0
                                    ? "var(--green-700)"
                                    : "var(--danger)",
                              }}
                            >
                              {mv.change_qty > 0
                                ? "+"
                                : ""}
                              {mv.change_qty}
                            </td>

                            <td>
                              {REASON_LABELS[
                                mv.reason
                              ] || mv.reason}
                            </td>

                            <td
                              style={{
                                color:
                                  "var(--ink-dim)",
                              }}
                            >
                              {mv.note || "-"}
                            </td>

                            <td>
                              {userNameById[
                                mv.performed_by
                              ] ||
                                `User #${mv.performed_by}`}
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

      {/* =====================================================
          ADJUST STOCK MODAL
          ===================================================== */}

      {adjustOpen && selected && (
        <StockAdjustModal
          medicine={selected.medicine}
          onClose={() => {
            setAdjustOpen(false);
            setActionError(null);
          }}
          onSave={handleSaveStock}
          busy={busy}
          error={actionError}
        />
      )}

    </div>
  );
}


/* =========================================================
   STAT COMPONENT
   ========================================================= */

function Stat({ label, value }) {
  return (
    <div className="stock-stat">

      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink-dim)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {value}
      </div>

    </div>
  );
}