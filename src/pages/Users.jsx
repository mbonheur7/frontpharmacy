import React, { useState } from "react";
import { usersApi } from "../api/users";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { LoadingState, ErrorBanner } from "../components/StateViews";
import { Modal, ConfirmDialog } from "../components/Modal";
import { formatDateTime } from "../utils/formatters";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { data, loading, error, reload } = useFetch(() => usersApi.list(), []);
  const users = data?.users || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function handleCreate(payload) {
    setBusy(true);
    setActionError(null);
    try {
      await usersApi.create(payload);
      setCreateOpen(false);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(password) {
    setBusy(true);
    setActionError(null);
    try {
      await usersApi.resetPassword(resetTarget.id, password);
      setResetTarget(null);
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
      await usersApi.setStatus(statusConfirm.id, !statusConfirm.is_active);
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
      <div className="toolbar" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          + Add account
        </button>
      </div>

      <div className="card">
        {loading ? (
          <LoadingState label="Loading users…" />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Failed logins</th>
                  <th>Locked until</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.fullname}</td>
                    <td className="mono">{u.username}</td>
                    <td>
                      <span className={`badge ${u.role === "Admin" ? "badge-success" : "badge-info"}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? "badge-success" : "badge-neutral"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="mono">{u.failed_logins}</td>
                    <td>{u.locked_until ? formatDateTime(u.locked_until) : "-"}</td>
                    <td>{formatDateTime(u.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setResetTarget(u)}>
                          Reset password
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: u.is_active ? "var(--danger)" : "var(--green-700)" }}
                            onClick={() => setStatusConfirm(u)}
                          >
                            {u.is_active ? "Disable" : "Enable"}
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

      {createOpen && (
        <CreateUserModal
          onClose={() => { setCreateOpen(false); setActionError(null); }}
          onSave={handleCreate}
          busy={busy}
          error={actionError}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => { setResetTarget(null); setActionError(null); }}
          onSave={handleResetPassword}
          busy={busy}
          error={actionError}
        />
      )}

      {statusConfirm && (
        <ConfirmDialog
          title={statusConfirm.is_active ? "Disable account" : "Enable account"}
          message={
            statusConfirm.is_active
              ? `Disable ${statusConfirm.fullname}'s account? They won't be able to log in until re-enabled. This does not delete their account or history.`
              : `Re-enable ${statusConfirm.fullname}'s account? They will be able to log in again.`
          }
          confirmLabel={statusConfirm.is_active ? "Disable" : "Enable"}
          danger={statusConfirm.is_active}
          busy={busy}
          onCancel={() => setStatusConfirm(null)}
          onConfirm={handleConfirmStatus}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onSave, busy, error }) {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Pharmacist");
  const [localError, setLocalError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    if (!fullname.trim() || !username.trim() || password.length < 8) {
      setLocalError("Fill in all fields — password needs at least 8 characters.");
      return;
    }
    onSave({ fullname: fullname.trim(), username: username.trim(), password, role });
  }

  const shownError = localError || (error && error.message);

  return (
    <Modal title="Add account" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Full name</label>
          <input className="input" value={fullname} onChange={(e) => setFullname(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="field-hint">At least 8 characters.</div>
        </div>
        <div className="field">
          <label>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        {shownError && <div className="field-error">{shownError}</div>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onSave, busy, error }) {
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    if (password.length < 8) {
      setLocalError("Password needs at least 8 characters.");
      return;
    }
    onSave(password);
  }

  const shownError = localError || (error && error.message);

  return (
    <Modal title={`Reset password — ${user.fullname}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>New password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </div>
        {shownError && <div className="field-error">{shownError}</div>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Reset password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
