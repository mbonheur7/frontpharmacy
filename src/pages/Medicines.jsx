import React, {
  useState,
  useMemo,
} from "react";

import {
  medicinesApi,
} from "../api/medicines";

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
  MedicineStatusBadge,
  StockSeverityBadge,
} from "../components/StatusBadges";


import {
  ConfirmDialog,
} from "../components/Modal";


import MedicineFormModal
  from "../components/MedicineFormModal";


import PricingModal
  from "../components/PricingModal";


import StockAdjustModal
  from "../components/StockAdjustModal";


import MedicineComments
  from "../components/MedicineComments";


import {
  formatMoney,
  formatDate,
} from "../utils/formatters";


import {
  ApiError,
} from "../api/client";



export default function Medicines() {


  // =====================================================
  // AUTH / ROLE PERMISSIONS
  // =====================================================

  const {
    canViewAdminControls,
    isAdminViewer,
  } = useAuth();


  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");


  // =====================================================
  // FETCH MEDICINES
  // =====================================================

  const {
    data,
    loading,
    error,
    reload,
  } = useFetch(

    () =>
      medicinesApi.list({

        search:
          search || undefined,

        status:
          statusFilter || undefined,

      }),

    [
      search,
      statusFilter,
    ]

  );


  // =====================================================
  // MODAL STATES
  // =====================================================

  const [
    formModal,
    setFormModal,
  ] = useState(null);


  const [
    pricingModal,
    setPricingModal,
  ] = useState(null);


  const [
    stockModal,
    setStockModal,
  ] = useState(null);


  const [
    commentsMedicine,
    setCommentsMedicine,
  ] = useState(null);


  const [
    statusConfirm,
    setStatusConfirm,
  ] = useState(null);


  // =====================================================
  // GENERAL UI STATE
  // =====================================================

  const [
    busy,
    setBusy,
  ] = useState(false);


  const [
    actionError,
    setActionError,
  ] = useState(null);


  // =====================================================
  // MEDICINES ARRAY
  // =====================================================

  const medicines =
    useMemo(

      () =>
        data?.medicines || [],

      [
        data,
      ]

    );


  // =====================================================
  // ADMIN VIEWER PERMISSION MESSAGE
  // =====================================================

  function denyAdminViewer() {

    setActionError(

      new ApiError(

        "You are logged in as an Admin Viewer. You can view all administrative information, but you do not have permission to make changes.",

        403,

        null

      )

    );

  }


  // =====================================================
  // ADD MEDICINE
  // =====================================================

  function handleAddMedicine() {

    if (
      isAdminViewer
    ) {

      denyAdminViewer();

      return;

    }


    setFormModal({

      mode:
        "create",

      initial:
        null,

    });

  }


  // =====================================================
  // EDIT MEDICINE
  // =====================================================

  function handleEditMedicine(
    medicine
  ) {

    if (
      isAdminViewer
    ) {

      denyAdminViewer();

      return;

    }


    setFormModal({

      mode:
        "edit",

      initial:
        medicine,

    });

  }


  // =====================================================
  // OPEN STOCK MODAL
  // =====================================================

  function handleOpenStock(
    medicine
  ) {

    if (
      isAdminViewer
    ) {

      denyAdminViewer();

      return;

    }


    setStockModal(
      medicine
    );

  }


  // =====================================================
  // OPEN PRICING MODAL
  // =====================================================

  function handleOpenPricing(
    medicine
  ) {

    if (
      isAdminViewer
    ) {

      denyAdminViewer();

      return;

    }


    setPricingModal(
      medicine
    );

  }


  // =====================================================
  // CHANGE STATUS
  // =====================================================

  function handleStatusChange(
    medicine,
    nextStatus
  ) {

    if (
      isAdminViewer
    ) {

      denyAdminViewer();

      return;

    }


    setStatusConfirm({

      medicine,

      nextStatus,

    });

  }


  // =====================================================
  // SAVE MEDICINE
  // =====================================================

  async function handleSaveMedicine(
    payload
  ) {

    setBusy(true);

    setActionError(null);


    try {

      if (
        formModal.mode ===
        "create"
      ) {

        await medicinesApi.create(
          payload
        );

      } else {

        await medicinesApi.update(

          formModal.initial.id,

          payload

        );

      }


      setFormModal(null);

      reload();

    } catch (
      err
    ) {

      setActionError(
        err
      );

    } finally {

      setBusy(false);

    }

  }


  // =====================================================
  // SAVE PRICING
  // =====================================================

  async function handleSavePricing(
    payload
  ) {

    setBusy(true);

    setActionError(null);


    try {

      await medicinesApi.updatePricing(

        pricingModal.id,

        payload

      );


      setPricingModal(null);

      reload();

    } catch (
      err
    ) {

      setActionError(
        err
      );

    } finally {

      setBusy(false);

    }

  }


  // =====================================================
  // SAVE STOCK
  // =====================================================

  async function handleSaveStock(
    payload
  ) {

    setBusy(true);

    setActionError(null);


    try {

      await medicinesApi.addStockMovement(

        stockModal.id,

        payload

      );


      setStockModal(null);

      reload();

    } catch (
      err
    ) {

      setActionError(
        err
      );

    } finally {

      setBusy(false);

    }

  }


  // =====================================================
  // CONFIRM STATUS CHANGE
  // =====================================================

  async function handleConfirmStatus() {

    setBusy(true);

    setActionError(null);


    try {

      const {

        medicine,

        nextStatus,

      } =
        statusConfirm;


      if (

        nextStatus ===
        "Discontinued"

      ) {

        await medicinesApi.deactivate(
          medicine.id
        );

      } else {

        await medicinesApi.reactivate(
          medicine.id
        );

      }


      setStatusConfirm(null);

      reload();

    } catch (
      err
    ) {

      setActionError(
        err
      );

      setStatusConfirm(null);

    } finally {

      setBusy(false);

    }

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div>


      {/* ================================================ */}
      {/* ACTION ERROR */}
      {/* ================================================ */}

      {actionError && (

        <ErrorBanner
          error={actionError}
        />

      )}


      {/* ================================================ */}
      {/* TOOLBAR */}
      {/* ================================================ */}

      <div className="toolbar">


        {/* SEARCH */}

        <div className="search-box">

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

            placeholder="Search by generic name, brand, class, or supplier…"

            value={search}

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }

          />

        </div>


        {/* STATUS FILTER */}

        <select

          className="input"

          style={{
            width:
              160,
          }}

          value={statusFilter}

          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }

        >

          <option value="">
            All statuses
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Discontinued">
            Discontinued
          </option>

        </select>


        {/* ADD MEDICINE */}

        <button

          className="btn btn-primary"

          onClick={
            handleAddMedicine
          }

        >

          + Add medicine

        </button>


      </div>


      {/* ================================================ */}
      {/* MEDICINES TABLE */}
      {/* ================================================ */}

      <div className="card">


        {loading ? (

          <LoadingState
            label="Loading medicines…"
          />

        ) : error ? (

          <ErrorBanner
            error={error}
          />

        ) : medicines.length === 0 ? (

          <EmptyState

            label={

              search ||
              statusFilter

                ? "No medicines match your filters."

                : "No medicines yet. Add your first one."

            }

          />

        ) : (

          <div className="table-wrap">


            <table className="table">


              {/* TABLE HEADER */}

              <thead>

                <tr>

                  <th>
                    Generic name
                  </th>

                  <th>
                    Brand
                  </th>

                  <th>
                    Dosage
                  </th>

                  <th>
                    Supplier
                  </th>

                  <th>
                    Qty
                  </th>

                  <th>
                    Price
                  </th>

                  <th>
                    Expiry
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                  </th>

                </tr>

              </thead>


              {/* TABLE BODY */}

              <tbody>


                {medicines.map(
                  (m) => (

                    <tr
                      key={m.id}
                    >


                      {/* GENERIC NAME */}

                      <td>

                        <div
                          style={{
                            fontWeight:
                              600,
                          }}
                        >

                          {
                            m.generic_name
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
                            m.medicine_class
                          }

                        </div>

                      </td>


                      {/* BRAND */}

                      <td>

                        {
                          m.brand_name
                        }

                      </td>


                      {/* DOSAGE */}

                      <td
                        className="mono"
                      >

                        {
                          m.dosage
                        }

                      </td>


                      {/* SUPPLIER */}

                      <td>

                        {
                          m.supplier ||
                          "-"
                        }

                      </td>


                      {/* QUANTITY */}

                      <td

                        className="mono"

                        style={{
                          fontWeight:
                            600,
                        }}

                      >

                        {
                          m.quantity
                        }

                      </td>


                      {/* PRICE */}

                      <td
                        className="mono"
                      >

                        {
                          formatMoney(
                            m.selling_price
                          )
                        }

                      </td>


                      {/* EXPIRY */}

                      <td>

                        {
                          formatDate(
                            m.expiry_date
                          )
                        }

                      </td>


                      {/* STATUS */}

                      <td>

                        <div

                          style={{

                            display:
                              "flex",

                            flexDirection:
                              "column",

                            gap:
                              4,

                          }}

                        >

                          <MedicineStatusBadge
                            status={
                              m.status
                            }
                          />


                          <StockSeverityBadge
                            medicine={
                              m
                            }
                          />

                        </div>

                      </td>


                      {/* ================================= */}
                      {/* ACTIONS */}
                      {/* ================================= */}

                      <td>

                        <div
                          className="table-actions"
                        >


                          {/* EDIT */}

                          <button

                            className="btn btn-ghost btn-sm"

                            onClick={() =>
                              handleEditMedicine(
                                m
                              )
                            }

                          >

                            Edit

                          </button>


                          {/* STOCK */}

                          <button

                            className="btn btn-ghost btn-sm"

                            onClick={() =>
                              handleOpenStock(
                                m
                              )
                            }

                          >

                            Stock

                          </button>


                          {/* COMMENTS */}

                          <button

                            className="btn btn-ghost btn-sm"

                            onClick={() =>
                              setCommentsMedicine(
                                m
                              )
                            }

                          >

                            Comments

                          </button>


                          {/* ================================= */}
                          {/* ADMIN CONTROLS */}
                          {/* Super Admin and Admin Viewer */}
                          {/* can BOTH SEE these controls. */}
                          {/* ================================= */}

                          {canViewAdminControls && (

                            <>


                              {/* PRICING */}

                              <button

                                className="btn btn-ghost btn-sm"

                                onClick={() =>
                                  handleOpenPricing(
                                    m
                                  )
                                }

                              >

                                Pricing

                              </button>


                              {/* DEACTIVATE */}

                              {

                                m.status ===
                                "Active" && (

                                  <button

                                    className="btn btn-ghost btn-sm"

                                    style={{
                                      color:
                                        "var(--danger)",
                                    }}

                                    onClick={() =>
                                      handleStatusChange(

                                        m,

                                        "Discontinued"

                                      )
                                    }

                                  >

                                    Deactivate

                                  </button>

                                )

                              }


                              {/* REACTIVATE */}

                              {

                                m.status ===
                                "Discontinued" && (

                                  <button

                                    className="btn btn-ghost btn-sm"

                                    style={{
                                      color:
                                        "var(--green-700)",
                                    }}

                                    onClick={() =>
                                      handleStatusChange(

                                        m,

                                        "Active"

                                      )
                                    }

                                  >

                                    Reactivate

                                  </button>

                                )

                              }


                            </>

                          )}


                        </div>

                      </td>


                    </tr>

                  )
                )}


              </tbody>


            </table>


          </div>

        )}


      </div>


      {/* ================================================ */}
      {/* MEDICINE FORM MODAL */}
      {/* ================================================ */}

      {formModal && (

        <MedicineFormModal

          mode={
            formModal.mode
          }

          initial={
            formModal.initial
          }

          onClose={() => {

            setFormModal(null);

            setActionError(null);

          }}

          onSave={
            handleSaveMedicine
          }

          busy={
            busy
          }

          error={
            actionError instanceof ApiError
              ? actionError
              : null
          }

        />

      )}


      {/* ================================================ */}
      {/* PRICING MODAL */}
      {/* ================================================ */}

      {pricingModal && (

        <PricingModal

          medicine={
            pricingModal
          }

          onClose={() => {

            setPricingModal(null);

            setActionError(null);

          }}

          onSave={
            handleSavePricing
          }

          busy={
            busy
          }

          error={
            actionError instanceof ApiError
              ? actionError
              : null
          }

        />

      )}


      {/* ================================================ */}
      {/* STOCK MODAL */}
      {/* ================================================ */}

      {stockModal && (

        <StockAdjustModal

          medicine={
            stockModal
          }

          onClose={() => {

            setStockModal(null);

            setActionError(null);

          }}

          onSave={
            handleSaveStock
          }

          busy={
            busy
          }

          error={
            actionError instanceof ApiError
              ? actionError
              : null
          }

        />

      )}


      {/* ================================================ */}
      {/* MEDICINE COMMENTS */}
      {/* ================================================ */}

      {commentsMedicine && (

        <MedicineComments

          medicine={
            commentsMedicine
          }

          onClose={() =>
            setCommentsMedicine(
              null
            )
          }

        />

      )}


      {/* ================================================ */}
      {/* STATUS CONFIRMATION */}
      {/* ================================================ */}

      {statusConfirm && (

        <ConfirmDialog

          title={

            statusConfirm.nextStatus ===
            "Discontinued"

              ? "Deactivate medicine"

              : "Reactivate medicine"

          }


          message={

            statusConfirm.nextStatus ===
            "Discontinued"

              ? `Deactivate ${statusConfirm.medicine.generic_name}? It will remain in the database and sales history, but can no longer be sold until reactivated.`

              : `Reactivate ${statusConfirm.medicine.generic_name}? It will become available for sale again.`

          }


          confirmLabel={

            statusConfirm.nextStatus ===
            "Discontinued"

              ? "Deactivate"

              : "Reactivate"

          }


          danger={

            statusConfirm.nextStatus ===
            "Discontinued"

          }


          busy={
            busy
          }


          onCancel={() =>
            setStatusConfirm(
              null
            )
          }


          onConfirm={
            handleConfirmStatus
          }

        />

      )}


    </div>

  );

}