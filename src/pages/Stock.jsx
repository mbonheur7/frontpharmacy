import React, {
  useState,
  useMemo,
} from "react";

import { medicinesApi } from "../api/medicines";
import { usersApi } from "../api/users";

import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";

import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "../components/StateViews";

import {
  MedicineStatusBadge,
} from "../components/StatusBadges";

import StockAdjustModal from
  "../components/StockAdjustModal";

import {
  formatDateTime,
} from "../utils/formatters";


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


  // =========================================================
  // AUTHORIZATION
  // =========================================================

  const {
    isSuperAdmin,
    isAdminViewer,
  } = useAuth();


  /*
    Admin Viewer is read-only.

    Everyone else allowed into the normal application,
    including pharmacists and Super Admin,
    can adjust stock.
  */

  const canAdjustStock =
    !isAdminViewer;


  /*
    Only Super Admin needs access to the
    users endpoint for administrative user lookup.

    Other users can still see movement history,
    but if the backend does not provide a name,
    they will see User #ID.
  */

  const canLoadUsers =
    isSuperAdmin;


  // =========================================================
  // LOCAL STATE
  // =========================================================

  const [search, setSearch] =
    useState("");


  const [selectedId, setSelectedId] =
    useState(null);


  const [adjustOpen, setAdjustOpen] =
    useState(false);


  const [busy, setBusy] =
    useState(false);


  const [actionError, setActionError] =
    useState(null);


  // =========================================================
  // MEDICINES
  // =========================================================

  const {
    data: listData,
    loading: listLoading,
    error: listError,
  } = useFetch(

    () =>
      medicinesApi.list({
        search:
          search || undefined,
      }),

    [search]

  );


  const medicines =
    listData?.medicines || [];


  // =========================================================
  // SELECTED MEDICINE
  // =========================================================

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


  // =========================================================
  // STOCK MOVEMENTS
  // =========================================================

  const {
    data: movementsData,
    loading: movementsLoading,
    error: movementsError,
    reload: reloadMovements,
  } = useFetch(

    () =>
      selectedId
        ? medicinesApi.listStockMovements(
            selectedId
          )
        : Promise.resolve(null),

    [selectedId]

  );


  // =========================================================
  // USERS
  // =========================================================

  const {
    data: usersData,
  } = useFetch(

    () =>
      canLoadUsers
        ? usersApi.list()
        : Promise.resolve(null),

    [canLoadUsers]

  );


  // =========================================================
  // USER NAME MAP
  // =========================================================

  const userNameById =
    useMemo(() => {

      const map = {};

      (
        usersData?.users || []
      ).forEach(
        (user) => {

          map[user.id] =
            user.fullname;

        }
      );

      return map;

    }, [usersData]);


  // =========================================================
  // SAVE STOCK ADJUSTMENT
  // =========================================================

  async function handleSaveStock(
    payload
  ) {


    /*
      Frontend permission protection.

      The backend must also enforce this.
      Frontend checks alone are never security.
    */

    if (!canAdjustStock) {

      setActionError(
        new Error(
          "You do not have permission to adjust stock."
        )
      );

      return;

    }


    if (!selectedId) {
      return;
    }


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


    } catch (error) {


      setActionError(error);


    } finally {


      setBusy(false);


    }

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="stock-page">


      {/* =====================================================
          MEDICINE LIST
          ===================================================== */}

      <div className="card stock-medicine-list">


        {/* ================= SEARCH ================= */}

        <div
          className="stock-search"
          style={{
            padding:
              "12px 14px",

            borderBottom:
              "1px solid var(--line)",
          }}
        >


          <input
            className="input"
            placeholder="Search medicines…"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />


        </div>


        {/* ================= LIST ================= */}

        {listLoading ? (

          <LoadingState
            label="Loading…"
          />

        ) : listError ? (

          <ErrorBanner
            error={listError}
          />

        ) : medicines.length === 0 ? (

          <EmptyState
            label="No medicines found."
          />

        ) : (

          <div className="stock-medicine-scroll">


            {medicines.map(
              (medicine) => (

                <div
                  key={medicine.id}

                  onClick={() => {

                    setSelectedId(
                      medicine.id
                    );

                    setActionError(
                      null
                    );

                  }}

                  className={
                    "stock-medicine-item" +

                    (
                      selectedId ===
                      medicine.id

                        ? " selected"

                        : ""
                    )
                  }
                >


                  <div
                    style={{
                      fontWeight:
                        600,

                      fontSize:
                        13.5,
                    }}
                  >

                    {
                      medicine.generic_name
                    }

                  </div>


                  <div
                    style={{
                      fontSize:
                        11.5,

                      color:
                        "var(--ink-dim)",
                    }}
                  >

                    {
                      medicine.brand_name
                    }

                    {" · Qty "}

                    {
                      medicine.quantity
                    }

                  </div>


                </div>

              )
            )}


          </div>

        )}


      </div>


      {/* =====================================================
          SELECTED MEDICINE AREA
          ===================================================== */}

      <div className="stock-details">


        {/* ================= NO MEDICINE ================= */}

        {!selectedId ? (

          <div className="card">

            <EmptyState
              label={
                "Select a medicine on the left to view or adjust its stock."
              }
            />

          </div>

        ) : selectedLoading ||
          !selected ? (

          <div className="card">

            <LoadingState
              label="Loading medicine…"
            />

          </div>

        ) : (

          <>


            {/* =================================================
                SELECTED MEDICINE
                ================================================= */}

            <div
              className={
                "card card-pad stock-selected-card"
              }

              style={{
                marginBottom:
                  16,
              }}
            >


              {/* ================= HEADER ================= */}

              <div
                className="stock-selected-header"
              >


                <div
                  className="stock-selected-title"
                >


                  <div
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap:
                        8,

                      flexWrap:
                        "wrap",
                    }}
                  >


                    <h3>

                      {
                        selected.medicine
                          .generic_name
                      }

                    </h3>


                    <MedicineStatusBadge
                      status={
                        selected.medicine
                          .status
                      }
                    />


                  </div>


                  <div
                    style={{
                      fontSize:
                        12.5,

                      color:
                        "var(--ink-dim)",

                      marginTop:
                        3,
                    }}
                  >

                    {
                      selected.medicine
                        .brand_name
                    }

                    {" · "}

                    {
                      selected.medicine
                        .dosage
                    }

                  </div>


                </div>


                {/* ================= ADJUST BUTTON ================= */}

                {canAdjustStock ? (

                  <button
                    className={
                      "btn btn-primary stock-adjust-btn"
                    }

                    onClick={() =>
                      setAdjustOpen(
                        true
                      )
                    }

                    type="button"
                  >

                    Adjust stock

                  </button>

                ) : (

                  <div
                    style={{
                      fontSize:
                        12,

                      color:
                        "var(--ink-dim)",

                      fontStyle:
                        "italic",
                    }}
                  >

                    Read-only access

                  </div>

                )}


              </div>


              {/* =================================================
                  STOCK STATS
                  ================================================= */}

              <div
                className="stock-stats"
              >


                <Stat
                  label="Current quantity"

                  value={
                    selected.medicine
                      .quantity
                  }
                />


                <Stat
                  label="Minimum stock"

                  value={
                    selected.medicine
                      .minimum_stock
                  }
                />


                <Stat
                  label="Critical stock"

                  value={
                    selected.medicine
                      .critical_stock
                  }
                />


              </div>


              {/* ================= ERROR ================= */}

              {actionError && (

                <ErrorBanner
                  error={actionError}
                />

              )}


            </div>


            {/* =================================================
                MOVEMENT HISTORY
                ================================================= */}

            <div
              className="card stock-history-card"
            >


              <div
                style={{
                  padding:
                    "14px 18px",

                  borderBottom:
                    "1px solid var(--line)",

                  fontWeight:
                    600,
                }}
              >

                Movement history

              </div>


              {/* ================= LOADING ================= */}

              {movementsLoading ? (

                <LoadingState
                  label="Loading history…"
                />

              ) : movementsError ? (

                <ErrorBanner
                  error={movementsError}
                />

              ) : (

                (
                  movementsData
                    ?.movements || []
                ).length === 0

              ) ? (

                <EmptyState
                  label={
                    "No stock movements recorded yet."
                  }
                />

              ) : (

                <div
                  className={
                    "table-wrap stock-table-wrap"
                  }
                >


                  <table
                    className="table"
                  >


                    <thead>

                      <tr>

                        <th>
                          Date/time
                        </th>

                        <th>
                          Change
                        </th>

                        <th>
                          Reason
                        </th>

                        <th>
                          Note
                        </th>

                        <th>
                          Performed by
                        </th>

                      </tr>

                    </thead>


                    <tbody>


                      {
                        movementsData
                          .movements
                          .map(
                            (movement) => (

                              <tr
                                key={
                                  movement.id
                                }
                              >


                                {/* DATE */}

                                <td>

                                  {
                                    formatDateTime(
                                      movement
                                        .occurred_at
                                    )
                                  }

                                </td>


                                {/* CHANGE */}

                                <td
                                  className="mono"

                                  style={{
                                    fontWeight:
                                      600,

                                    color:
                                      movement.change_qty >
                                      0

                                        ? "var(--green-700)"

                                        : "var(--danger)",
                                  }}
                                >

                                  {
                                    movement.change_qty >
                                    0

                                      ? "+"

                                      : ""
                                  }

                                  {
                                    movement.change_qty
                                  }

                                </td>


                                {/* REASON */}

                                <td>

                                  {
                                    REASON_LABELS[
                                      movement
                                        .reason
                                    ] ||
                                    movement.reason
                                  }

                                </td>


                                {/* NOTE */}

                                <td
                                  style={{
                                    color:
                                      "var(--ink-dim)",
                                  }}
                                >

                                  {
                                    movement.note ||
                                    "-"
                                  }

                                </td>


                                {/* USER */}

                                <td>

                                  {
                                    /*
                                      First use the
                                      administrative users map.

                                      If the backend already
                                      provides a performer
                                      name, use that.

                                      Otherwise fall back
                                      to User #ID.
                                    */
                                  }

                                  {
                                    userNameById[
                                      movement
                                        .performed_by
                                    ] ||

                                    movement
                                      .performed_by_fullname ||

                                    movement
                                      .performed_by_username ||

                                    (
                                      movement
                                        .performed_by

                                        ? `User #${movement.performed_by}`

                                        : "-"
                                    )
                                  }

                                </td>


                              </tr>

                            )
                          )
                      }


                    </tbody>


                  </table>


                </div>

              )}


            </div>


          </>

        )}


      </div>


      {/* =====================================================
          STOCK ADJUSTMENT MODAL
          ===================================================== */}

      {
        adjustOpen &&
        selected &&
        canAdjustStock && (

          <StockAdjustModal

            medicine={
              selected.medicine
            }

            onClose={() => {

              setAdjustOpen(
                false
              );

              setActionError(
                null
              );

            }}

            onSave={
              handleSaveStock
            }

            busy={
              busy
            }

            error={
              actionError
            }

          />

        )
      }


    </div>

  );

}


/* =========================================================
   STAT COMPONENT
   ========================================================= */

function Stat({
  label,
  value,
}) {

  return (

    <div
      className="stock-stat"
    >


      <div
        style={{
          fontSize:
            11,

          fontWeight:
            600,

          color:
            "var(--ink-dim)",

          textTransform:
            "uppercase",
        }}
      >

        {label}

      </div>


      <div
        style={{
          fontSize:
            20,

          fontWeight:
            700,

          marginTop:
            2,
        }}
      >

        {value}

      </div>


    </div>

  );

}