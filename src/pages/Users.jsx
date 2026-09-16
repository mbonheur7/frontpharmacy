import React, { useState } from "react";

import { usersApi } from "../api/users";

import { useFetch } from "../hooks/useFetch";

import { useAuth } from "../context/AuthContext";

import {
  LoadingState,
  ErrorBanner,
} from "../components/StateViews";

import {
  Modal,
  ConfirmDialog,
} from "../components/Modal";

import {
  formatDateTime,
} from "../utils/formatters";


// =========================================================
// USERS PAGE
// =========================================================

export default function Users() {


  // =======================================================
  // AUTH / PERMISSIONS
  // =======================================================

  const {

    user: currentUser,

    isSuperAdmin,

  } = useAuth();


  /*
    Admin Viewer can SEE all controls.

    Only Super Admin can actually execute them.
  */

  const canExecuteActions =
    isSuperAdmin;


  // =======================================================
  // LOAD USERS
  // =======================================================

  const {

    data,

    loading,

    error,

    reload,

  } = useFetch(
    () => usersApi.list(),
    []
  );


  const users =
    data?.users || [];


  // =======================================================
  // MODAL STATE
  // =======================================================

  const [

    createOpen,

    setCreateOpen,

  ] = useState(false);


  const [

    resetTarget,

    setResetTarget,

  ] = useState(null);


  const [

    statusConfirm,

    setStatusConfirm,

  ] = useState(null);


  // =======================================================
  // ACTION STATE
  // =======================================================

  const [

    busy,

    setBusy,

  ] = useState(false);


  const [

    actionError,

    setActionError,

  ] = useState(null);


  // =======================================================
  // ACCESS DENIED MESSAGE
  // =======================================================

  /*
    This is used when an Admin Viewer clicks
    any action button.

    The button remains visible.

    But absolutely no API action is performed.
  */

  function showExecutionDenied() {

    setActionError(
      new Error(
        "Access restricted. You have view-only access and cannot perform administrative actions."
      )
    );

  }


  // =======================================================
  // ADD ACCOUNT BUTTON
  // =======================================================

  function handleOpenCreate() {


    /*
      Admin Viewer sees the button,
      but cannot open the action.
    */

    if (!canExecuteActions) {

      showExecutionDenied();

      return;

    }


    setActionError(null);

    setCreateOpen(true);

  }


  // =======================================================
  // RESET PASSWORD BUTTON
  // =======================================================

  function handleOpenReset(user) {


    /*
      Admin Viewer sees the button,
      but cannot execute the action.
    */

    if (!canExecuteActions) {

      showExecutionDenied();

      return;

    }


    setActionError(null);

    setResetTarget(user);

  }


  // =======================================================
  // ENABLE / DISABLE BUTTON
  // =======================================================

  function handleOpenStatus(user) {


    /*
      Admin Viewer sees the button,
      but cannot execute the action.
    */

    if (!canExecuteActions) {

      showExecutionDenied();

      return;

    }


    setActionError(null);

    setStatusConfirm(user);

  }


  // =======================================================
  // CREATE USER
  // =======================================================

  async function handleCreate(payload) {


    /*
      Extra protection.

      Even if this function somehow gets called,
      Admin Viewer cannot send the API request.
    */

    if (!canExecuteActions) {

      showExecutionDenied();

      return;

    }


    setBusy(true);

    setActionError(null);


    try {

      await usersApi.create(
        payload
      );


      setCreateOpen(false);


      reload();

    } catch (err) {

      setActionError(err);

    } finally {

      setBusy(false);

    }

  }


  // =======================================================
  // RESET PASSWORD
  // =======================================================

  async function handleResetPassword(password) {


    /*
      Extra protection.
    */

    if (!canExecuteActions) {

      showExecutionDenied();

      return;

    }


    if (!resetTarget) {

      return;

    }


    setBusy(true);

    setActionError(null);


    try {

      await usersApi.resetPassword(
        resetTarget.id,
        password
      );


      setResetTarget(null);


      reload();

    } catch (err) {

      setActionError(err);

    } finally {

      setBusy(false);

    }

  }


  // =======================================================
  // ENABLE / DISABLE ACCOUNT
  // =======================================================

  async function handleConfirmStatus() {


    /*
      Extra protection.
    */

    if (!canExecuteActions) {

      showExecutionDenied();

      return;

    }


    if (!statusConfirm) {

      return;

    }


    setBusy(true);

    setActionError(null);


    try {

      await usersApi.setStatus(

        statusConfirm.id,

        !statusConfirm.is_active

      );


      setStatusConfirm(null);


      reload();

    } catch (err) {

      setActionError(err);

      setStatusConfirm(null);

    } finally {

      setBusy(false);

    }

  }


  // =======================================================
  // HELPER:
  // CHECK WHETHER A USER IS A SUPER ADMIN
  // =======================================================

  function isSuperAdminAccount(user) {

    const role =
      (
        user?.role ||
        ""
      )
        .trim()
        .toLowerCase();


    return (
      role === "super admin" ||
      role === "super_admin"
    );

  }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div>


      {/* =================================================
          ACCESS / ACTION ERROR
          ================================================= */}

      {actionError && (

        <ErrorBanner
          error={actionError}
        />

      )}


      {/* =================================================
          TOOLBAR

          BOTH Super Admin AND Admin Viewer
          can SEE this button.

          Admin Viewer clicking it receives
          an access-restricted message.
          ================================================= */}

      <div
        className="toolbar"
        style={{
          justifyContent: "flex-end",
        }}
      >

        <button

          className="btn btn-primary"

          onClick={handleOpenCreate}

        >

          + Add account

        </button>

      </div>


      {/* =================================================
          USERS TABLE
          ================================================= */}

      <div
        className="card"
      >


        {loading ? (

          <LoadingState
            label="Loading users…"
          />

        ) : error ? (

          <ErrorBanner
            error={error}
          />

        ) : (

          <div
            className="table-wrap"
          >


            <table
              className="table"
            >


              {/* =========================================
                  TABLE HEADER
                  ========================================= */}

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Failed logins
                  </th>

                  <th>
                    Locked until
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                  </th>

                </tr>

              </thead>


              {/* =========================================
                  TABLE BODY
                  ========================================= */}

              <tbody>


                {users.map(
                  (u) => {


                    /*
                      IMPORTANT:

                      No Enable / Disable button
                      should exist for ANY Super Admin
                      account.

                      This applies regardless of who
                      is currently logged in.
                    */

                    const targetIsSuperAdmin =
                      isSuperAdminAccount(u);


                    /*
                      Status action is shown only when:

                      1. Target is NOT Super Admin
                      2. Target is NOT the current user

                      Admin Viewer can still SEE the
                      button for ordinary users.

                      Clicking it will show the access
                      restricted message.
                    */

                    const canShowStatusButton =

                      !targetIsSuperAdmin &&

                      u.id !== currentUser?.id;


                    return (

                      <tr
                        key={u.id}
                      >


                        {/* =================================
                            NAME
                            ================================= */}

                        <td
                          style={{
                            fontWeight: 600,
                          }}
                        >

                          {u.fullname}

                        </td>


                        {/* =================================
                            USERNAME
                            ================================= */}

                        <td
                          className="mono"
                        >

                          {u.username}

                        </td>


                        {/* =================================
                            ROLE
                            ================================= */}

                        <td>

                          <span
                            className={
                              "badge " +

                              (
                                targetIsSuperAdmin
                                  ? "badge-success"
                                  : "badge-info"
                              )
                            }
                          >

                            {u.role}

                          </span>

                        </td>


                        {/* =================================
                            STATUS
                            ================================= */}

                        <td>

                          <span
                            className={
                              "badge " +

                              (
                                u.is_active
                                  ? "badge-success"
                                  : "badge-neutral"
                              )
                            }
                          >

                            {
                              u.is_active
                                ? "Active"
                                : "Disabled"
                            }

                          </span>

                        </td>


                        {/* =================================
                            FAILED LOGINS
                            ================================= */}

                        <td
                          className="mono"
                        >

                          {u.failed_logins}

                        </td>


                        {/* =================================
                            LOCKED UNTIL
                            ================================= */}

                        <td>

                          {
                            u.locked_until

                              ? formatDateTime(
                                  u.locked_until
                                )

                              : "-"
                          }

                        </td>


                        {/* =================================
                            CREATED
                            ================================= */}

                        <td>

                          {
                            formatDateTime(
                              u.created_at
                            )
                          }

                        </td>


                        {/* =================================
                            ACTIONS
                            ================================= */}

                        <td>


                          <div
                            className="table-actions"
                          >


                            {/* =============================
                                RESET PASSWORD

                                Visible to:

                                Super Admin
                                Admin Viewer

                                Admin Viewer cannot execute.
                                ============================= */}

                            <button

                              className={
                                "btn btn-ghost btn-sm"
                              }

                              onClick={() =>
                                handleOpenReset(u)
                              }

                            >

                              Reset password

                            </button>


                            {/* =============================
                                ENABLE / DISABLE

                                IMPORTANT:

                                This button DOES NOT EXIST
                                for Super Admin accounts.

                                It remains visible for
                                ordinary users.

                                Admin Viewer clicking it
                                gets access restricted.
                                ============================= */}

                            {canShowStatusButton && (

                              <button

                                className={
                                  "btn btn-ghost btn-sm"
                                }

                                style={{
                                  color:

                                    u.is_active

                                      ? "var(--danger)"

                                      : "var(--green-700)",
                                }}

                                onClick={() =>
                                  handleOpenStatus(u)
                                }

                              >

                                {
                                  u.is_active

                                    ? "Disable"

                                    : "Enable"
                                }

                              </button>

                            )}


                          </div>


                        </td>


                      </tr>

                    );

                  }
                )}


              </tbody>


            </table>


          </div>

        )}


      </div>


      {/* =================================================
          CREATE USER MODAL

          Only Super Admin can actually open this.

          Admin Viewer gets blocked before reaching here.
          ================================================= */}

      {createOpen && (

        <CreateUserModal

          onClose={() => {

            setCreateOpen(false);

            setActionError(null);

          }}

          onSave={handleCreate}

          busy={busy}

          error={actionError}

        />

      )}


      {/* =================================================
          RESET PASSWORD MODAL
          ================================================= */}

      {resetTarget && (

        <ResetPasswordModal

          user={resetTarget}

          onClose={() => {

            setResetTarget(null);

            setActionError(null);

          }}

          onSave={handleResetPassword}

          busy={busy}

          error={actionError}

        />

      )}


      {/* =================================================
          ENABLE / DISABLE CONFIRMATION
          ================================================= */}

      {statusConfirm && (

        <ConfirmDialog

          title={
            statusConfirm.is_active

              ? "Disable account"

              : "Enable account"
          }


          message={

            statusConfirm.is_active

              ? `Disable ${statusConfirm.fullname}'s account? They won't be able to log in until re-enabled. This does not delete their account or history.`

              : `Re-enable ${statusConfirm.fullname}'s account? They will be able to log in again.`

          }


          confirmLabel={
            statusConfirm.is_active

              ? "Disable"

              : "Enable"
          }


          danger={
            statusConfirm.is_active
          }


          busy={busy}


          onCancel={() =>
            setStatusConfirm(null)
          }


          onConfirm={
            handleConfirmStatus
          }

        />

      )}


    </div>

  );

}


// =========================================================
// CREATE USER MODAL
// =========================================================

function CreateUserModal({

  onClose,

  onSave,

  busy,

  error,

}) {


  const [

    fullname,

    setFullname,

  ] = useState("");


  const [

    username,

    setUsername,

  ] = useState("");


  const [

    password,

    setPassword,

  ] = useState("");


  const [

    role,

    setRole,

  ] = useState("Pharmacist");


  const [

    localError,

    setLocalError,

  ] = useState("");


  // =======================================================
  // SUBMIT
  // =======================================================

  function handleSubmit(event) {


    event.preventDefault();


    setLocalError("");


    if (

      !fullname.trim() ||

      !username.trim() ||

      password.length < 8

    ) {

      setLocalError(
        "Fill in all fields — password needs at least 8 characters."
      );

      return;

    }


    onSave({

      fullname:
        fullname.trim(),

      username:
        username.trim(),

      password,

      role,

    });

  }


  const shownError =

    localError ||

    (
      error &&
      error.message
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <Modal

      title="Add account"

      onClose={onClose}

    >


      <form
        onSubmit={handleSubmit}
      >


        {/* FULL NAME */}

        <div
          className="field"
        >

          <label>
            Full name
          </label>


          <input

            className="input"

            value={fullname}

            onChange={(event) =>
              setFullname(
                event.target.value
              )
            }

            autoFocus

          />

        </div>


        {/* USERNAME */}

        <div
          className="field"
        >

          <label>
            Username
          </label>


          <input

            className="input"

            value={username}

            onChange={(event) =>
              setUsername(
                event.target.value
              )
            }

          />

        </div>


        {/* PASSWORD */}

        <div
          className="field"
        >

          <label>
            Password
          </label>


          <input

            className="input"

            type="password"

            value={password}

            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }

          />


          <div
            className="field-hint"
          >

            At least 8 characters.

          </div>


        </div>


        {/* ROLE */}

        <div
          className="field"
        >

          <label>
            Role
          </label>


          <select

            className="input"

            value={role}

            onChange={(event) =>
              setRole(
                event.target.value
              )
            }

          >

            <option
              value="Pharmacist"
            >
              Pharmacist
            </option>

            <option
              value="Admin Viewer"
            >
              Admin Viewer
            </option>

            <option
              value="Super Admin"
            >
              Super Admin
            </option>

          </select>


        </div>


        {/* ERROR */}

        {shownError && (

          <div
            className="field-error"
          >

            {shownError}

          </div>

        )}


        {/* ACTIONS */}

        <div
          className="modal-actions"
        >


          <button

            type="button"

            className="btn"

            onClick={onClose}

            disabled={busy}

          >

            Cancel

          </button>


          <button

            type="submit"

            className="btn btn-primary"

            disabled={busy}

          >

            {
              busy

                ? "Creating…"

                : "Create account"
            }

          </button>


        </div>


      </form>


    </Modal>

  );

}


// =========================================================
// RESET PASSWORD MODAL
// =========================================================

function ResetPasswordModal({

  user,

  onClose,

  onSave,

  busy,

  error,

}) {


  const [

    password,

    setPassword,

  ] = useState("");


  const [

    localError,

    setLocalError,

  ] = useState("");


  // =======================================================
  // SUBMIT
  // =======================================================

  function handleSubmit(event) {


    event.preventDefault();


    setLocalError("");


    if (
      password.length < 8
    ) {

      setLocalError(
        "Password needs at least 8 characters."
      );

      return;

    }


    onSave(password);

  }


  const shownError =

    localError ||

    (
      error &&
      error.message
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <Modal

      title={
        `Reset password — ${user.fullname}`
      }

      onClose={onClose}

    >


      <form
        onSubmit={handleSubmit}
      >


        {/* PASSWORD */}

        <div
          className="field"
        >

          <label>
            New password
          </label>


          <input

            className="input"

            type="password"

            value={password}

            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }

            autoFocus

          />

        </div>


        {/* ERROR */}

        {shownError && (

          <div
            className="field-error"
          >

            {shownError}

          </div>

        )}


        {/* ACTIONS */}

        <div
          className="modal-actions"
        >


          <button

            type="button"

            className="btn"

            onClick={onClose}

            disabled={busy}

          >

            Cancel

          </button>


          <button

            type="submit"

            className="btn btn-primary"

            disabled={busy}

          >

            {
              busy

                ? "Saving…"

                : "Reset password"
            }

          </button>


        </div>


      </form>


    </Modal>

  );

}